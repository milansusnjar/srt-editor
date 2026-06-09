import { useState, useEffect, useCallback } from "preact/hooks";
import { Preset, PresetPluginState } from "../types";
import { buildDefaults } from "./usePluginState";

const PRESETS_KEY = "srt-editor:presets";
const ACTIVE_KEY = "srt-editor:activePresetId";

// Build a full plugin-state record from a compact spec. Starts from all plugins
// disabled at their default params, then applies the listed overrides.
function presetStates(
  spec: Record<string, Partial<PresetPluginState>>
): Record<string, PresetPluginState> {
  const out: Record<string, PresetPluginState> = {};
  for (const [id, entry] of buildDefaults()) {
    out[id] = {
      enabled: false,
      params: { ...entry.params },
      textParams: { ...entry.textParams },
    };
  }
  for (const [id, override] of Object.entries(spec)) {
    if (!out[id]) continue;
    out[id] = {
      enabled: override.enabled ?? true,
      params: { ...out[id].params, ...(override.params ?? {}) },
      textParams: { ...out[id].textParams, ...(override.textParams ?? {}) },
    };
  }
  return out;
}

// Read-only presets shipped with the app. Defined in code (not persisted) so
// updates here reach everyone. `encoding` targetEncoding: 1 = UTF-8, 3 = Windows-1251.
export const BUILTIN_PRESETS: Preset[] = [
  {
    id: "builtin:cyrillize",
    name: "Cyrillize",
    builtin: true,
    states: presetStates({
      cyrillization: {},
      extension: { textParams: { ext: "cyr.sr" } },
      encoding: { params: { targetEncoding: 1 } },
    }),
  },
  {
    id: "builtin:clean-ads",
    name: "Clean Ads",
    builtin: true,
    states: presetStates({ removeAds: {} }),
  },
  {
    id: "builtin:fix-timing",
    name: "Fix Timing",
    builtin: true,
    states: presetStates({ cps: {}, minDuration: {}, gap: {} }),
  },
  {
    id: "builtin:full-polish",
    name: "Full Polish",
    builtin: true,
    states: presetStates({
      removeAds: {},
      dialogDash: {},
      longLines: {},
      cps: {},
      minDuration: {},
      gap: {},
    }),
  },
];

function loadUserPresets(): Preset[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is Preset =>
        p && typeof p.id === "string" && typeof p.name === "string" && typeof p.states === "object"
    );
  } catch {
    return [];
  }
}

export function usePresets() {
  const [userPresets, setUserPresets] = useState<Preset[]>(loadUserPresets);
  const [activePresetId, setActivePresetId] = useState<string | null>(
    () => localStorage.getItem(ACTIVE_KEY) || null
  );

  useEffect(() => {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(userPresets));
  }, [userPresets]);

  useEffect(() => {
    if (activePresetId) localStorage.setItem(ACTIVE_KEY, activePresetId);
    else localStorage.removeItem(ACTIVE_KEY);
  }, [activePresetId]);

  const presets = [...BUILTIN_PRESETS, ...userPresets];

  const findPreset = useCallback(
    (id: string) => presets.find((p) => p.id === id),
    [presets]
  );

  // Save the current plugin state as a new user preset (or overwrite an existing
  // user preset with the same name). Returns the saved preset's id.
  const savePreset = useCallback(
    (name: string, states: Record<string, PresetPluginState>): string => {
      const trimmed = name.trim();
      let savedId = "";
      setUserPresets((prev) => {
        const existing = prev.find((p) => p.name.toLowerCase() === trimmed.toLowerCase());
        if (existing) {
          savedId = existing.id;
          return prev.map((p) => (p.id === existing.id ? { ...p, states } : p));
        }
        savedId = `user:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        return [...prev, { id: savedId, name: trimmed, states }];
      });
      return savedId;
    },
    []
  );

  const deletePreset = useCallback((id: string) => {
    setUserPresets((prev) => prev.filter((p) => p.id !== id));
    setActivePresetId((cur) => (cur === id ? null : cur));
  }, []);

  return { presets, activePresetId, setActivePresetId, findPreset, savePreset, deletePreset };
}
