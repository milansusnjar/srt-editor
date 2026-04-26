import { describe, it, expect } from "vitest";
import { getDownloadName } from "./files";
import { SrtFile } from "../types";

const file = (name: string): SrtFile => ({
  name,
  subtitles: [],
  originalSubtitles: [],
  encoding: "utf-8",
  originalEncoding: "utf-8",
});

const states = (ext: string) =>
  new Map([
    [
      "extension",
      { enabled: true, params: {}, textParams: { ext } },
    ],
  ]);

const disabled = new Map([
  ["extension", { enabled: false, params: {}, textParams: { ext: "sr" } }],
]);

describe("getDownloadName", () => {
  it("appends extension before .srt", () => {
    expect(getDownloadName(file("Movie.srt"), states("sr"))).toBe("Movie.sr.srt");
  });

  it("does not double-apply if extension already present", () => {
    expect(getDownloadName(file("Movie.sr.srt"), states("sr"))).toBe("Movie.sr.srt");
  });

  it("is case-insensitive when checking existing extension", () => {
    expect(getDownloadName(file("Movie.SR.srt"), states("sr"))).toBe("Movie.SR.srt");
  });

  it("appends different extension even if another is already present", () => {
    expect(getDownloadName(file("Movie.sr.srt"), states("en"))).toBe("Movie.sr.en.srt");
  });

  it("returns original name when plugin is disabled", () => {
    expect(getDownloadName(file("Movie.srt"), disabled)).toBe("Movie.srt");
  });

  it("returns original name when ext is empty", () => {
    expect(getDownloadName(file("Movie.srt"), states(""))).toBe("Movie.srt");
  });

  it("returns original name when ext is whitespace only", () => {
    expect(getDownloadName(file("Movie.srt"), states("   "))).toBe("Movie.srt");
  });
});