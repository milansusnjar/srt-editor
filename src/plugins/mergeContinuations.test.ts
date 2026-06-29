import { describe, it, expect } from "vitest";
import { mergeContinuationsPlugin } from "./mergeContinuations";
import { Subtitle } from "../types";

const sub = (
  index: number,
  startMs: number,
  endMs: number,
  lines: string[],
): Subtitle => ({ index, startMs, endMs, lines });

const run = (
  subtitles: Subtitle[],
  params: Record<string, number> = {},
): Subtitle[] =>
  mergeContinuationsPlugin.run(
    subtitles,
    {
      maxGapMs: 200,
      maxMergedLength: 42,
      maxMergedDurationMs: 8000,
      ...params,
    },
    new Set(),
    new Map(),
  );

describe("Merge Continuations plugin", () => {
  it("merges the user example when the gap is below 200ms", () => {
    const result = run([
      sub(32, 107687, 108862, ["Čini se Van Gog,"]),
      sub(33, 108987, 110347, ["ali nije mi poznata."]),
    ]);

    expect(result).toEqual([
      sub(32, 107687, 110347, ["Čini se Van Gog, ali nije mi poznata."]),
    ]);
  });

  it("does not merge when gap is exactly 200ms", () => {
    const subtitles = [
      sub(1, 1000, 2000, ["Čini se Van Gog,"]),
      sub(2, 2200, 3000, ["ali nije mi poznata."]),
    ];

    expect(run(subtitles)).toEqual(subtitles);
  });

  it("does not merge when the first subtitle ends with terminal punctuation", () => {
    const subtitles = [
      sub(1, 1000, 2000, ["Pozdrav."]),
      sub(2, 2100, 3000, ["Kako si?"]),
      sub(3, 3100, 4000, ["Da li radi?"]),
      sub(4, 4100, 5000, ["Radi."]),
      sub(5, 5100, 6000, ["Stani!"]),
      sub(6, 6100, 7000, ["Neću."]),
    ];

    expect(run(subtitles)).toEqual(subtitles);
  });

  it("merges when the first subtitle ends with a comma", () => {
    const result = run([
      sub(1, 1000, 2000, ["Ako želiš,"]),
      sub(2, 2100, 3000, ["možemo sada."]),
    ]);

    expect(result).toEqual([
      sub(1, 1000, 3000, ["Ako želiš, možemo sada."]),
    ]);
  });

  it("skips merge when combined visible length exceeds the max", () => {
    const subtitles = [
      sub(1, 1000, 2000, ["Ovo je dosta dugačak nastavak,"]),
      sub(2, 2100, 3000, ["koji bi bio predug za spajanje."]),
    ];

    expect(run(subtitles)).toEqual(subtitles);
  });

  it("skips merge when merged duration exceeds 8000ms", () => {
    const subtitles = [
      sub(1, 0, 7000, ["Čekam,"]),
      sub(2, 7100, 8001, ["još malo."]),
    ];

    expect(run(subtitles)).toEqual(subtitles);
  });

  it("allows merge when merged duration is exactly 8000ms", () => {
    const result = run([
      sub(1, 0, 7000, ["Čekam,"]),
      sub(2, 7100, 8000, ["još malo."]),
    ]);

    expect(result).toEqual([sub(1, 0, 8000, ["Čekam, još malo."])]);
  });

  it("preserves formatting tags while excluding them from length checks", () => {
    const result = run([
      sub(1, 1000, 2000, ["<i>Čini se,</i>"]),
      sub(2, 2100, 3000, ["{b}ali nije{/b}."]),
    ]);

    expect(result).toEqual([
      sub(1, 1000, 3000, ["<i>Čini se,</i> {b}ali nije{/b}."]),
    ]);
  });

  it("consumes the next subtitle and preserves following subtitle order", () => {
    const result = run([
      sub(1, 1000, 2000, ["Prvi,"]),
      sub(2, 2100, 3000, ["nastavak."]),
      sub(3, 5000, 6000, ["Drugi."]),
    ]);

    expect(result).toEqual([
      sub(1, 1000, 3000, ["Prvi, nastavak."]),
      sub(3, 5000, 6000, ["Drugi."]),
    ]);
  });

  it("supports chained short continuations within length and duration limits", () => {
    const result = run([
      sub(1, 1000, 2000, ["Jedan,"]),
      sub(2, 2100, 3000, ["dva,"]),
      sub(3, 3100, 4000, ["tri."]),
    ]);

    expect(result).toEqual([
      sub(1, 1000, 4000, ["Jedan, dva, tri."]),
    ]);
  });

  it("skips dialogue multi-speaker subtitles", () => {
    const subtitles = [
      sub(1, 1000, 2000, ["- Prvi,", "- Drugi,"]),
      sub(2, 2100, 3000, ["nastavak."]),
    ];

    expect(run(subtitles)).toEqual(subtitles);
  });

  it("does not merge overlapping subtitles", () => {
    const subtitles = [
      sub(1, 1000, 2200, ["Čini se,"]),
      sub(2, 2100, 3000, ["ali nije."]),
    ];

    expect(run(subtitles)).toEqual(subtitles);
  });
});
