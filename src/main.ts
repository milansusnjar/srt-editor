import { SrtFile, Subtitle } from "./types";
import { parseSrt, serializeSrt } from "./srt";
import { allPlugins } from "./plugins";
import { detectEncoding, decode, encode } from "./encoding";

const STORAGE_KEY = "srt-editor:pluginStates";
const files: SrtFile[] = [];
const pluginStates = new Map<string, { enabled: boolean; params: Record<string, number> }>();

// Initialize plugin states with defaults
for (const plugin of allPlugins) {
  const params: Record<string, number> = {};
  for (const p of plugin.params) {
    params[p.key] = p.defaultValue;
  }
  pluginStates.set(plugin.id, { enabled: plugin.enabled, params });
}

// Restore persisted states (safe merge: ignores unknown plugins/params, keeps new defaults)
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
        if (key in state.params) {
          state.params[key] = value;
        }
      }
    }
  } catch {
    // Corrupted data — ignore, keep defaults
  }
}

function savePluginStates() {
  const obj: Record<string, { enabled: boolean; params: Record<string, number> }> = {};
  for (const [id, state] of pluginStates) {
    obj[id] = { enabled: state.enabled, params: { ...state.params } };
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}

loadPluginStates();

function log(msg: string) {
  const logEl = document.getElementById("log")!;
  const line = document.createElement("div");
  line.textContent = msg;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
}

function clearLog() {
  document.getElementById("log")!.innerHTML = "";
}

function updateFileList() {
  const listEl = document.getElementById("file-list")!;
  if (files.length === 0) {
    listEl.textContent = "No files loaded.";
    return;
  }
  listEl.textContent = files.map((f) => f.name).join(", ");
}

function handleFiles(fileList: FileList) {
  const srtFiles = Array.from(fileList).filter((f) => f.name.endsWith(".srt"));
  if (srtFiles.length === 0) {
    log("No .srt files found in the dropped files.");
    return;
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
        log(`Uploaded ${srtFiles.length} file(s): ${srtFiles.map((f) => f.name).join(", ")}`);
        for (const f of files.slice(-srtFiles.length)) {
          log(`  ${f.name} — encoding: ${f.encoding}`);
        }
        updateFileList();
      }
    };
    reader.readAsArrayBuffer(file);
  }
}

function runPlugins() {
  if (files.length === 0) {
    log("No files loaded. Drop .srt files first.");
    return;
  }

  const activePlugins = new Set<string>();
  const allConfigs = new Map<string, Record<string, number>>();

  for (const plugin of allPlugins) {
    const state = pluginStates.get(plugin.id)!;
    if (state.enabled) activePlugins.add(plugin.id);
    allConfigs.set(plugin.id, { ...state.params });
  }

  if (activePlugins.size === 0) {
    log("No plugins enabled. Enable at least one plugin.");
    return;
  }

  log("--- Running plugins ---");

  for (const file of files) {
    let subtitles: Subtitle[] = file.originalSubtitles.map((s) => ({ ...s, lines: [...s.lines] }));
    file.encoding = file.originalEncoding;

    for (const plugin of allPlugins) {
      if (!activePlugins.has(plugin.id)) continue;
      const params = allConfigs.get(plugin.id)!;
      const before = subtitles.map((s) => ({ endMs: s.endMs, text: s.lines.join("\n") }));
      subtitles = plugin.run(subtitles, params, activePlugins, allConfigs);
      let changes = 0;
      for (let i = 0; i < subtitles.length; i++) {
        if (subtitles[i].endMs !== before[i].endMs || subtitles[i].lines.join("\n") !== before[i].text) changes++;
      }
      log(`  [${file.name}] ${plugin.name}: ${changes} subtitle(s) modified`);
    }

    file.subtitles = subtitles;

    if (activePlugins.has("cyrillization") && file.encoding === "windows-1250") {
      file.encoding = "windows-1251";
      log(`  [${file.name}] Encoding changed: windows-1250 → windows-1251`);
    }
  }

  log("Done. Click 'Download All' to save results.");

  // Show diff button, reset diff state
  const diffBtn = document.querySelector(".diff-toggle") as HTMLButtonElement;
  diffBtn.style.display = "";
  diffBtn.textContent = "Show Diff";
  const diffContainer = document.getElementById("diff")!;
  diffContainer.style.display = "none";
  diffContainer.innerHTML = "";
  document.getElementById("diff-label")!.style.display = "none";
}

function downloadAll() {
  if (files.length === 0) {
    log("No files to download.");
    return;
  }

  for (const file of files) {
    const content = serializeSrt(file.subtitles);
    const bytes = encode(content, file.encoding);
    const blob = new Blob([bytes as unknown as ArrayBuffer], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    let downloadName = file.name;
    if (pluginStates.get("cyrillization")?.enabled) {
      downloadName = downloadName.replace(/\.srt$/i, ".cyr.sr.srt");
    }
    a.download = downloadName;
    a.click();
    URL.revokeObjectURL(url);
  }

  log(`Downloaded ${files.length} file(s).`);
}

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

function renderDiff() {
  const container = document.getElementById("diff")!;
  container.innerHTML = "";

  for (const file of files) {
    const details = document.createElement("details");
    details.className = "diff-file";

    const summary = document.createElement("summary");
    summary.textContent = file.name;
    details.appendChild(summary);

    const headerRow = document.createElement("div");
    headerRow.className = "diff-header-row";
    headerRow.innerHTML = "<span>Original</span><span>Processed</span>";
    details.appendChild(headerRow);

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

    details.appendChild(grid);
    container.appendChild(details);
  }
}

function buildUI() {
  const app = document.getElementById("app")!;

  // Drop zone
  const dropZone = document.createElement("div");
  dropZone.id = "drop-zone";
  dropZone.innerHTML = `<p>Drop .srt file(s) here</p><p class="hint">or click to select</p>`;

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".srt";
  fileInput.multiple = true;
  fileInput.style.display = "none";

  dropZone.addEventListener("click", () => fileInput.click());
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
    if (e.dataTransfer?.files) {
      handleFiles(e.dataTransfer.files);
    }
  });

  app.appendChild(dropZone);
  app.appendChild(fileInput);

  // File list
  const fileListLabel = document.createElement("h3");
  fileListLabel.textContent = "Loaded Files";
  app.appendChild(fileListLabel);

  const fileList = document.createElement("div");
  fileList.id = "file-list";
  fileList.textContent = "No files loaded.";
  app.appendChild(fileList);

  // Plugins section
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

    header.appendChild(checkbox);
    header.appendChild(nameSpan);
    card.appendChild(header);

    const desc = document.createElement("div");
    desc.className = "plugin-desc";
    desc.textContent = plugin.description;
    card.appendChild(desc);

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

  // Buttons
  const btnContainer = document.createElement("div");
  btnContainer.className = "buttons";

  const runBtn = document.createElement("button");
  runBtn.textContent = "Run";
  runBtn.className = "btn-primary";
  runBtn.addEventListener("click", runPlugins);

  const downloadBtn = document.createElement("button");
  downloadBtn.textContent = "Download All";
  downloadBtn.className = "btn-secondary";
  downloadBtn.addEventListener("click", downloadAll);

  const clearBtn = document.createElement("button");
  clearBtn.textContent = "Clear Log";
  clearBtn.className = "btn-secondary";
  clearBtn.addEventListener("click", clearLog);

  const diffBtn = document.createElement("button");
  diffBtn.textContent = "Show Diff";
  diffBtn.className = "btn-secondary diff-toggle";
  diffBtn.style.display = "none";
  diffBtn.addEventListener("click", () => {
    const diffContainer = document.getElementById("diff")!;
    const diffLabel = document.getElementById("diff-label")!;
    const visible = diffContainer.style.display !== "none";
    if (visible) {
      diffContainer.style.display = "none";
      diffLabel.style.display = "none";
      diffBtn.textContent = "Show Diff";
    } else {
      renderDiff();
      diffContainer.style.display = "";
      diffLabel.style.display = "";
      diffBtn.textContent = "Hide Diff";
    }
  });

  btnContainer.appendChild(runBtn);
  btnContainer.appendChild(downloadBtn);
  btnContainer.appendChild(diffBtn);
  btnContainer.appendChild(clearBtn);
  app.appendChild(btnContainer);

  // Log section
  const logLabel = document.createElement("h3");
  logLabel.textContent = "Log";
  app.appendChild(logLabel);

  const logEl = document.createElement("div");
  logEl.id = "log";
  app.appendChild(logEl);

  // Diff section
  const diffLabel = document.createElement("h3");
  diffLabel.id = "diff-label";
  diffLabel.textContent = "Diff";
  diffLabel.style.display = "none";
  app.appendChild(diffLabel);

  const diffContainer = document.createElement("div");
  diffContainer.id = "diff";
  diffContainer.className = "diff-container";
  diffContainer.style.display = "none";
  app.appendChild(diffContainer);
}

document.addEventListener("DOMContentLoaded", buildUI);
