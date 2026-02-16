import { PluginConfig } from "../types";
import { removeAdsPlugin } from "./removeAds";
import { cyrillizationPlugin } from "./cyrillization";
import { longLinesPlugin } from "./longLines";
import { cpsPlugin } from "./cps";
import { gapPlugin } from "./gap";
import { encodingPlugin } from "./encoding";

// Plugin execution order: cleanup first, then text transforms, timing adjustments, output format.
// Remove Ads → Cyrillization → Long Lines → CPS → Gap → Encoding
export const allPlugins: PluginConfig[] = [removeAdsPlugin, cyrillizationPlugin, longLinesPlugin, cpsPlugin, gapPlugin, encodingPlugin];
