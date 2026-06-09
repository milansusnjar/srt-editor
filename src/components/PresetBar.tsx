import { Preset } from "../types";

interface PresetBarProps {
  presets: Preset[];
  activePresetId: string | null;
  onApply: (id: string) => void;
  onSave: () => void;
  onDelete: (id: string) => void;
}

export function PresetBar({ presets, activePresetId, onApply, onSave, onDelete }: PresetBarProps) {
  const builtins = presets.filter((p) => p.builtin);
  const userPresets = presets.filter((p) => !p.builtin);
  const active = presets.find((p) => p.id === activePresetId);
  const canDelete = !!active && !active.builtin;

  return (
    <div class="presets">
      <h3>Presets</h3>
      <div class="presets-row">
        <select
          class="preset-select"
          value={activePresetId ?? ""}
          onChange={(e) => {
            const id = (e.target as HTMLSelectElement).value;
            if (id) onApply(id);
          }}
        >
          <option value="">Custom</option>
          {builtins.length > 0 && (
            <optgroup label="Built-in">
              {builtins.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </optgroup>
          )}
          {userPresets.length > 0 && (
            <optgroup label="My Presets">
              {userPresets.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </optgroup>
          )}
        </select>
        <button class="btn-secondary" onClick={onSave}>Save as…</button>
        <button
          class="btn-secondary"
          disabled={!canDelete}
          onClick={() => active && onDelete(active.id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
