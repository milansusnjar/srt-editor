import { PluginConfig } from "../types";
import { cyrilizationPlugin } from "./cyrilization";
import { cpsPlugin } from "./cps";
import { gapPlugin } from "./gap";

// Plugin execution order matters: Cyrilization runs first (text transform),
// then CPS (extends durations), then Gap (enforces minimum gaps).
export const allPlugins: PluginConfig[] = [cyrilizationPlugin, cpsPlugin, gapPlugin];
