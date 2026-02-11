import { SrtFile } from "../types";
import { encodingLabel, encodingClass, fileChanged, getDownloadName, downloadFile } from "../utils/files";
import { DownloadIcon, DiffIcon } from "../utils/icons";
import { PluginStateEntry } from "../hooks/usePluginState";

interface FileItemProps {
  file: SrtFile;
  hasRun: boolean;
  pluginStates: Map<string, PluginStateEntry>;
  onShowDiff: (file: SrtFile) => void;
}

export function FileItem({ file, hasRun, pluginStates, onShowDiff }: FileItemProps) {
  const changed = hasRun && fileChanged(file);
  const unchanged = hasRun && !changed;
  const displayName = hasRun ? getDownloadName(file, pluginStates) : file.name;
  const enc = hasRun ? file.encoding : file.originalEncoding;

  return (
    <div class={`file-item${unchanged ? " unchanged" : ""}`}>
      <span class="file-name" title={displayName}>{displayName}</span>
      {unchanged ? (
        <span class="not-changed-label">Not changed</span>
      ) : (
        <span class={`encoding-tag ${encodingClass(enc)}`}>{encodingLabel(enc)}</span>
      )}
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
