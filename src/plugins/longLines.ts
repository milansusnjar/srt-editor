import { PluginConfig, Subtitle } from "../types";

const DEFAULT_MAX_LINE_LENGTH = 42;

function stripTags(text: string): string {
  return text
    .replace(/<\/?(?:b|i|u|font)(?: [^>]*)?\s*>/gi, "")
    .replace(/\{\/?\s*[biu]\s*}/gi, "");
}

function splitIntoTwoLines(text: string): string[] {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  if (words.length <= 1) return [text];

  const totalVisible = stripTags(text).length;
  const target = totalVisible / 2;

  let bestIdx = 0;
  let bestDiff = Infinity;
  let accum = 0;

  for (let i = 0; i < words.length - 1; i++) {
    accum += stripTags(words[i]).length;
    if (i > 0) accum++; // space between words
    const diff = Math.abs(accum - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  }

  return [
    words.slice(0, bestIdx + 1).join(" "),
    words.slice(bestIdx + 1).join(" "),
  ];
}

export const longLinesPlugin: PluginConfig = {
  id: "longLines",
  name: "Long Lines",
  description:
    "Splits lines that exceed the maximum character count. Merges multi-line subtitles first, then re-splits at the best word boundary for balanced line lengths.",
  enabled: false,
  params: [
    {
      key: "maxLength",
      label: "Max Line Length",
      defaultValue: DEFAULT_MAX_LINE_LENGTH,
      min: 1,
      step: 1,
    },
  ],
  run(subtitles: Subtitle[], params: Record<string, number>): Subtitle[] {
    const maxLength = params.maxLength;

    return subtitles.map((sub) => {
      const hasLongLine = sub.lines.some(
        (line) => stripTags(line).length > maxLength,
      );
      if (!hasLongLine) return sub;

      const merged = sub.lines.join(" ");

      if (stripTags(merged).length <= maxLength) {
        return { ...sub, lines: [merged] };
      }

      return { ...sub, lines: splitIntoTwoLines(merged) };
    });
  },
};
