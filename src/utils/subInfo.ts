import { Subtitle } from "../types";

export interface SubtitleStat {
  value: number;
  line: number;
}

export interface SubtitleInfo {
  maxCps: SubtitleStat;
  maxLineLength: SubtitleStat;
  maxDuration: SubtitleStat;
  minDuration: SubtitleStat;
  moreThanTwoLines: SubtitleStat;
}

function stripTags(text: string): string {
  return text
    .replace(/<\/?(?:b|i|u|font)(?: [^>]*)?\s*>/gi, "")
    .replace(/\{\/?\s*[biu]\s*}/gi, "");
}

export function computeSubInfo(subtitles: Subtitle[]): SubtitleInfo {
  const info: SubtitleInfo = {
    maxCps: { value: 0, line: 0 },
    maxLineLength: { value: 0, line: 0 },
    maxDuration: { value: 0, line: 0 },
    minDuration: { value: Infinity, line: 0 },
    moreThanTwoLines: { value: 0, line: 0 },
  };

  for (let i = 0; i < subtitles.length; i++) {
    const sub = subtitles[i];
    const durationSec = (sub.endMs - sub.startMs) / 1000;

    // CPS
    const chars = sub.lines.map(stripTags).join("").length;
    const cps = durationSec > 0 ? chars / durationSec : 0;
    if (cps > info.maxCps.value) {
      info.maxCps = { value: cps, line: sub.index };
    }

    // Max line length
    for (const line of sub.lines) {
      const len = stripTags(line).length;
      if (len > info.maxLineLength.value) {
        info.maxLineLength = { value: len, line: sub.index };
      }
    }

    // Duration
    if (durationSec > info.maxDuration.value) {
      info.maxDuration = { value: durationSec, line: sub.index };
    }
    if (durationSec < info.minDuration.value) {
      info.minDuration = { value: durationSec, line: sub.index };
    }

    // More than two lines
    if (sub.lines.length > 2) {
      if (info.moreThanTwoLines.value === 0) {
        info.moreThanTwoLines = { value: 1, line: sub.index };
      } else {
        info.moreThanTwoLines = { ...info.moreThanTwoLines, value: info.moreThanTwoLines.value + 1 };
      }
    }
  }

  // If no subtitles, reset minDuration
  if (subtitles.length === 0) {
    info.minDuration = { value: 0, line: 0 };
  }

  return info;
}
