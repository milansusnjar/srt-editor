import { Subtitle } from "./types";

export function parseTimestamp(ts: string): number {
  // Format: HH:MM:SS,mmm
  const match = ts.trim().match(/^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/);
  if (!match) throw new Error(`Invalid timestamp: "${ts}"`);
  const [, h, m, s, ms] = match;
  return (
    parseInt(h) * 3600000 +
    parseInt(m) * 60000 +
    parseInt(s) * 1000 +
    parseInt(ms)
  );
}

export function formatTimestamp(ms: number): string {
  const h = Math.floor(ms / 3600000);
  ms %= 3600000;
  const m = Math.floor(ms / 60000);
  ms %= 60000;
  const s = Math.floor(ms / 1000);
  const remainder = ms % 1000;
  return (
    String(h).padStart(2, "0") +
    ":" +
    String(m).padStart(2, "0") +
    ":" +
    String(s).padStart(2, "0") +
    "," +
    String(Math.round(remainder)).padStart(3, "0")
  );
}

export function parseSrt(content: string): Subtitle[] {
  const subtitles: Subtitle[] = [];
  // Normalize line endings and split into blocks
  const blocks = content
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim()
    .split(/\n\n+/);

  for (const block of blocks) {
    const blockLines = block.trim().split("\n");
    if (blockLines.length < 3) continue;

    const index = parseInt(blockLines[0]);
    if (isNaN(index)) continue;

    const timeParts = blockLines[1].split("-->");
    if (timeParts.length !== 2) continue;

    const startMs = parseTimestamp(timeParts[0]);
    const endMs = parseTimestamp(timeParts[1]);
    const lines = blockLines.slice(2);

    subtitles.push({ index, startMs, endMs, lines });
  }

  return subtitles;
}

export function serializeSrt(subtitles: Subtitle[]): string {
  return subtitles
    .map(
      (sub, i) =>
        `${i + 1}\n${formatTimestamp(sub.startMs)} --> ${formatTimestamp(sub.endMs)}\n${sub.lines.join("\n")}`
    )
    .join("\n\n") + "\n";
}
