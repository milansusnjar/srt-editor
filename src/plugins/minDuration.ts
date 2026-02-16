import { PluginConfig, Subtitle } from "../types";
import { MIN_SUBTITLE_BUFFER_MS } from "../constants";
import { DEFAULT_MIN_GAP_MS } from "./gap";

/** Default minimum subtitle duration (ms) */
const DEFAULT_MIN_DURATION_MS = 2000;

export const minDurationPlugin: PluginConfig = {
  id: "minDuration",
  name: "Min Duration",
  description:
    "Extends subtitle end time if its duration is below the minimum. Respects Gap plugin constraints when Gap is active.",
  enabled: false,
  params: [
    {
      key: "minDuration",
      label: "Min Duration (ms)",
      defaultValue: DEFAULT_MIN_DURATION_MS,
      min: 0,
      step: 1,
    },
  ],
  run(
    subtitles: Subtitle[],
    params: Record<string, number>,
    activePlugins: Set<string>,
    allConfigs: Map<string, Record<string, number>>
  ): Subtitle[] {
    const minDuration = params.minDuration;

    return subtitles.map((sub, i) => {
      const duration = sub.endMs - sub.startMs;

      if (duration >= minDuration) {
        return sub;
      }

      let newEndMs = sub.startMs + minDuration;

      const nextSub = i < subtitles.length - 1 ? subtitles[i + 1] : null;

      if (nextSub) {
        if (activePlugins.has("gap")) {
          const gapParams = allConfigs.get("gap");
          const minGap = gapParams?.minGap ?? DEFAULT_MIN_GAP_MS;
          const maxEnd = nextSub.startMs - minGap;
          newEndMs = Math.min(newEndMs, maxEnd);
        } else {
          newEndMs = Math.min(newEndMs, nextSub.startMs - MIN_SUBTITLE_BUFFER_MS);
        }
      }

      // Don't shrink the subtitle
      newEndMs = Math.max(newEndMs, sub.endMs);

      return { ...sub, endMs: newEndMs };
    });
  },
};
