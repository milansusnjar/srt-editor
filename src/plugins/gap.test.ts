import { describe, it, expect } from "vitest";
import { gapPlugin } from "./gap";
import { Subtitle } from "../types";

const run = (subtitles: Subtitle[], minGap = 125) =>
  gapPlugin.run(subtitles, { minGap }, new Set(), new Map());

describe("Gap plugin", () => {
  it("trims first subtitle when gap is below minGap", () => {
    const subs: Subtitle[] = [
      { index: 1, startMs: 0, endMs: 1950, lines: ["A"] },
      { index: 2, startMs: 2000, endMs: 3000, lines: ["B"] },
    ];
    // Gap is 50ms, minGap is 125 → trim endMs to 2000 - 125 = 1875
    const result = run(subs, 125);
    expect(result[0].endMs).toBe(1875);
    // Second subtitle unchanged
    expect(result[1].endMs).toBe(3000);
  });

  it("leaves subtitles unchanged when gap meets minGap", () => {
    const subs: Subtitle[] = [
      { index: 1, startMs: 0, endMs: 1000, lines: ["A"] },
      { index: 2, startMs: 2000, endMs: 3000, lines: ["B"] },
    ];
    const result = run(subs, 125);
    expect(result[0].endMs).toBe(1000);
  });

  it("does not push end before start", () => {
    const subs: Subtitle[] = [
      { index: 1, startMs: 1900, endMs: 1990, lines: ["A"] },
      { index: 2, startMs: 2000, endMs: 3000, lines: ["B"] },
    ];
    // newEndMs would be 2000 - 125 = 1875, which is < startMs 1900 → unchanged
    const result = run(subs, 125);
    expect(result[0].endMs).toBe(1990);
  });

  it("does not modify last subtitle (no next)", () => {
    const subs: Subtitle[] = [
      { index: 1, startMs: 0, endMs: 5000, lines: ["Only one"] },
    ];
    const result = run(subs, 125);
    expect(result[0].endMs).toBe(5000);
  });
});
