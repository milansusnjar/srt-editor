import { SrtFile, Subtitle } from "./types";
import { parseSrt, serializeSrt } from "./srt";
import { allPlugins } from "./plugins";
import { detectEncoding, decode, encode } from "./encoding";

// ---- State ----
const STORAGE_KEY = "srt-editor:pluginStates";
const files: SrtFile[] = [];
const pluginStates = new Map<string, { enabled: boolean; params: Record<string, number> }>();
let hasRun = false;

interface FileProcessingLog {
  fileName: string;
  summaries: string[];
  notes: string[];
}

let processingLogs: FileProcessingLog[] = [];

// ---- Plugin state management ----
for (const plugin of allPlugins) {
  const params: Record<string, number> = {};
  for (const p of plugin.params) params[p.key] = p.defaultValue;
  pluginStates.set(plugin.id, { enabled: plugin.enabled, params });
}

function loadPluginStates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const stored: Record<string, { enabled: boolean; params: Record<string, number> }> = JSON.parse(raw);
    for (const [id, saved] of Object.entries(stored)) {
      const state = pluginStates.get(id);
      if (!state) continue;
      state.enabled = saved.enabled;
      for (const [key, value] of Object.entries(saved.params)) {
        if (key in state.params) state.params[key] = value;
      }
    }
  } catch { /* ignore corrupted data */ }
}

function savePluginStates() {
  const obj: Record<string, { enabled: boolean; params: Record<string, number> }> = {};
  for (const [id, state] of pluginStates) {
    obj[id] = { enabled: state.enabled, params: { ...state.params } };
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}

loadPluginStates();

// ---- SVG Icons ----
const DOWNLOAD_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a.75.75 0 0 1 .75.75v6.69l2.22-2.22a.75.75 0 1 1 1.06 1.06l-3.5 3.5a.75.75 0 0 1-1.06 0l-3.5-3.5a.75.75 0 0 1 1.06-1.06l2.22 2.22V1.75A.75.75 0 0 1 8 1ZM2.75 11.5a.75.75 0 0 1 .75.75v1a.25.25 0 0 0 .25.25h8.5a.25.25 0 0 0 .25-.25v-1a.75.75 0 0 1 1.5 0v1A1.75 1.75 0 0 1 12.25 15h-8.5A1.75 1.75 0 0 1 2 13.25v-1a.75.75 0 0 1 .75-.75Z"/></svg>`;

const DIFF_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="1.5" y="1.5" width="13" height="13" rx="2"/><line x1="8" y1="1.5" x2="8" y2="14.5"/></svg>`;

const LOG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="2" y="1.5" width="12" height="13" rx="2"/><line x1="5" y1="5" x2="11" y2="5"/><line x1="5" y1="8" x2="11" y2="8"/><line x1="5" y1="11" x2="9" y2="11"/></svg>`;

// ---- Utility functions ----
function encodingLabel(enc: string): string {
  if (enc === "windows-1250") return "1250";
  if (enc === "windows-1251") return "1251";
  return enc.toUpperCase().replace("WINDOWS-", "");
}

function encodingClass(enc: string): string {
  return "enc-" + enc.replace("windows-", "").replace(/[\s-]/g, "").toLowerCase();
}

function getDownloadName(file: SrtFile): string {
  let name = file.name;
  if (pluginStates.get("cyrillization")?.enabled) {
    name = name.replace(/\.srt$/i, ".cyr.sr.srt");
  }
  return name;
}

function fileChanged(file: SrtFile): boolean {
  if (file.originalSubtitles.length !== file.subtitles.length) return true;
  for (let i = 0; i < file.subtitles.length; i++) {
    const orig = file.originalSubtitles[i];
    const proc = file.subtitles[i];
    if (orig.startMs !== proc.startMs || orig.endMs !== proc.endMs) return true;
    if (orig.lines.join("\n") !== proc.lines.join("\n")) return true;
  }
  return false;
}

// ---- File operations ----
function downloadFile(file: SrtFile) {
  const content = serializeSrt(file.subtitles);
  const bytes = encode(content, file.encoding);
  const blob = new Blob([bytes as unknown as ArrayBuffer], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = getDownloadName(file);
  a.click();
  URL.revokeObjectURL(url);
}

function downloadAll() {
  const changed = files.filter(f => fileChanged(f));
  for (const file of changed) downloadFile(file);
}

// ---- Modal system ----
function openModal(title: string, contentEl: HTMLElement) {
  closeModal();

  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeModal();
  });

  const modal = document.createElement("div");
  modal.className = "modal";

  const header = document.createElement("div");
  header.className = "modal-header";

  const titleEl = document.createElement("span");
  titleEl.textContent = title;
  header.appendChild(titleEl);

  const closeBtn = document.createElement("button");
  closeBtn.className = "modal-close";
  closeBtn.innerHTML = "&times;";
  closeBtn.addEventListener("click", closeModal);
  header.appendChild(closeBtn);

  const body = document.createElement("div");
  body.className = "modal-body";
  body.appendChild(contentEl);

  modal.appendChild(header);
  modal.appendChild(body);
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const backdrop = document.querySelector(".modal-backdrop");
  if (backdrop) {
    backdrop.remove();
    document.body.style.overflow = "";
  }
}

// ---- Diff ----
function highlightDiff(a: string, b: string, elA: HTMLElement, elB: HTMLElement) {
  let prefixLen = 0;
  while (prefixLen < a.length && prefixLen < b.length && a[prefixLen] === b[prefixLen]) {
    prefixLen++;
  }

  let suffixLen = 0;
  while (
    suffixLen < a.length - prefixLen &&
    suffixLen < b.length - prefixLen &&
    a[a.length - 1 - suffixLen] === b[b.length - 1 - suffixLen]
  ) {
    suffixLen++;
  }

  const prefix = a.slice(0, prefixLen);
  const aMid = a.slice(prefixLen, a.length - suffixLen);
  const bMid = b.slice(prefixLen, b.length - suffixLen);
  const suffix = a.slice(a.length - suffixLen);

  for (const [el, mid] of [[elA, aMid], [elB, bMid]] as const) {
    if (prefix) el.appendChild(document.createTextNode(prefix));
    if (mid) {
      const span = document.createElement("span");
      span.className = "diff-char";
      span.textContent = mid;
      el.appendChild(span);
    }
    if (suffix) el.appendChild(document.createTextNode(suffix));
  }
}

function openDiffModal(file: SrtFile) {
  const content = document.createElement("div");

  const headerRow = document.createElement("div");
  headerRow.className = "diff-header-row";
  headerRow.innerHTML = "<span>Original</span><span>Processed</span>";
  content.appendChild(headerRow);

  const grid = document.createElement("div");
  grid.className = "diff-grid";

  const origText = serializeSrt(file.originalSubtitles);
  const procText = serializeSrt(file.subtitles);
  const origLines = origText.split("\n");
  const procLines = procText.split("\n");
  const maxLen = Math.max(origLines.length, procLines.length);

  for (let i = 0; i < maxLen; i++) {
    const ol = origLines[i] ?? "";
    const pl = procLines[i] ?? "";

    const left = document.createElement("div");
    left.className = "diff-line";
    const right = document.createElement("div");
    right.className = "diff-line";

    if (ol === pl) {
      left.textContent = ol;
      right.textContent = pl;
    } else {
      left.classList.add("diff-line-changed");
      right.classList.add("diff-line-changed");
      highlightDiff(ol, pl, left, right);
    }

    grid.appendChild(left);
    grid.appendChild(right);
  }

  content.appendChild(grid);
  openModal(`Diff \u2014 ${file.name}`, content);
}

// ---- Log modal ----
function openLogModal() {
  const content = document.createElement("div");

  for (const fileLog of processingLogs) {
    const section = document.createElement("div");
    section.className = "log-file-section";

    const title = document.createElement("h4");
    title.textContent = fileLog.fileName;
    section.appendChild(title);

    if (fileLog.notes.length > 0) {
      const notesDiv = document.createElement("div");
      notesDiv.className = "log-notes";
      for (const note of fileLog.notes) {
        const p = document.createElement("p");
        p.textContent = note;
        notesDiv.appendChild(p);
      }
      section.appendChild(notesDiv);
    }

    if (fileLog.summaries.length === 0) {
      const noChanges = document.createElement("p");
      noChanges.className = "log-no-changes";
      noChanges.textContent = "No changes";
      section.appendChild(noChanges);
    } else {
      const ul = document.createElement("ul");
      ul.className = "log-list";
      for (const summary of fileLog.summaries) {
        const li = document.createElement("li");
        li.textContent = summary;
        ul.appendChild(li);
      }
      section.appendChild(ul);
    }

    content.appendChild(section);
  }

  openModal("Processing Log", content);
}

// ---- File handling ----
function handleFiles(fileList: FileList) {
  const srtFiles = Array.from(fileList).filter((f) => f.name.endsWith(".srt"));
  if (srtFiles.length === 0) return;

  if (hasRun) {
    files.length = 0;
    hasRun = false;
    processingLogs = [];
    document.getElementById("log-btn")!.style.display = "none";
    document.getElementById("download-all-btn")!.style.display = "none";
  }

  let loaded = 0;
  for (const file of srtFiles) {
    const reader = new FileReader();
    reader.onload = () => {
      const bytes = new Uint8Array(reader.result as ArrayBuffer);
      const encoding = detectEncoding(bytes);
      const content = decode(bytes, encoding);
      const subtitles = parseSrt(content);
      files.push({ name: file.name, encoding, originalEncoding: encoding, subtitles, originalSubtitles: subtitles });
      loaded++;
      if (loaded === srtFiles.length) {
        updateFileList();
      }
    };
    reader.readAsArrayBuffer(file);
  }
}

function updateFileList() {
  const dropZone = document.getElementById("drop-zone")!;
  const prompt = document.getElementById("drop-prompt")!;
  const itemsEl = document.getElementById("file-items")!;

  const runBtn = document.getElementById("run-btn") as HTMLButtonElement;
  runBtn.disabled = files.length === 0;

  if (files.length === 0) {
    prompt.style.display = "";
    itemsEl.style.display = "none";
    dropZone.classList.remove("has-files");
    itemsEl.innerHTML = "";
    return;
  }

  prompt.style.display = "none";
  itemsEl.style.display = "";
  dropZone.classList.add("has-files");
  itemsEl.innerHTML = "";

  for (const f of files) {
    const item = document.createElement("div");
    item.className = "file-item";

    const changed = hasRun && fileChanged(f);

    if (hasRun && !changed) {
      item.classList.add("unchanged");
    }

    const nameSpan = document.createElement("span");
    nameSpan.className = "file-name";
    const displayName = hasRun ? getDownloadName(f) : f.name;
    nameSpan.textContent = displayName;
    nameSpan.title = displayName;
    item.appendChild(nameSpan);

    if (hasRun && !changed) {
      const label = document.createElement("span");
      label.className = "not-changed-label";
      label.textContent = "Not changed";
      item.appendChild(label);
    } else {
      const enc = hasRun ? f.encoding : f.originalEncoding;
      const encTag = document.createElement("span");
      encTag.className = `encoding-tag ${encodingClass(enc)}`;
      encTag.textContent = encodingLabel(enc);
      item.appendChild(encTag);
    }

    if (changed) {
      const diffBtn = document.createElement("button");
      diffBtn.className = "file-action-btn";
      diffBtn.innerHTML = DIFF_ICON;
      diffBtn.title = "Show diff";
      diffBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openDiffModal(f);
      });
      item.appendChild(diffBtn);

      const dlBtn = document.createElement("button");
      dlBtn.className = "file-action-btn";
      dlBtn.innerHTML = DOWNLOAD_ICON;
      dlBtn.title = "Download";
      dlBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        downloadFile(f);
      });
      item.appendChild(dlBtn);
    }

    itemsEl.appendChild(item);
  }
}

// ---- Plugin execution ----
function runPlugins() {
  if (files.length === 0) return;

  const activePlugins = new Set<string>();
  const allConfigs = new Map<string, Record<string, number>>();

  for (const plugin of allPlugins) {
    const state = pluginStates.get(plugin.id)!;
    if (state.enabled) activePlugins.add(plugin.id);
    allConfigs.set(plugin.id, { ...state.params });
  }

  if (activePlugins.size === 0) return;

  processingLogs = [];

  for (const file of files) {
    let subtitles: Subtitle[] = file.originalSubtitles.map((s) => ({ ...s, lines: [...s.lines] }));
    file.encoding = file.originalEncoding;

    const pluginSummaries: string[] = [];

    for (const plugin of allPlugins) {
      if (!activePlugins.has(plugin.id)) continue;
      const params = allConfigs.get(plugin.id)!;
      const before = subtitles.map((s) => ({ startMs: s.startMs, endMs: s.endMs, lines: [...s.lines] }));
      subtitles = plugin.run(subtitles, params, activePlugins, allConfigs);

      let changes = 0;
      const len = Math.min(subtitles.length, before.length);
      for (let i = 0; i < len; i++) {
        const timingChanged = subtitles[i].startMs !== before[i].startMs || subtitles[i].endMs !== before[i].endMs;
        const textChanged = subtitles[i].lines.join("\n") !== before[i].lines.join("\n");
        if (timingChanged || textChanged) changes++;
      }

      if (changes > 0) {
        if (plugin.id === "cyrillization") {
          pluginSummaries.push("Transliterated to Cyrillic");
        } else {
          pluginSummaries.push(`${plugin.name} applied in ${changes} subtitle lines`);
        }
      }
    }

    file.subtitles = subtitles;

    const notes: string[] = [];
    if (activePlugins.has("cyrillization") && file.encoding === "windows-1250") {
      file.encoding = "windows-1251";
      notes.push("Encoding changed: Windows-1250 \u2192 Windows-1251");
    }

    processingLogs.push({ fileName: file.name, summaries: pluginSummaries, notes });
  }

  hasRun = true;
  updateFileList();

  document.getElementById("log-btn")!.style.display = "";
  const hasChanged = files.some((f) => fileChanged(f));
  document.getElementById("download-all-btn")!.style.display = hasChanged ? "" : "none";
}

// ---- UI construction ----
function buildUI() {
  const app = document.getElementById("app")!;

  // Drop zone (full width)
  const dropZone = document.createElement("div");
  dropZone.id = "drop-zone";

  const dropPrompt = document.createElement("div");
  dropPrompt.id = "drop-prompt";
  dropPrompt.innerHTML = `<p>Drop .srt file(s) here</p><p class="hint">or click to select</p>`;
  dropZone.appendChild(dropPrompt);

  const fileItems = document.createElement("div");
  fileItems.id = "file-items";
  fileItems.style.display = "none";
  dropZone.appendChild(fileItems);

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".srt";
  fileInput.multiple = true;
  fileInput.style.display = "none";

  dropZone.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).closest(".file-item, button")) return;
    fileInput.click();
  });
  fileInput.addEventListener("change", () => {
    if (fileInput.files && fileInput.files.length > 0) {
      handleFiles(fileInput.files);
      fileInput.value = "";
    }
  });

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });
  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
  });
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    if (e.dataTransfer?.files) handleFiles(e.dataTransfer.files);
  });

  app.appendChild(dropZone);
  app.appendChild(fileInput);

  // Buttons
  const btnContainer = document.createElement("div");
  btnContainer.className = "buttons";

  const runBtn = document.createElement("button");
  runBtn.id = "run-btn";
  runBtn.textContent = "Run";
  runBtn.className = "btn-primary";
  runBtn.disabled = true;
  runBtn.addEventListener("click", runPlugins);
  btnContainer.appendChild(runBtn);

  const logBtn = document.createElement("button");
  logBtn.id = "log-btn";
  logBtn.className = "btn-secondary btn-icon";
  logBtn.innerHTML = LOG_ICON + " Show Log";
  logBtn.style.display = "none";
  logBtn.addEventListener("click", openLogModal);
  btnContainer.appendChild(logBtn);

  const dlAllBtn = document.createElement("button");
  dlAllBtn.id = "download-all-btn";
  dlAllBtn.className = "btn-secondary btn-icon";
  dlAllBtn.innerHTML = DOWNLOAD_ICON + " Download All";
  dlAllBtn.style.display = "none";
  dlAllBtn.addEventListener("click", downloadAll);
  btnContainer.appendChild(dlAllBtn);

  app.appendChild(btnContainer);

  // Plugins
  const pluginsLabel = document.createElement("h3");
  pluginsLabel.textContent = "Plugins";
  app.appendChild(pluginsLabel);

  const pluginsContainer = document.createElement("div");
  pluginsContainer.id = "plugins";

  for (const plugin of allPlugins) {
    const state = pluginStates.get(plugin.id)!;
    const card = document.createElement("div");
    card.className = "plugin-card";

    const header = document.createElement("label");
    header.className = "plugin-header";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = state.enabled;
    checkbox.addEventListener("change", () => {
      state.enabled = checkbox.checked;
      paramContainer.style.opacity = checkbox.checked ? "1" : "0.4";
      savePluginStates();
    });

    const nameSpan = document.createElement("span");
    nameSpan.className = "plugin-name";
    nameSpan.textContent = plugin.name;

    const infoIcon = document.createElement("span");
    infoIcon.className = "plugin-info";
    infoIcon.textContent = "?";
    const tooltip = document.createElement("span");
    tooltip.className = "plugin-tooltip";
    tooltip.textContent = plugin.description;
    infoIcon.appendChild(tooltip);

    header.appendChild(checkbox);
    header.appendChild(nameSpan);
    header.appendChild(infoIcon);
    card.appendChild(header);

    const paramContainer = document.createElement("div");
    paramContainer.className = "plugin-params";
    paramContainer.style.opacity = state.enabled ? "1" : "0.4";

    for (const param of plugin.params) {
      const paramRow = document.createElement("div");
      paramRow.className = "param-row";

      const label = document.createElement("label");
      label.textContent = param.label + ": ";

      const input = document.createElement("input");
      input.type = "number";
      input.value = String(state.params[param.key]);
      input.min = String(param.min ?? 0);
      input.step = String(param.step ?? 1);
      input.addEventListener("change", () => {
        state.params[param.key] = parseFloat(input.value);
        savePluginStates();
      });

      label.appendChild(input);
      paramRow.appendChild(label);
      paramContainer.appendChild(paramRow);
    }

    card.appendChild(paramContainer);
    pluginsContainer.appendChild(card);
  }

  app.appendChild(pluginsContainer);

  // Escape key closes modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

document.addEventListener("DOMContentLoaded", buildUI);
