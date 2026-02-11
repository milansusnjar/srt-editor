import { allPlugins } from "../plugins";
import { PluginCard } from "./PluginCard";
import { PluginStateEntry } from "../hooks/usePluginState";

interface PluginListProps {
  pluginStates: Map<string, PluginStateEntry>;
  onToggle: (id: string) => void;
  onParamChange: (pluginId: string, key: string, value: number) => void;
}

export function PluginList({ pluginStates, onToggle, onParamChange }: PluginListProps) {
  return (
    <>
      <h3>Plugins</h3>
      <div id="plugins">
        {allPlugins.map((plugin) => {
          const state = pluginStates.get(plugin.id);
          if (!state) return null;
          return (
            <PluginCard
              key={plugin.id}
              plugin={plugin}
              state={state}
              onToggle={onToggle}
              onParamChange={onParamChange}
            />
          );
        })}
      </div>
    </>
  );
}
