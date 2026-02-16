import { SrtFile } from "../types";
import { serializeSrt } from "../srt";
import { computeDiff, alignLines, DiffSegment, AlignedRow } from "../utils/diff";

interface DiffViewProps {
  file: SrtFile;
}

function InlineDiffLine({ segments }: { segments: DiffSegment[] }) {
  return (
    <>
      {segments.map((seg, i) =>
        seg.changed ? <span key={i} class="diff-char">{seg.text}</span> : seg.text
      )}
    </>
  );
}

function DiffRow({ row }: { row: AlignedRow }) {
  if (row.type === "equal") {
    return (
      <>
        <div class="diff-line">{row.left}</div>
        <div class="diff-line">{row.right}</div>
      </>
    );
  }

  if (row.type === "modified") {
    const { left, right } = computeDiff(row.left!, row.right!);
    return (
      <>
        <div class="diff-line diff-line-changed">
          <InlineDiffLine segments={left} />
        </div>
        <div class="diff-line diff-line-changed">
          <InlineDiffLine segments={right} />
        </div>
      </>
    );
  }

  if (row.type === "removed") {
    return (
      <>
        <div class="diff-line diff-line-removed">{row.left}</div>
        <div class="diff-line diff-line-empty" />
      </>
    );
  }

  // added
  return (
    <>
      <div class="diff-line diff-line-empty" />
      <div class="diff-line diff-line-added">{row.right}</div>
    </>
  );
}

export function DiffView({ file }: DiffViewProps) {
  const origText = serializeSrt(file.originalSubtitles);
  const procText = serializeSrt(file.subtitles);
  const origLines = origText.split("\n");
  const procLines = procText.split("\n");
  const rows = alignLines(origLines, procLines);

  return (
    <div>
      <div class="diff-header-row">
        <span>Original</span>
        <span>Processed</span>
      </div>
      <div class="diff-grid">
        {rows.map((row, i) => (
          <DiffRow key={i} row={row} />
        ))}
      </div>
    </div>
  );
}
