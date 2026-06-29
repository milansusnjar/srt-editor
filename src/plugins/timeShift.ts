import { PluginConfig, Subtitle } from "../types";

export const timeShiftPlugin: PluginConfig = {
  id: "timeShift",
  name: "Time Shift",
  description:
    "Shifts every subtitle start and end time by the configured offset in milliseconds. Negative offsets move subtitles earlier.",
  enabled: false,
  params: [
    {
      key: "offsetMs",
      label: "Offset (ms)",
      defaultValue: 0,
      min: -86_400_000,
      step: 100,
    },
  ],
  run(subtitles: Subtitle[], params: Record<string, number>): Subtitle[] {
    const offsetMs = Math.round(params.offsetMs || 0);
    if (offsetMs === 0) return subtitles;

    return subtitles
      .map((sub) => ({
        ...sub,
        startMs: Math.max(0, sub.startMs + offsetMs),
        endMs: sub.endMs + offsetMs,
      }))
      .filter((sub) => sub.endMs > sub.startMs);
  },
};
