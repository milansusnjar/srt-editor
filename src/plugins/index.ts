import { PluginConfig } from "../types";
import { removeAdsPlugin } from "./removeAds";
import { dialogDashPlugin } from "./dialogDash";
import { cyrillizationPlugin } from "./cyrillization";
import { longLinesPlugin } from "./longLines";
import { cpsPlugin } from "./cps";
import { minDurationPlugin } from "./minDuration";
import { gapPlugin } from "./gap";
import { encodingPlugin } from "./encoding";
import { extensionPlugin } from "./extension";

// Plugin execution order: cleanup first, then text transforms, timing adjustments, output format.
// Remove Ads → Dialog Dash → Cyrillization → Long Lines → CPS → Min Duration → Gap → Encoding → Extension
export const allPlugins: PluginConfig[] = [removeAdsPlugin, dialogDashPlugin, cyrillizationPlugin, longLinesPlugin, cpsPlugin, minDurationPlugin, gapPlugin, encodingPlugin, extensionPlugin];
