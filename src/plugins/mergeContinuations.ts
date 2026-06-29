import { PluginConfig, Subtitle } from "../types";

const DEFAULT_MAX_GAP_MS = 200;
const DEFAULT_MAX_MERGED_LENGTH = 42;
const DEFAULT_MAX_MERGED_DURATION_MS = 8000;

function stripTags(text: string): string {
  return text
    .replace(/<\/?(?:b|i|u|font)(?: [^>]*)?\s*>/gi, "")
    .replace(/\{\/?\s*[biu]\s*}/gi, "");
}

function subtitleText(subtitle: Subtitle): string {
  return subtitle.lines.map((line) => line.trim()).filter(Boolean).join(" ");
}

function visibleText(subtitle: Subtitle): string {
  return stripTags(subtitleText(subtitle)).trim();
}

function visibleLength(text: string): number {
  return stripTags(text).length;
}

function endsSentence(text: string): boolean {
  const normalized = stripTags(text)
    .trim()
    .replace(/["')\]}»”’]+$/u, "")
    .trim();
  return /[.!?…:;]$/u.test(normalized);
}

function hasMultiSpeakerDialog(subtitle: Subtitle): boolean {
  const dialogLines = subtitle.lines.filter((line) =>
    /^(?:\{[^}]*\}|<[^>]*>)*\s*-/u.test(line.trim()),
  );
  return dialogLines.length > 1;
}

function canMerge(
  current: Subtitle,
  next: Subtitle,
  maxGapMs: number,
  maxMergedLength: number,
  maxMergedDurationMs: number,
): boolean {
  const gap = next.startMs - current.endMs;
  if (gap < 0 || gap >= maxGapMs) return false;

  const currentText = subtitleText(current);
  const nextText = subtitleText(next);
  if (!visibleText(current) || !visibleText(next)) return false;
  if (endsSentence(currentText)) return false;
  if (hasMultiSpeakerDialog(current) || hasMultiSpeakerDialog(next)) return false;

  const mergedText = `${currentText.trim()} ${nextText.trim()}`.trim();
  if (visibleLength(mergedText) > maxMergedLength) return false;
  if (next.endMs - current.startMs > maxMergedDurationMs) return false;

  return true;
}

export const mergeContinuationsPlugin: PluginConfig = {
  id: "mergeContinuations",
  name: "Merge Continuations",
  description:
    "Merges adjacent subtitles when the next subtitle continues the sentence, the pause is short, and the merged subtitle stays within length and duration limits.",
  enabled: false,
  params: [
    {
      key: "maxGapMs",
      label: "Max Gap (ms)",
      defaultValue: DEFAULT_MAX_GAP_MS,
      min: 0,
      step: 1,
    },
    {
      key: "maxMergedLength",
      label: "Max Merged Length",
      defaultValue: DEFAULT_MAX_MERGED_LENGTH,
      min: 1,
      step: 1,
    },
    {
      key: "maxMergedDurationMs",
      label: "Max Merged Duration (ms)",
      defaultValue: DEFAULT_MAX_MERGED_DURATION_MS,
      min: 1,
      step: 100,
    },
  ],
  run(subtitles: Subtitle[], params: Record<string, number>): Subtitle[] {
    const maxGapMs = params.maxGapMs ?? DEFAULT_MAX_GAP_MS;
    const maxMergedLength =
      params.maxMergedLength ?? DEFAULT_MAX_MERGED_LENGTH;
    const maxMergedDurationMs =
      params.maxMergedDurationMs ?? DEFAULT_MAX_MERGED_DURATION_MS;

    const result: Subtitle[] = [];
    let i = 0;

    while (i < subtitles.length) {
      let current: Subtitle = { ...subtitles[i], lines: [...subtitles[i].lines] };
      i++;

      while (
        i < subtitles.length &&
        canMerge(
          current,
          subtitles[i],
          maxGapMs,
          maxMergedLength,
          maxMergedDurationMs,
        )
      ) {
        current = {
          ...current,
          endMs: subtitles[i].endMs,
          lines: [`${subtitleText(current).trim()} ${subtitleText(subtitles[i]).trim()}`.trim()],
        };
        i++;
      }

      result.push(current);
    }

    return result;
  },
};
