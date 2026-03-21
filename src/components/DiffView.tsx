import { useState } from "preact/hooks";
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

/** Check if a changed row is only a subtitle index number change */
function isIndexOnlyChange(row: AlignedRow): boolean {
  if (row.type !== "modified") return false;
  return /^\d+$/.test(row.left!.trim()) && /^\d+$/.test(row.right!.trim());
}

/** Group rows into subtitle blocks (separated by empty/blank lines) */
function groupIntoBlocks(rows: AlignedRow[]): AlignedRow[][] {
  const blocks: AlignedRow[][] = [];
  let current: AlignedRow[] = [];

  for (const row of rows) {
    const isEmpty = row.type === "equal" && (row.left === "" || row.left === null);
    if (isEmpty && current.length > 0) {
      blocks.push(current);
      current = [];
    } else if (!isEmpty) {
      current.push(row);
    }
  }
  if (current.length > 0) blocks.push(current);

  return blocks;
}

export function DiffView({ file }: DiffViewProps) {
  const [changesOnly, setChangesOnly] = useState(false);
  const origText = serializeSrt(file.originalSubtitles);
  const procText = serializeSrt(file.subtitles);
  const origLines = origText.split("\n");
  const procLines = procText.split("\n");
  const rows = alignLines(origLines, procLines);

  let displayRows: AlignedRow[];
  if (changesOnly) {
    const blocks = groupIntoBlocks(rows);
    const changedBlocks = blocks.filter((block) =>
      block.some((row) => row.type !== "equal" && !isIndexOnlyChange(row)),
    );
    // Join blocks with separator rows
    displayRows = [];
    for (let i = 0; i < changedBlocks.length; i++) {
      if (i > 0) displayRows.push({ left: "", right: "", type: "equal" });
      displayRows.push(...changedBlocks[i]);
    }
  } else {
    displayRows = rows;
  }

  return (
    <div>
      <div class="diff-header-row">
        <span>Original</span>
        <label class="diff-toggle">
          <input
            type="checkbox"
            checked={changesOnly}
            onChange={(e) => setChangesOnly((e.target as HTMLInputElement).checked)}
          />
          Changes only
        </label>
        <span>Processed</span>
      </div>
      <div class="diff-grid">
        {displayRows.map((row, i) => (
          <DiffRow key={i} row={row} />
        ))}
      </div>
    </div>
  );
}
