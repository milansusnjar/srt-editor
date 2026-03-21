import { useRef } from "preact/hooks";
import { SrtFile } from "../types";
import { encodingLabel, encodingClass, fileChanged, getDownloadName, downloadFile } from "../utils/files";
import { CloseIcon, DownloadIcon, DiffIcon, InfoIcon } from "../utils/icons";
import { PluginStateEntry } from "../hooks/usePluginState";

interface FileItemProps {
  file: SrtFile;
  hasRun: boolean;
  pluginStates: Map<string, PluginStateEntry>;
  onShowDiff: (file: SrtFile) => void;
  onShowInfo: (file: SrtFile) => void;
  onRemove: (file: SrtFile) => void;
}

export function FileItem({ file, hasRun, pluginStates, onShowDiff, onShowInfo, onRemove }: FileItemProps) {
  const changed = hasRun && fileChanged(file);
  const unchanged = hasRun && !changed;
  const displayName = hasRun ? getDownloadName(file, pluginStates) : file.name;
  const enc = hasRun ? file.encoding : file.originalEncoding;
  const rowRef = useRef<HTMLDivElement>(null);

  const handleRemove = (e: MouseEvent) => {
    e.stopPropagation();
    const el = rowRef.current;
    if (el) {
      // Phase 1: fade out + slide
      el.classList.add("removing");
      el.addEventListener("transitionend", (ev) => {
        if (ev.propertyName !== "opacity") return;
        // Phase 2: collapse height
        el.style.height = el.offsetHeight + "px";
        requestAnimationFrame(() => {
          el.classList.add("collapsing");
          el.addEventListener("transitionend", () => onRemove(file), { once: true });
        });
      }, { once: true });
    } else {
      onRemove(file);
    }
  };

  return (
    <div ref={rowRef} class={`file-item${unchanged ? " unchanged" : ""}`}>
      <button
        class="file-action-btn"
        title="Remove file"
        onClick={handleRemove}
      >
        <CloseIcon />
      </button>
      <span class="file-name" title={displayName}>{displayName}</span>
      {unchanged ? (
        <span class="not-changed-label">Not changed</span>
      ) : (
        <span class={`encoding-tag ${encodingClass(enc)}`}>{encodingLabel(enc)}</span>
      )}
      <button
        class="file-action-btn"
        title="File info"
        onClick={(e) => { e.stopPropagation(); onShowInfo(file); }}
      >
        <InfoIcon />
      </button>
      {changed && (
        <>
          <button
            class="file-action-btn"
            title="Show diff"
            onClick={(e) => { e.stopPropagation(); onShowDiff(file); }}
          >
            <DiffIcon />
          </button>
          <button
            class="file-action-btn"
            title="Download"
            onClick={(e) => { e.stopPropagation(); downloadFile(file, pluginStates); }}
          >
            <DownloadIcon />
          </button>
        </>
      )}
    </div>
  );
}
