import { DownloadIcon, LogIcon } from "../utils/icons";

interface ActionButtonsProps {
  canRun: boolean;
  hasRun: boolean;
  hasChanges: boolean;
  onRun: () => void;
  onShowLog: () => void;
  onDownloadAll: () => void;
}

export function ActionButtons({ canRun, hasRun, hasChanges, onRun, onShowLog, onDownloadAll }: ActionButtonsProps) {
  return (
    <div class="buttons">
      <button id="run-btn" class="btn-primary" disabled={!canRun} onClick={onRun}>
        Run
      </button>
      {hasRun && (
        <button id="log-btn" class="btn-secondary btn-icon" onClick={onShowLog}>
          <LogIcon /> Show Log
        </button>
      )}
      {hasRun && hasChanges && (
        <button id="download-all-btn" class="btn-secondary btn-icon" onClick={onDownloadAll}>
          <DownloadIcon /> Download All
        </button>
      )}
    </div>
  );
}
