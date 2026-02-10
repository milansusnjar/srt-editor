import { PluginConfig } from "../types";
import { cyrillizationPlugin } from "./cyrillization";
import { longLinesPlugin } from "./longlines";
import { cpsPlugin } from "./cps";
import { gapPlugin } from "./gap";

// Plugin execution order: text transforms first, then timing adjustments.
// Cyrillization → Long Lines → CPS → Gap
export const allPlugins: PluginConfig[] = [cyrillizationPlugin, longLinesPlugin, cpsPlugin, gapPlugin];
