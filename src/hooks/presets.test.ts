import { describe, it, expect } from "vitest";
import { BUILTIN_PRESETS } from "./usePresets";
import { allPlugins } from "../plugins";

function enabledIds(presetId: string): string[] {
  const preset = BUILTIN_PRESETS.find((p) => p.id === presetId)!;
  return Object.entries(preset.states)
    .filter(([, s]) => s.enabled)
    .map(([id]) => id)
    .sort();
}

describe("BUILTIN_PRESETS", () => {
  it("are all marked builtin with unique ids", () => {
    const ids = BUILTIN_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(BUILTIN_PRESETS.every((p) => p.builtin)).toBe(true);
  });

  it("include a full state entry for every registered plugin", () => {
    const pluginIds = allPlugins.map((p) => p.id).sort();
    for (const preset of BUILTIN_PRESETS) {
      expect(Object.keys(preset.states).sort()).toEqual(pluginIds);
    }
  });

  it("Cyrillize enables cyrillization + extension (cyr.sr) + encoding to UTF-8", () => {
    expect(enabledIds("builtin:cyrillize")).toEqual(["cyrillization", "encoding", "extension"]);
    const states = BUILTIN_PRESETS.find((p) => p.id === "builtin:cyrillize")!.states;
    expect(states.extension.textParams.ext).toBe("cyr.sr");
    expect(states.encoding.params.targetEncoding).toBe(1); // 1 = UTF-8
  });

  it("Clean Ads enables only removeAds", () => {
    expect(enabledIds("builtin:clean-ads")).toEqual(["removeAds"]);
  });

  it("Fix Timing enables the three timing plugins", () => {
    expect(enabledIds("builtin:fix-timing")).toEqual(["cps", "gap", "minDuration"]);
  });

  it("Full Polish enables cleanup, formatting and timing (no script/encoding)", () => {
    expect(enabledIds("builtin:full-polish")).toEqual([
      "cps",
      "dialogDash",
      "gap",
      "longLines",
      "minDuration",
      "removeAds",
    ]);
  });
});
