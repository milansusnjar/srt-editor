import { PluginConfig } from "../types";
import { PluginStateEntry } from "../hooks/usePluginState";

interface PluginCardProps {
  plugin: PluginConfig;
  state: PluginStateEntry;
  onToggle: (id: string) => void;
  onParamChange: (pluginId: string, key: string, value: number) => void;
}

export function PluginCard({ plugin, state, onToggle, onParamChange }: PluginCardProps) {
  return (
    <div class="plugin-card">
      <label class="plugin-header">
        <input
          type="checkbox"
          checked={state.enabled}
          onChange={() => onToggle(plugin.id)}
        />
        <span class="plugin-name">{plugin.name}</span>
        <span class="plugin-info">
          ?
          <span class="plugin-tooltip">{plugin.description}</span>
        </span>
      </label>
      <div class="plugin-params" style={{ opacity: state.enabled ? "1" : "0.4" }}>
        {plugin.params.map((param) => (
          <div key={param.key} class="param-row">
            <label>
              {param.label}:{" "}
              <input
                type="number"
                value={state.params[param.key]}
                min={param.min ?? 0}
                step={param.step ?? 1}
                onChange={(e) =>
                  onParamChange(plugin.id, param.key, parseFloat((e.target as HTMLInputElement).value))
                }
              />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
