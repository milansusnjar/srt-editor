import { describe, it, expect } from "vitest";
import { cyrillizationPlugin } from "./cyrillization";
import { Subtitle } from "../types";

const run = (lines: string[]): string[] => {
  const subs = cyrillizationPlugin.run(
    [{ index: 1, startMs: 0, endMs: 1000, lines }],
    {},
    new Set(),
    new Map(),
  );
  return subs[0].lines;
};

describe("Cyrillization plugin", () => {
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

  it("preserves foreign words from the blocklist", () => {
    expect(run(["live"])).toEqual(["live"]);
    expect(run(["Discord"])).toEqual(["Discord"]);
    expect(run(["VISA"])).toEqual(["VISA"]);
  });

  it("preserves foreign words case-insensitively", () => {
    expect(run(["Fresh Air"])).toEqual(["Fresh Air"]);
    expect(run(["DISCLAIMER"])).toEqual(["DISCLAIMER"]);
  });

  it("still cyrillizes Serbian words next to foreign words", () => {
    expect(run(["Idemo na live"])).toEqual(["Идемо на live"]);
  });

  it("preserves foreign words containing digits", () => {
    expect(run(["co2"])).toEqual(["co2"]);
    expect(run(["h2o"])).toEqual(["h2o"]);
  });

  it("preserves Roman numerals (2+ chars, uppercase)", () => {
    expect(run(["Luj IV"])).toEqual(["Луј IV"]);
    expect(run(["U II svetskom ratu"])).toEqual(["У II светском рату"]);
    expect(run(["VII vek"])).toEqual(["VII век"]);
    expect(run(["XII"])).toEqual(["XII"]);
    expect(run(["MCMXCIX"])).toEqual(["MCMXCIX"]);
  });

  it("still cyrillizes single I as Serbian conjunction", () => {
    expect(run(["ti i ja"])).toEqual(["ти и ја"]);
    expect(run(["I DEO"])).toEqual(["И ДЕО"]);
  });

  it("does not merge nj digraph in tanjug", () => {
    expect(run(["tanjug"])).toEqual(["танјуг"]);
    expect(run(["Tanjug"])).toEqual(["Танјуг"]);
  });

  it("does not merge dž digraph in words starting with nadž", () => {
    expect(run(["nadživeti"])).toEqual(["надживети"]);
    expect(run(["Nadživeo"])).toEqual(["Надживео"]);
  });

  it("does not merge nj digraph in words starting with injekc", () => {
    expect(run(["injekcija"])).toEqual(["инјекција"]);
    expect(run(["Injekcija"])).toEqual(["Инјекција"]);
  });

  it("does not merge nj digraph in words starting with konjuk", () => {
    expect(run(["konjuktivitis"])).toEqual(["конјуктивитис"]);
  });

  it("does not merge nj digraph in words starting with konjug", () => {
    expect(run(["konjugacija"])).toEqual(["конјугација"]);
    expect(run(["Konjugacija"])).toEqual(["Конјугација"]);
  });

  it("is idempotent — running on already-cyrillized text produces no changes", () => {
    const first = run(["Zdravo svete"]);
    expect(first).toEqual(["Здраво свете"]);
    const second = run(first);
    expect(second).toEqual(first);
  });
});
