import { PluginConfig } from "../types";
import { removeAdsPlugin } from "./removeAds";
import { dialogDashPlugin } from "./dialogDash";
import { mergeContinuationsPlugin } from "./mergeContinuations";
import { cyrillizationPlugin } from "./cyrillization";
import { longLinesPlugin } from "./longLines";
import { cpsPlugin } from "./cps";
import { timeShiftPlugin } from "./timeShift";
import { minDurationPlugin } from "./minDuration";
import { gapPlugin } from "./gap";
import { encodingPlugin } from "./encoding";
import { extensionPlugin } from "./extension";

// Plugin execution order: cleanup first, then text transforms, timing adjustments, output format.
// Remove Ads → Dialog Dash → Merge Continuations → Cyrillization → Long Lines → CPS → Time Shift → Min Duration → Gap → Encoding → Extension
export const allPlugins: PluginConfig[] = [removeAdsPlugin, dialogDashPlugin, mergeContinuationsPlugin, cyrillizationPlugin, longLinesPlugin, cpsPlugin, timeShiftPlugin, minDurationPlugin, gapPlugin, encodingPlugin, extensionPlugin];
