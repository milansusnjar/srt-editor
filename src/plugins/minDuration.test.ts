import { describe, it, expect } from "vitest";
import { minDurationPlugin } from "./minDuration";
import { Subtitle } from "../types";

const run = (
  subtitles: Subtitle[],
  minDuration = 2000,
  activePlugins = new Set<string>(),
  allConfigs = new Map<string, Record<string, number>>(),
) => minDurationPlugin.run(subtitles, { minDuration }, activePlugins, allConfigs);

describe("Min Duration plugin", () => {
  it("extends short subtitle to minimum duration", () => {
    const subs: Subtitle[] = [
      { index: 1, startMs: 0, endMs: 500, lines: ["Hi"] },
    ];
    const result = run(subs, 2000);
    expect(result[0].endMs).toBe(2000);
  });

  it("does not modify subtitle already at minimum duration", () => {
    const subs: Subtitle[] = [
      { index: 1, startMs: 0, endMs: 2000, lines: ["Hi"] },
    ];
    const result = run(subs, 2000);
    expect(result[0].endMs).toBe(2000);
  });

  it("does not modify subtitle above minimum duration", () => {
    const subs: Subtitle[] = [
      { index: 1, startMs: 0, endMs: 3000, lines: ["Hi"] },
    ];
    const result = run(subs, 2000);
    expect(result[0].endMs).toBe(3000);
  });

  it("caps extension at next subtitle boundary when gap inactive", () => {
    const subs: Subtitle[] = [
      { index: 1, startMs: 0, endMs: 500, lines: ["Hi"] },
      { index: 2, startMs: 1000, endMs: 2000, lines: ["There"] },
    ];
    // Wants to extend to 2000, but next starts at 1000 → capped at 999
    const result = run(subs, 2000);
    expect(result[0].endMs).toBe(999);
  });

  it("caps extension respecting Gap min gap when gap active", () => {
    const subs: Subtitle[] = [
      { index: 1, startMs: 0, endMs: 500, lines: ["Hi"] },
      { index: 2, startMs: 1000, endMs: 2000, lines: ["There"] },
    ];
    const activePlugins = new Set(["gap"]);
    const allConfigs = new Map([["gap", { minGap: 200 }]]);
    // Wants to extend to 2000, capped at 1000 - 200 = 800
    const result = run(subs, 2000, activePlugins, allConfigs);
    expect(result[0].endMs).toBe(800);
  });

  it("does not shrink subtitle", () => {
    // Subtitle already at 1400, gap constraint forces max 800
    // Plugin should not shrink, so endMs stays at 1400
    const subs: Subtitle[] = [
      { index: 1, startMs: 0, endMs: 1400, lines: ["Hi"] },
      { index: 2, startMs: 1000, endMs: 2000, lines: ["There"] },
    ];
    const activePlugins = new Set(["gap"]);
    const allConfigs = new Map([["gap", { minGap: 200 }]]);
    const result = run(subs, 2000, activePlugins, allConfigs);
    expect(result[0].endMs).toBe(1400);
  });

  it("last subtitle extends freely with no next-subtitle constraint", () => {
    const subs: Subtitle[] = [
      { index: 1, startMs: 10000, endMs: 10500, lines: ["End"] },
    ];
    const result = run(subs, 2000);
    expect(result[0].endMs).toBe(12000);
  });

  it("extends as far as possible when constraint is tight", () => {
    // Next sub starts at 600, no gap plugin → cap at 599
    // Original end is 500, so we can extend to 599
    const subs: Subtitle[] = [
      { index: 1, startMs: 0, endMs: 500, lines: ["Hi"] },
      { index: 2, startMs: 600, endMs: 1500, lines: ["There"] },
    ];
    const result = run(subs, 2000);
    expect(result[0].endMs).toBe(599);
  });
});
