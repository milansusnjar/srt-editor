import { PluginConfig, Subtitle } from "../types";

/** Default minimum gap (ms) between consecutive subtitles */
export const DEFAULT_MIN_GAP_MS = 125;

export const gapPlugin: PluginConfig = {
  id: "gap",
  name: "Gap (Minimum Gap)",
  description:
    "Enforces a minimum gap (in ms) between the end of one subtitle and the start of the next. If a subtitle's end time violates the gap, it is trimmed back.",
  enabled: true,
  params: [
    {
      key: "minGap",
      label: "Min Gap (ms)",
      defaultValue: DEFAULT_MIN_GAP_MS,
      min: 0,
      step: 1,
    },
  ],
  run(
    subtitles: Subtitle[],
    params: Record<string, number>,
  ): Subtitle[] {
    const minGap = params.minGap;

    return subtitles.map((sub, i) => {
      const nextSub = i < subtitles.length - 1 ? subtitles[i + 1] : null;
      if (!nextSub) return sub;

      const gap = nextSub.startMs - sub.endMs;
      if (gap >= minGap) return sub;

      // Trim end time to enforce minimum gap
      const newEndMs = nextSub.startMs - minGap;

      // Don't let end go before or equal to start
      if (newEndMs <= sub.startMs) return sub;

      return { ...sub, endMs: newEndMs };
    });
  },
};
