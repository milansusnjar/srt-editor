import { describe, it, expect } from "vitest";
import { alignLines, computeDiff } from "./diff";

describe("alignLines", () => {
  it("returns equal rows for identical lines", () => {
    const lines = ["a", "b", "c"];
    const result = alignLines(lines, lines);
    expect(result).toEqual([
      { left: "a", right: "a", type: "equal" },
      { left: "b", right: "b", type: "equal" },
      { left: "c", right: "c", type: "equal" },
    ]);
  });

  it("marks removed lines with null right side", () => {
    const orig = ["a", "b", "c"];
    const proc = ["a", "c"];
    const result = alignLines(orig, proc);
    expect(result).toEqual([
      { left: "a", right: "a", type: "equal" },
      { left: "b", right: null, type: "removed" },
      { left: "c", right: "c", type: "equal" },
    ]);
  });

  it("marks added lines with null left side", () => {
    const orig = ["a", "c"];
    const proc = ["a", "b", "c"];
    const result = alignLines(orig, proc);
    expect(result).toEqual([
      { left: "a", right: "a", type: "equal" },
      { left: null, right: "b", type: "added" },
      { left: "c", right: "c", type: "equal" },
    ]);
  });

  it("pairs adjacent remove+add as modified", () => {
    const orig = ["hello world"];
    const proc = ["hello earth"];
    const result = alignLines(orig, proc);
    expect(result).toEqual([
      { left: "hello world", right: "hello earth", type: "modified" },
    ]);
  });

  it("handles removal at the start (ad removal scenario)", () => {
    const orig = ["ad line", "1", "sub text", "", "2", "sub text 2"];
    const proc = ["1", "sub text", "", "2", "sub text 2"];
    const result = alignLines(orig, proc);
    expect(result[0]).toEqual({ left: "ad line", right: null, type: "removed" });
    // Remaining lines should be equal
    for (let i = 1; i < result.length; i++) {
      expect(result[i].type).toBe("equal");
    }
  });

  it("handles completely different content", () => {
    const orig = ["a", "b"];
    const proc = ["c", "d"];
    const result = alignLines(orig, proc);
    expect(result).toEqual([
      { left: "a", right: "c", type: "modified" },
      { left: "b", right: "d", type: "modified" },
    ]);
  });

  it("handles empty arrays", () => {
    expect(alignLines([], [])).toEqual([]);
    expect(alignLines(["a"], [])).toEqual([
      { left: "a", right: null, type: "removed" },
    ]);
    expect(alignLines([], ["a"])).toEqual([
      { left: null, right: "a", type: "added" },
    ]);
  });
});

describe("computeDiff", () => {
  it("highlights the changed middle portion", () => {
    const { left, right } = computeDiff("hello world", "hello earth");
    expect(left).toEqual([
      { text: "hello ", changed: false },
      { text: "world", changed: true },
    ]);
    expect(right).toEqual([
      { text: "hello ", changed: false },
      { text: "earth", changed: true },
    ]);
  });

  it("returns unchanged segments for identical strings", () => {
    const { left, right } = computeDiff("same", "same");
    expect(left).toEqual([{ text: "same", changed: false }]);
    expect(right).toEqual([{ text: "same", changed: false }]);
  });
});
