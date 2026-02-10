import { PluginConfig, Subtitle } from "../types";
import { MIN_SUBTITLE_BUFFER_MS } from "../constants";
import { DEFAULT_MIN_GAP_MS } from "./gap";

/** Default maximum characters per second */
const DEFAULT_MAX_CPS = 25;

function stripTags(text: string): string {
  return text
    // HTML tags: <b>, </b>, <i>, </i>, <u>, </u>, <font color="...">, </font>
    .replace(/<\/?(?:b|i|u|font)(?: [^>]*)?\s*>/gi, "")
    // SRT curly-brace tags: {b}, {/b}, {i}, {/i}, {u}, {/u}
    .replace(/\{\/?\s*[biu]\s*}/gi, "");
}

function charCount(lines: string[]): number {
  return lines.map(stripTags).join("").length;
}

export const cpsPlugin: PluginConfig = {
  id: "cps",
  name: "CPS (Characters Per Second)",
  description:
    "Extends subtitle duration if CPS exceeds the threshold. Respects Gap plugin constraints when Gap is active.",
  enabled: true,
  params: [
    {
      key: "maxCps",
      label: "Max CPS",
      defaultValue: DEFAULT_MAX_CPS,
      min: 1,
      step: 1,
    },
  ],
  run(
    subtitles: Subtitle[],
    params: Record<string, number>,
    activePlugins: Set<string>,
    allConfigs: Map<string, Record<string, number>>
  ): Subtitle[] {
    const maxCps = params.maxCps;

    return subtitles.map((sub, i) => {
      const chars = charCount(sub.lines);
      const durationSec = (sub.endMs - sub.startMs) / 1000;
      const currentCps = chars / durationSec;

      if (currentCps <= maxCps) {
        return sub;
      }

      // Need to extend: required duration = chars / maxCps
      const requiredMs = Math.ceil((chars / maxCps) * 1000);
      let newEndMs = sub.startMs + requiredMs;

      // Determine the hard limit for extension
      const nextSub = i < subtitles.length - 1 ? subtitles[i + 1] : null;

      if (nextSub) {
        if (activePlugins.has("gap")) {
          const gapParams = allConfigs.get("gap");
          const minGap = gapParams?.minGap ?? DEFAULT_MIN_GAP_MS;
          const maxEnd = nextSub.startMs - minGap;
          newEndMs = Math.min(newEndMs, maxEnd);
        } else {
          // Can extend up to 1ms before next subtitle
          newEndMs = Math.min(newEndMs, nextSub.startMs - MIN_SUBTITLE_BUFFER_MS);
        }
      }

      // Don't shrink the subtitle if the limit prevents full extension
      newEndMs = Math.max(newEndMs, sub.endMs);

      return { ...sub, endMs: newEndMs };
    });
  },
};
