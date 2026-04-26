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

  it("removes dash from single-line subtitle", () => {
    const result = run([sub(["- Hvala vam"])]);
    expect(result[0].lines).toEqual(["Hvala vam"]);
  });

  it("handles two speakers in one line", () => {
    const result = run([sub(["- Hvala vam. - Nema na čemu!"])]);
    expect(result[0].lines).toEqual(["Hvala vam. -Nema na čemu!"]);
  });

  it("preserves regular dash after lowercase letter", () => {
    const result = run([sub(["- This is me - just thinking about you."])]);
    expect(result[0].lines).toEqual(["This is me - just thinking about you."]);
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

  it("removes dash from first line even if second line has no dash", () => {
    const result = run([sub(["- First line.", "No dash here."])]);
    expect(result[0].lines).toEqual(["First line.", "No dash here."]);
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

  it("removes space from second line when first line has no dash", () => {
    const result = run([sub(["Hajdemo onda jesti.", "- A gde?"])]);
    expect(result[0].lines).toEqual(["Hajdemo onda jesti.", "-A gde?"]);
  });

  it("handles first speaker without dash and second speaker with dash — real-world", () => {
    const result = run([
      sub(["Volim ''Murjake'', tv-seriju. Vi ne gledate?", "- Nikad ne propuštam."]),
      sub(["A ja mislila da je to jedinstveno.", "- Ne, on odlučuje po vlastitom nahođenju."]),
    ]);
    expect(result[0].lines).toEqual([
      "Volim ''Murjake'', tv-seriju. Vi ne gledate?",
      "-Nikad ne propuštam.",
    ]);
    expect(result[1].lines).toEqual([
      "A ja mislila da je to jedinstveno.",
      "-Ne, on odlučuje po vlastitom nahođenju.",
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