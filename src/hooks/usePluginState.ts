import { useState, useEffect, useCallback } from "preact/hooks";
import { allPlugins } from "../plugins";

const STORAGE_KEY = "srt-editor:pluginStates";

export interface PluginStateEntry {
  enabled: boolean;
  params: Record<string, number>;
}

function buildDefaults(): Map<string, PluginStateEntry> {
  const map = new Map<string, PluginStateEntry>();
  for (const plugin of allPlugins) {
    const params: Record<string, number> = {};
    for (const p of plugin.params) params[p.key] = p.defaultValue;
    map.set(plugin.id, { enabled: plugin.enabled, params });
  }
  return map;
}

function loadFromStorage(defaults: Map<string, PluginStateEntry>): Map<string, PluginStateEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const stored: Record<string, { enabled: boolean; params: Record<string, number> }> = JSON.parse(raw);
    for (const [id, saved] of Object.entries(stored)) {
      const state = defaults.get(id);
      if (!state) continue;
      state.enabled = saved.enabled;
      for (const [key, value] of Object.entries(saved.params)) {
        if (key in state.params) state.params[key] = value;
      }
    }
  } catch { /* ignore corrupted data */ }
  return defaults;
}

function saveToStorage(states: Map<string, PluginStateEntry>) {
  const obj: Record<string, { enabled: boolean; params: Record<string, number> }> = {};
  for (const [id, state] of states) {
    obj[id] = { enabled: state.enabled, params: { ...state.params } };
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
        next.set(id, { ...entry, enabled: !entry.enabled });
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

  return { pluginStates, togglePlugin, setParam };
}
