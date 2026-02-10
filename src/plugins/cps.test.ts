import { describe, it, expect } from "vitest";
import { cpsPlugin } from "./cps";
import { Subtitle } from "../types";

const run = (
  subtitles: Subtitle[],
  maxCps = 25,
  activePlugins = new Set<string>(),
  allConfigs = new Map<string, Record<string, number>>(),
) => cpsPlugin.run(subtitles, { maxCps }, activePlugins, allConfigs);

describe("CPS plugin", () => {
  it("extends end time when CPS exceeds max", () => {
    // 42 chars in 1 second = 42 CPS, need extension to ~1680ms (42/25*1000)
    const text = "A".repeat(42);
    const subs: Subtitle[] = [
      { index: 1, startMs: 0, endMs: 1000, lines: [text] },
    ];
    const result = run(subs, 25);
    // Required duration: ceil(42/25 * 1000) = 1680ms → endMs = 1680
    expect(result[0].endMs).toBe(1680);
  });

  it("leaves subtitle unchanged when CPS is under max", () => {
    // 10 chars in 1 second = 10 CPS, under 25
    const subs: Subtitle[] = [
      { index: 1, startMs: 0, endMs: 1000, lines: ["0123456789"] },
    ];
    const result = run(subs, 25);
    expect(result[0].endMs).toBe(1000);
  });

  it("caps extension at next subtitle start minus buffer", () => {
    const text = "A".repeat(50);
    const subs: Subtitle[] = [
      { index: 1, startMs: 0, endMs: 1000, lines: [text] },
      { index: 2, startMs: 1500, endMs: 2500, lines: ["Hi"] },
    ];
    // Required: ceil(50/25*1000) = 2000, but next starts at 1500
    // Without gap plugin: capped at 1500 - 1 = 1499
    const result = run(subs, 25);
    expect(result[0].endMs).toBe(1499);
  });

  it("respects Gap plugin min gap when Gap is active", () => {
    const text = "A".repeat(50);
    const subs: Subtitle[] = [
      { index: 1, startMs: 0, endMs: 1000, lines: [text] },
      { index: 2, startMs: 1500, endMs: 2500, lines: ["Hi"] },
    ];
    const activePlugins = new Set(["gap"]);
    const allConfigs = new Map([["gap", { minGap: 200 }]]);
    // Required: 2000, capped at 1500 - 200 = 1300
    const result = run(subs, 25, activePlugins, allConfigs);
    expect(result[0].endMs).toBe(1300);
  });

  it("does not shrink subtitle even if gap limit is tighter than original end", () => {
    // Subtitle that already extends to 1400, gap forces max 1300.
    // Plugin should not shrink, so endMs stays at 1400.
    const text = "A".repeat(50);
    const subs: Subtitle[] = [
      { index: 1, startMs: 0, endMs: 1400, lines: [text] },
      { index: 2, startMs: 1500, endMs: 2500, lines: ["Hi"] },
    ];
    const activePlugins = new Set(["gap"]);
    const allConfigs = new Map([["gap", { minGap: 200 }]]);
    const result = run(subs, 25, activePlugins, allConfigs);
    expect(result[0].endMs).toBe(1400);
  });

  it("strips tags before counting characters", () => {
    // "<b>Hello</b>" visible chars = 5, in 1s = 5 CPS < 25 → unchanged
    const subs: Subtitle[] = [
      { index: 1, startMs: 0, endMs: 1000, lines: ["<b>Hello</b>"] },
    ];
    const result = run(subs, 25);
    expect(result[0].endMs).toBe(1000);
  });
});
