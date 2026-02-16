import { PluginConfig } from "../types";
import { cyrillizationPlugin } from "./cyrillization";
import { longLinesPlugin } from "./longLines";
import { cpsPlugin } from "./cps";
import { gapPlugin } from "./gap";
import { encodingPlugin } from "./encoding";

// Plugin execution order: text transforms first, then timing adjustments, then output format.
// Cyrillization → Long Lines → CPS → Gap → Encoding
export const allPlugins: PluginConfig[] = [cyrillizationPlugin, longLinesPlugin, cpsPlugin, gapPlugin, encodingPlugin];
