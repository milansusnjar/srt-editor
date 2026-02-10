import { describe, it, expect } from "vitest";
import { longLinesPlugin } from "./longlines";
import { Subtitle } from "../types";

const run = (lines: string[], maxLength = 42): string[] => {
  const subs = longLinesPlugin.run(
    [{ index: 1, startMs: 0, endMs: 1000, lines }],
    { maxLength },
    new Set(),
    new Map(),
  );
  return subs[0].lines;
};

function visibleLength(text: string): number {
  return text
    .replace(/<\/?(?:b|i|u|font)(?: [^>]*)?\s*>/gi, "")
    .replace(/\{\/?\s*[biu]\s*}/gi, "")
    .length;
}

describe("Long Lines plugin", () => {
  it("splits a single long line into two balanced lines", () => {
    const line = "This is a very long subtitle line that exceeds the limit";
    const result = run([line], 42);
    expect(result).toHaveLength(2);
    // Both lines should be under or near the limit
    expect(visibleLength(result[0])).toBeLessThanOrEqual(42);
  });

  it("merges and re-splits when one of two lines exceeds max", () => {
    const lines = [
      "Short",
      "This second line is way too long for the maximum allowed character count here",
    ];
    const result = run(lines, 42);
    expect(result).toHaveLength(2);
    // Re-split should be more balanced than the original
    const diff = Math.abs(
      visibleLength(result[0]) - visibleLength(result[1]),
    );
    expect(diff).toBeLessThan(
      visibleLength(lines[1]) - visibleLength(lines[0]),
    );
  });

  it("leaves lines unchanged when under maxLength", () => {
    const lines = ["Short line"];
    const result = run(lines, 42);
    expect(result).toEqual(["Short line"]);
  });

  it("leaves a single long word as-is (cannot split)", () => {
    const word = "A".repeat(50);
    const result = run([word], 42);
    expect(result).toEqual([word]);
  });

  it("excludes tags from length count but preserves them", () => {
    // Visible text is 10 chars, well under 42 — should not be split
    const line = "<b>Hello</b> <i>World</i>";
    const result = run([line], 42);
    expect(result).toEqual([line]);
  });

  it("splits tagged text when visible length exceeds max", () => {
    const line = "<b>" + "A".repeat(30) + "</b> " + "B".repeat(30);
    const result = run([line], 42);
    expect(result).toHaveLength(2);
  });
});
