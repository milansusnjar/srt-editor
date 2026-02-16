import { describe, it, expect } from "vitest";
import { computeSubInfo } from "./subInfo";
import { Subtitle } from "../types";

function sub(index: number, startMs: number, endMs: number, lines: string[]): Subtitle {
  return { index, startMs, endMs, lines };
}

describe("computeSubInfo", () => {
  it("computes stats for a single subtitle", () => {
    const subs = [sub(1, 0, 2000, ["Hello world"])];
    const info = computeSubInfo(subs);

    // "Hello world" = 11 chars, 2s => CPS = 5.5
    expect(info.maxCps.value).toBeCloseTo(5.5);
    expect(info.maxCps.line).toBe(1);

    expect(info.maxLineLength.value).toBe(11);
    expect(info.maxLineLength.line).toBe(1);

    expect(info.maxDuration.value).toBe(2);
    expect(info.maxDuration.line).toBe(1);

    expect(info.minDuration.value).toBe(2);
    expect(info.minDuration.line).toBe(1);

    expect(info.moreThanTwoLines.value).toBe(0);
  });

  it("tracks first occurrence index for max values", () => {
    const subs = [
      sub(1, 0, 2000, ["Short"]),
      sub(2, 3000, 5000, ["Short"]),
    ];
    const info = computeSubInfo(subs);

    // Both have same CPS and duration, first occurrence should be line 1
    expect(info.maxCps.line).toBe(1);
    expect(info.maxDuration.line).toBe(1);
  });

  it("finds the subtitle with highest CPS", () => {
    const subs = [
      sub(1, 0, 5000, ["Slow subtitle"]),       // 13 chars / 5s = 2.6
      sub(2, 6000, 7000, ["Fast one here!!"]),    // 15 chars / 1s = 15
    ];
    const info = computeSubInfo(subs);

    expect(info.maxCps.value).toBeCloseTo(15);
    expect(info.maxCps.line).toBe(2);
  });

  it("strips tags when computing CPS and line length", () => {
    const subs = [sub(1, 0, 2000, ["<b>Hello</b> <i>world</i>"])];
    const info = computeSubInfo(subs);

    // Stripped: "Hello world" = 11 chars, 2s => 5.5 CPS
    expect(info.maxCps.value).toBeCloseTo(5.5);
    expect(info.maxLineLength.value).toBe(11);
  });

  it("strips curly-brace tags", () => {
    const subs = [sub(1, 0, 1000, ["{b}Bold{/b}"])];
    const info = computeSubInfo(subs);

    // Stripped: "Bold" = 4 chars
    expect(info.maxLineLength.value).toBe(4);
  });

  it("finds max line length across multi-line subtitles", () => {
    const subs = [
      sub(1, 0, 2000, ["Short", "This is a longer line"]),
      sub(2, 3000, 5000, ["Tiny"]),
    ];
    const info = computeSubInfo(subs);

    expect(info.maxLineLength.value).toBe(21); // "This is a longer line"
    expect(info.maxLineLength.line).toBe(1);
  });

  it("finds max and min duration", () => {
    const subs = [
      sub(1, 0, 1000, ["One sec"]),
      sub(2, 2000, 12000, ["Ten sec"]),
      sub(3, 13000, 15000, ["Two sec"]),
    ];
    const info = computeSubInfo(subs);

    expect(info.maxDuration.value).toBe(10);
    expect(info.maxDuration.line).toBe(2);

    expect(info.minDuration.value).toBe(1);
    expect(info.minDuration.line).toBe(1);
  });

  it("counts subtitles with more than two lines", () => {
    const subs = [
      sub(1, 0, 2000, ["Line 1", "Line 2"]),
      sub(2, 3000, 5000, ["Line 1", "Line 2", "Line 3"]),
      sub(3, 6000, 8000, ["Line 1", "Line 2", "Line 3", "Line 4"]),
    ];
    const info = computeSubInfo(subs);

    expect(info.moreThanTwoLines.value).toBe(2);
    expect(info.moreThanTwoLines.line).toBe(2); // first occurrence
  });

  it("handles empty subtitle array", () => {
    const info = computeSubInfo([]);

    expect(info.maxCps.value).toBe(0);
    expect(info.maxLineLength.value).toBe(0);
    expect(info.maxDuration.value).toBe(0);
    expect(info.minDuration.value).toBe(0);
    expect(info.moreThanTwoLines.value).toBe(0);
  });

  it("handles subtitle with empty lines", () => {
    const subs = [sub(1, 0, 1000, [""])];
    const info = computeSubInfo(subs);

    expect(info.maxCps.value).toBe(0);
    expect(info.maxLineLength.value).toBe(0);
  });
});
