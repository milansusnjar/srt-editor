import { render } from "preact";
import { useState, useCallback } from "preact/hooks";
import { SrtFile, Subtitle, FileProcessingLog } from "./types";
import { parseSrt } from "./srt";
import { allPlugins } from "./plugins";
import { ENCODING_MAP } from "./plugins/encoding";
import { detectEncoding, decode } from "./encoding";
import { usePluginState } from "./hooks/usePluginState";
import { fileChanged, downloadFile } from "./utils/files";
import { DropZone } from "./components/DropZone";
import { ActionButtons } from "./components/ActionButtons";
import { PluginList } from "./components/PluginList";
import { Modal } from "./components/Modal";
import { DiffView } from "./components/DiffView";
import { LogView } from "./components/LogView";
import { InfoView } from "./components/InfoView";

const VERSION = "1.10";

type ModalState =
  | { type: "diff"; file: SrtFile }
  | { type: "info"; file: SrtFile }
  | { type: "log" }
  | null;

function App() {
  const [files, setFiles] = useState<SrtFile[]>([]);
  const [hasRun, setHasRun] = useState(false);
  const [processingLogs, setProcessingLogs] = useState<FileProcessingLog[]>([]);
  const [modal, setModal] = useState<ModalState>(null);
  const { pluginStates, togglePlugin, setParam } = usePluginState();

  const handleFiles = useCallback((fileList: FileList) => {
    const srtFiles = Array.from(fileList).filter((f) => f.name.endsWith(".srt"));
    if (srtFiles.length === 0) return;

    setHasRun(false);
    setProcessingLogs([]);

    let loaded = 0;
    const newFiles: SrtFile[] = [];

    for (const file of srtFiles) {
      const reader = new FileReader();
      reader.onload = () => {
        const bytes = new Uint8Array(reader.result as ArrayBuffer);
        const encoding = detectEncoding(bytes);
        const content = decode(bytes, encoding);
        const subtitles = parseSrt(content);
        newFiles.push({
          name: file.name,
          encoding,
          originalEncoding: encoding,
          subtitles,
          originalSubtitles: subtitles,
        });
        loaded++;
        if (loaded === srtFiles.length) {
          setFiles(newFiles);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }, []);

  const runPlugins = useCallback(() => {
    if (files.length === 0) return;

    const activePlugins = new Set<string>();
    const allConfigs = new Map<string, Record<string, number>>();

    for (const plugin of allPlugins) {
      const state = pluginStates.get(plugin.id)!;
      if (state.enabled) activePlugins.add(plugin.id);
      allConfigs.set(plugin.id, { ...state.params });
    }

    if (activePlugins.size === 0) return;

    const logs: FileProcessingLog[] = [];
    const updatedFiles = files.map((file) => {
      let subtitles: Subtitle[] = file.originalSubtitles.map((s) => ({
        ...s,
        lines: [...s.lines],
      }));
      let encoding = file.originalEncoding;

      const pluginSummaries: string[] = [];

      for (const plugin of allPlugins) {
        if (!activePlugins.has(plugin.id)) continue;
        const params = allConfigs.get(plugin.id)!;
        const before = subtitles.map((s) => ({
          startMs: s.startMs,
          endMs: s.endMs,
          lines: [...s.lines],
        }));
        subtitles = plugin.run(subtitles, params, activePlugins, allConfigs);

        let changes = 0;
        const len = Math.min(subtitles.length, before.length);
        for (let i = 0; i < len; i++) {
          const timingChanged =
            subtitles[i].startMs !== before[i].startMs ||
            subtitles[i].endMs !== before[i].endMs;
          const textChanged =
            subtitles[i].lines.join("\n") !== before[i].lines.join("\n");
          if (timingChanged || textChanged) changes++;
        }

        const removed = before.length - subtitles.length;

        if (removed > 0 && plugin.id === "removeAds") {
          pluginSummaries.push(`Removed ${removed} ad subtitle${removed > 1 ? "s" : ""}`);
        } else if (changes > 0) {
          if (plugin.id === "cyrillization") {
            pluginSummaries.push("Transliterated to Cyrillic");
          } else {
            pluginSummaries.push(
              `${plugin.name} applied in ${changes} subtitle lines`
            );
          }
        }
      }

      const notes: string[] = [];
      if (activePlugins.has("encoding")) {
        const targetValue = allConfigs.get("encoding")!.targetEncoding;
        const targetEncoding = ENCODING_MAP[targetValue];
        if (targetEncoding && targetEncoding !== encoding) {
          const prev = encoding;
          encoding = targetEncoding;
          notes.push(`Encoding changed: ${prev} \u2192 ${encoding}`);
        }
      }
      if (activePlugins.has("cyrillization") && encoding === "windows-1250") {
        encoding = "windows-1251";
        notes.push("Encoding override: Windows-1250 \u2192 Windows-1251 (Cyrillic required)");
      }

      logs.push({ fileName: file.name, summaries: pluginSummaries, notes });

      return { ...file, subtitles, encoding };
    });

    setFiles(updatedFiles);
    setProcessingLogs(logs);
    setHasRun(true);
  }, [files, pluginStates]);

  const downloadAll = useCallback(() => {
    const changed = files.filter((f) => fileChanged(f));
    for (const file of changed) downloadFile(file, pluginStates);
  }, [files, pluginStates]);

  const hasChanges = hasRun && files.some((f) => fileChanged(f));
  const closeModal = useCallback(() => setModal(null), []);

  return (
    <>
      <h1 title={`Version ${VERSION}`}>SRT Editor</h1>
      <DropZone
        files={files}
        hasRun={hasRun}
        pluginStates={pluginStates}
        onFiles={handleFiles}
        onShowDiff={(file) => setModal({ type: "diff", file })}
        onShowInfo={(file) => setModal({ type: "info", file })}
      />
      <ActionButtons
        canRun={files.length > 0}
        hasRun={hasRun}
        hasChanges={hasChanges}
        onRun={runPlugins}
        onShowLog={() => setModal({ type: "log" })}
        onDownloadAll={downloadAll}
      />
      <PluginList
        pluginStates={pluginStates}
        onToggle={togglePlugin}
        onParamChange={setParam}
      />
      {modal?.type === "diff" && (
        <Modal title={`Diff \u2014 ${modal.file.name}`} onClose={closeModal}>
          <DiffView file={modal.file} />
        </Modal>
      )}
      {modal?.type === "info" && (
        <Modal title={`Info — ${modal.file.name}`} onClose={closeModal}>
          <InfoView file={modal.file} hasRun={hasRun} />
        </Modal>
      )}
      {modal?.type === "log" && (
        <Modal title="Processing Log" onClose={closeModal}>
          <LogView logs={processingLogs} />
        </Modal>
      )}
    </>
  );
}

render(<App />, document.getElementById("app")!);
