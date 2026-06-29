import { describe, it, expect } from "vitest";
import { timeShiftPlugin } from "./timeShift";
import { Subtitle } from "../types";

const sub = (index: number, startMs: number, endMs: number): Subtitle => ({
  index,
  startMs,
  endMs,
  lines: [`Line ${index}`],
});

const run = (subtitles: Subtitle[], offsetMs: number) =>
  timeShiftPlugin.run(subtitles, { offsetMs }, new Set(), new Map());

describe("Time Shift plugin", () => {
  it("moves all subtitle timings later", () => {
    const result = run([sub(1, 1000, 3000), sub(2, 5000, 7000)], 2500);

    expect(result[0].startMs).toBe(3500);
    expect(result[0].endMs).toBe(5500);
    expect(result[1].startMs).toBe(7500);
    expect(result[1].endMs).toBe(9500);
  });

  it("moves all subtitle timings earlier", () => {
    const result = run([sub(1, 5000, 7000)], -1500);

    expect(result[0].startMs).toBe(3500);
    expect(result[0].endMs).toBe(5500);
  });

  it("clips subtitles that partially cross zero", () => {
    const result = run([sub(1, 500, 2000)], -1000);

    expect(result[0].startMs).toBe(0);
    expect(result[0].endMs).toBe(1000);
  });

  it("drops subtitles that end before zero after shifting", () => {
    const result = run([sub(1, 500, 900), sub(2, 2000, 3000)], -1000);

    expect(result).toHaveLength(1);
    expect(result[0].index).toBe(2);
  });
});
