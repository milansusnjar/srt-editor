import { PluginConfig } from "../types";
import { removeAdsPlugin } from "./removeAds";
import { cyrillizationPlugin } from "./cyrillization";
import { longLinesPlugin } from "./longLines";
import { cpsPlugin } from "./cps";
import { minDurationPlugin } from "./minDuration";
import { gapPlugin } from "./gap";
import { encodingPlugin } from "./encoding";

// Plugin execution order: cleanup first, then text transforms, timing adjustments, output format.
// Remove Ads → Cyrillization → Long Lines → CPS → Min Duration → Gap → Encoding
export const allPlugins: PluginConfig[] = [removeAdsPlugin, cyrillizationPlugin, longLinesPlugin, cpsPlugin, minDurationPlugin, gapPlugin, encodingPlugin];
