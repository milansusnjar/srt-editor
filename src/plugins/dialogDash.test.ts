import { describe, it, expect } from "vitest";
import { dialogDashPlugin } from "./dialogDash";
import { Subtitle } from "../types";

const run = (subtitles: Subtitle[]) =>
  dialogDashPlugin.run(subtitles, {}, new Set(), new Map());

const sub = (lines: string[]): Subtitle => ({
  index: 1,
  startMs: 0,
  endMs: 1000,
  lines,
});

describe("Dialog Dash plugin", () => {
  it("removes dash+space from first line, space from second line", () => {
    const result = run([sub(["- Laku noć, cure.", "- Vidimo se ujutro."])]);
    expect(result[0].lines).toEqual(["Laku noć, cure.", "-Vidimo se ujutro."]);
  });

  it("handles first line already without space after dash", () => {
    const result = run([sub(["- Laku noć, cure.", "-Vidimo se ujutro."])]);
    expect(result[0].lines).toEqual(["Laku noć, cure.", "-Vidimo se ujutro."]);
  });

  it("preserves leading tags on first line", () => {
    const result = run([
      sub(["{\\an8}- Gdje si dosad?", "- Dobra večer."]),
    ]);
    expect(result[0].lines).toEqual([
      "{\\an8}Gdje si dosad?",
      "-Dobra večer.",
    ]);
  });

  it("preserves HTML tags on first line", () => {
    const result = run([sub(["<i>- Hello.", "- World.</i>"])]);
    expect(result[0].lines).toEqual(["<i>Hello.", "-World.</i>"]);
  });

  it("ignores single-line subtitles", () => {
    const result = run([sub(["- Just one line."])]);
    expect(result[0].lines).toEqual(["- Just one line."]);
  });

  it("ignores subtitles without dashes", () => {
    const result = run([sub(["Hello.", "World."])]);
    expect(result[0].lines).toEqual(["Hello.", "World."]);
  });

  it("ignores mid-line dashes", () => {
    const result = run([sub(["Gdje si dosad? -Kasnim.", "Drugi red."])]);
    expect(result[0].lines).toEqual([
      "Gdje si dosad? -Kasnim.",
      "Drugi red.",
    ]);
  });

  it("ignores subtitles where only first line has a dash", () => {
    const result = run([sub(["- First line.", "No dash here."])]);
    expect(result[0].lines).toEqual(["- First line.", "No dash here."]);
  });

  it("handles three-line dialog", () => {
    const result = run([
      sub(["- Line one.", "- Line two.", "- Line three."]),
    ]);
    expect(result[0].lines).toEqual([
      "Line one.",
      "-Line two.",
      "-Line three.",
    ]);
  });

  it("handles multiple tags before dash", () => {
    const result = run([
      sub(["{\\an8}<b>- Tagged line.", "- Second line."]),
    ]);
    expect(result[0].lines).toEqual([
      "{\\an8}<b>Tagged line.",
      "-Second line.",
    ]);
  });

  it("handles curly-brace formatting tags like {i}", () => {
    const result = run([
      sub(["{i}- Italic line.{/i}", "- Second line."]),
    ]);
    expect(result[0].lines).toEqual(["{i}Italic line.{/i}", "-Second line."]);
  });

  it("handles tags before dash with more tags after dash", () => {
    const result = run([
      sub(["{\\an8}- <i>Sretan rođendan, draga Agnes</i>", "- Predivno."]),
    ]);
    expect(result[0].lines).toEqual([
      "{\\an8}<i>Sretan rođendan, draga Agnes</i>",
      "-Predivno.",
    ]);
  });

  it("does not modify subtitles that are not dialog", () => {
    const input = [
      sub(["Regular subtitle."]),
      sub(["Two lines", "no dashes"]),
    ];
    const result = run(input);
    expect(result[0].lines).toEqual(["Regular subtitle."]);
    expect(result[1].lines).toEqual(["Two lines", "no dashes"]);
  });
});