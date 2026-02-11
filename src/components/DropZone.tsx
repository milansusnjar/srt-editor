import { useRef, useState } from "preact/hooks";
import { SrtFile } from "../types";
import { FileItem } from "./FileItem";
import { PluginStateEntry } from "../hooks/usePluginState";

interface DropZoneProps {
  files: SrtFile[];
  hasRun: boolean;
  pluginStates: Map<string, PluginStateEntry>;
  onFiles: (fileList: FileList) => void;
  onShowDiff: (file: SrtFile) => void;
}

export function DropZone({ files, hasRun, pluginStates, onFiles, onShowDiff }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragover, setDragover] = useState(false);
  const hasFiles = files.length > 0;

  const zoneClasses = [
    "drop-zone",
    hasFiles ? "has-files" : "",
    dragover ? "dragover" : "",
  ].filter(Boolean).join(" ");

  const handleClick = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest(".file-item, button")) return;
    inputRef.current?.click();
  };

  const handleChange = () => {
    const input = inputRef.current;
    if (input?.files && input.files.length > 0) {
      onFiles(input.files);
      input.value = "";
    }
  };

  return (
    <>
      <div
        id="drop-zone"
        class={zoneClasses}
        onClick={handleClick}
        onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
        onDragLeave={() => setDragover(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragover(false);
          if (e.dataTransfer?.files) onFiles(e.dataTransfer.files);
        }}
      >
        {!hasFiles && (
          <div id="drop-prompt">
            <p>Drop .srt file(s) here</p>
            <p class="hint">or click to select</p>
          </div>
        )}
        {hasFiles && (
          <div id="file-items">
            {files.map((f) => (
              <FileItem
                key={f.name}
                file={f}
                hasRun={hasRun}
                pluginStates={pluginStates}
                onShowDiff={onShowDiff}
              />
            ))}
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".srt"
        multiple
        style={{ display: "none" }}
        onChange={handleChange}
      />
    </>
  );
}
