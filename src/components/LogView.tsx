import { FileProcessingLog } from "../types";

interface LogViewProps {
  logs: FileProcessingLog[];
}

export function LogView({ logs }: LogViewProps) {
  return (
    <div>
      {logs.map((fileLog, i) => (
        <div key={i} class="log-file-section">
          <h4>{fileLog.fileName}</h4>
          {fileLog.notes.length > 0 && (
            <div class="log-notes">
              {fileLog.notes.map((note, j) => (
                <p key={j}>{note}</p>
              ))}
            </div>
          )}
          {fileLog.summaries.length === 0 ? (
            <p class="log-no-changes">No changes</p>
          ) : (
            <ul class="log-list">
              {fileLog.summaries.map((summary, j) => (
                <li key={j}>{summary}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
