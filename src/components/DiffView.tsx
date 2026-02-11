import { SrtFile } from "../types";
import { serializeSrt } from "../srt";
import { computeDiff, DiffSegment } from "../utils/diff";

interface DiffViewProps {
  file: SrtFile;
}

function DiffLine({ segments }: { segments: DiffSegment[] }) {
  return (
    <div class="diff-line diff-line-changed">
      {segments.map((seg, i) =>
        seg.changed ? <span key={i} class="diff-char">{seg.text}</span> : seg.text
      )}
    </div>
  );
}

export function DiffView({ file }: DiffViewProps) {
  const origText = serializeSrt(file.originalSubtitles);
  const procText = serializeSrt(file.subtitles);
  const origLines = origText.split("\n");
  const procLines = procText.split("\n");
  const maxLen = Math.max(origLines.length, procLines.length);

  const rows: { left: string | DiffSegment[]; right: string | DiffSegment[] }[] = [];
  for (let i = 0; i < maxLen; i++) {
    const ol = origLines[i] ?? "";
    const pl = procLines[i] ?? "";
    if (ol === pl) {
      rows.push({ left: ol, right: pl });
    } else {
      const { left, right } = computeDiff(ol, pl);
      rows.push({ left, right });
    }
  }

  return (
    <div>
      <div class="diff-header-row">
        <span>Original</span>
        <span>Processed</span>
      </div>
      <div class="diff-grid">
        {rows.map((row, i) => (
          typeof row.left === "string" ? (
            <>
              <div key={`l${i}`} class="diff-line">{row.left}</div>
              <div key={`r${i}`} class="diff-line">{row.right as string}</div>
            </>
          ) : (
            <>
              <DiffLine key={`l${i}`} segments={row.left} />
              <DiffLine key={`r${i}`} segments={row.right as DiffSegment[]} />
            </>
          )
        ))}
      </div>
    </div>
  );
}
