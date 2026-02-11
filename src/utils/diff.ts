export interface DiffSegment {
  text: string;
  changed: boolean;
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
