import { describe, it, expect } from "vitest";
import { removeAdsPlugin } from "./removeAds";
import { Subtitle } from "../types";

const run = (subtitles: Subtitle[]) =>
  removeAdsPlugin.run(subtitles, {}, new Set(), new Map());

const sub = (index: number, lines: string[]): Subtitle => ({
  index,
  startMs: index * 1000,
  endMs: index * 1000 + 900,
  lines,
});

describe("Remove Ads plugin", () => {
  it("removes last subtitle when it matches titlovi.com ad", () => {
    const subs = [sub(1, ["Hello"]), sub(2, ["Preuzeto sa www.titlovi.com"])];
    const result = run(subs);
    expect(result).toHaveLength(1);
    expect(result[0].lines).toEqual(["Hello"]);
  });

  it("removes first subtitle when it matches www.titlovi.com", () => {
    const subs = [sub(1, ["www.titlovi.com"]), sub(2, ["Hello"])];
    const result = run(subs);
    expect(result).toHaveLength(1);
    expect(result[0].lines).toEqual(["Hello"]);
  });

  it("removes both first and last ads", () => {
    const subs = [
      sub(1, ["www.titlovi.com"]),
      sub(2, ["Hello"]),
      sub(3, ["Preuzeto sa www.titlovi.com"]),
    ];
    const result = run(subs);
    expect(result).toHaveLength(1);
    expect(result[0].lines).toEqual(["Hello"]);
  });

  it("re-indexes subtitles after removal", () => {
    const subs = [
      sub(1, ["www.titlovi.com"]),
      sub(2, ["First"]),
      sub(3, ["Second"]),
      sub(4, ["Preuzeto sa www.titlovi.com"]),
    ];
    const result = run(subs);
    expect(result).toHaveLength(2);
    expect(result[0].index).toBe(1);
    expect(result[1].index).toBe(2);
  });

  it("leaves non-ad subtitles unchanged", () => {
    const subs = [sub(1, ["Hello"]), sub(2, ["World"])];
    const result = run(subs);
    expect(result).toHaveLength(2);
    expect(result[0].lines).toEqual(["Hello"]);
    expect(result[1].lines).toEqual(["World"]);
  });

  it("does not remove ads from middle positions", () => {
    const subs = [
      sub(1, ["Hello"]),
      sub(2, ["www.titlovi.com"]),
      sub(3, ["World"]),
    ];
    const result = run(subs);
    expect(result).toHaveLength(3);
  });

  it("handles empty input", () => {
    const result = run([]);
    expect(result).toHaveLength(0);
  });

  it("handles single ad subtitle", () => {
    const subs = [sub(1, ["Preuzeto sa www.titlovi.com"])];
    const result = run(subs);
    expect(result).toHaveLength(0);
  });
});
