import { useState, useEffect, useCallback } from "preact/hooks";
import { allPlugins } from "../plugins";

const STORAGE_KEY = "srt-editor:pluginStates";

export interface PluginStateEntry {
  enabled: boolean;
  params: Record<string, number>;
  textParams: Record<string, string>;
}

function buildDefaults(): Map<string, PluginStateEntry> {
  const map = new Map<string, PluginStateEntry>();
  for (const plugin of allPlugins) {
    const params: Record<string, number> = {};
    const textParams: Record<string, string> = {};
    for (const p of plugin.params) {
      if (p.type === "text") {
        textParams[p.key] = p.defaultText ?? "";
      } else {
        params[p.key] = p.defaultValue;
      }
    }
    map.set(plugin.id, { enabled: plugin.enabled, params, textParams });
  }
  return map;
}

function loadFromStorage(defaults: Map<string, PluginStateEntry>): Map<string, PluginStateEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const stored: Record<string, { enabled: boolean; params: Record<string, number>; textParams?: Record<string, string> }> = JSON.parse(raw);
    for (const [id, saved] of Object.entries(stored)) {
      const state = defaults.get(id);
      if (!state) continue;
      state.enabled = saved.enabled;
      for (const [key, value] of Object.entries(saved.params)) {
        if (key in state.params) state.params[key] = value;
      }
      if (saved.textParams) {
        for (const [key, value] of Object.entries(saved.textParams)) {
          if (key in state.textParams) state.textParams[key] = value;
        }
      }
    }
  } catch { /* ignore corrupted data */ }
  return defaults;
}

function saveToStorage(states: Map<string, PluginStateEntry>) {
  const obj: Record<string, { enabled: boolean; params: Record<string, number>; textParams: Record<string, string> }> = {};
  for (const [id, state] of states) {
    obj[id] = { enabled: state.enabled, params: { ...state.params }, textParams: { ...state.textParams } };
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}

export function usePluginState() {
  const [pluginStates, setPluginStates] = useState<Map<string, PluginStateEntry>>(() =>
    loadFromStorage(buildDefaults())
  );

  useEffect(() => {
    saveToStorage(pluginStates);
  }, [pluginStates]);

  const togglePlugin = useCallback((id: string) => {
    setPluginStates((prev) => {
      const next = new Map(prev);
      const entry = next.get(id);
      if (entry) {
        const newEnabled = !entry.enabled;
        next.set(id, { ...entry, enabled: newEnabled });

        // When Cyrillization is toggled ON, auto-enable Extension with 'cyr.sr'
        if (id === "cyrillization" && newEnabled) {
          const extEntry = next.get("extension");
          if (extEntry) {
            next.set("extension", {
              ...extEntry,
              enabled: true,
              textParams: { ...extEntry.textParams, ext: "cyr.sr" },
            });
          }
        }
      }
      return next;
    });
  }, []);

  const setParam = useCallback((pluginId: string, key: string, value: number) => {
    setPluginStates((prev) => {
      const next = new Map(prev);
      const entry = next.get(pluginId);
      if (entry) {
        next.set(pluginId, { ...entry, params: { ...entry.params, [key]: value } });
      }
      return next;
    });
  }, []);

  const setTextParam = useCallback((pluginId: string, key: string, value: string) => {
    setPluginStates((prev) => {
      const next = new Map(prev);
      const entry = next.get(pluginId);
      if (entry) {
        next.set(pluginId, { ...entry, textParams: { ...entry.textParams, [key]: value } });
      }
      return next;
    });
  }, []);

  return { pluginStates, togglePlugin, setParam, setTextParam };
}