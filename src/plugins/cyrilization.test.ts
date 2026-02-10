import { describe, it, expect } from "vitest";
import { cyrilizationPlugin } from "./cyrilization";
import { Subtitle } from "../types";

const run = (lines: string[]): string[] => {
  const subs = cyrilizationPlugin.run(
    [{ index: 1, startMs: 0, endMs: 1000, lines }],
    {},
    new Set(),
    new Map(),
  );
  return subs[0].lines;
};

describe("Cyrilization plugin", () => {
  it("converts basic Latin to Cyrillic", () => {
    expect(run(["Zdravo"])).toEqual(["Здраво"]);
  });

  it("converts digraph lj", () => {
    expect(run(["ljubav"])).toEqual(["љубав"]);
  });

  it("converts digraph nj", () => {
    expect(run(["njuska"])).toEqual(["њуска"]);
  });

  it("converts digraph dž", () => {
    expect(run(["džep"])).toEqual(["џеп"]);
  });

  it("handles capitalized digraph Lj", () => {
    expect(run(["Ljubljana"])).toEqual(["Љубљана"]);
  });

  it("handles capitalized digraph Nj", () => {
    expect(run(["Njujork"])).toEqual(["Њујорк"]);
  });

  it("preserves foreign words with w/q/y", () => {
    expect(run(["YouTube"])).toEqual(["YouTube"]);
  });

  it("preserves tags", () => {
    expect(run(["<i>Zdravo</i>"])).toEqual(["<i>Здраво</i>"]);
  });

  it("handles mixed Serbian and foreign words", () => {
    expect(run(["Idemo na YouTube"])).toEqual(["Идемо на YouTube"]);
  });

  it("preserves curly-brace tags", () => {
    expect(run(["{b}Zdravo{/b}"])).toEqual(["{b}Здраво{/b}"]);
  });
});
