import { diffArrays } from "diff";

export interface DiffSegment {
  text: string;
  changed: boolean;
}

export interface AlignedRow {
  left: string | null;
  right: string | null;
  type: "equal" | "removed" | "added" | "modified";
}

export function computeDiff(a: string, b: string): { left: DiffSegment[]; right: DiffSegment[] } {
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

  const buildSegments = (mid: string): DiffSegment[] => {
    const segments: DiffSegment[] = [];
    if (prefix) segments.push({ text: prefix, changed: false });
    if (mid) segments.push({ text: mid, changed: true });
    if (suffix) segments.push({ text: suffix, changed: false });
    return segments;
  };

  return { left: buildSegments(aMid), right: buildSegments(bMid) };
}

export function alignLines(origLines: string[], procLines: string[]): AlignedRow[] {
  const changes = diffArrays(origLines, procLines);
  const rows: AlignedRow[] = [];

  let i = 0;
  while (i < changes.length) {
    const change = changes[i];

    if (!change.added && !change.removed) {
      // Equal lines
      for (const line of change.value) {
        rows.push({ left: line, right: line, type: "equal" });
      }
      i++;
    } else if (change.removed && i + 1 < changes.length && changes[i + 1].added) {
      // Adjacent removed + added → pair as modified, then overflow as pure remove/add
      const removed = change.value;
      const added = changes[i + 1].value;
      const paired = Math.min(removed.length, added.length);

      for (let j = 0; j < paired; j++) {
        rows.push({ left: removed[j], right: added[j], type: "modified" });
      }
      for (let j = paired; j < removed.length; j++) {
        rows.push({ left: removed[j], right: null, type: "removed" });
      }
      for (let j = paired; j < added.length; j++) {
        rows.push({ left: null, right: added[j], type: "added" });
      }
      i += 2;
    } else if (change.removed) {
      for (const line of change.value) {
        rows.push({ left: line, right: null, type: "removed" });
      }
      i++;
    } else {
      // added
      for (const line of change.value) {
        rows.push({ left: null, right: line, type: "added" });
      }
      i++;
    }
  }

  return rows;
}
