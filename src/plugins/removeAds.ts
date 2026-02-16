import { PluginConfig, Subtitle } from "../types";

const ADS = [
  "Preuzeto sa www.titlovi.com",
  "www.titlovi.com",
];

function isAd(subtitle: Subtitle): boolean {
  const text = subtitle.lines.join(" ").trim();
  return ADS.some((ad) => text === ad);
}

export const removeAdsPlugin: PluginConfig = {
  id: "removeAds",
  name: "Remove Ads",
  description:
    "Removes known advertisement subtitles (e.g. titlovi.com) from the first and last position in the file.",
  enabled: false,
  params: [],
  run(subtitles: Subtitle[]): Subtitle[] {
    if (subtitles.length === 0) return subtitles;

    let result = subtitles;

    if (result.length > 0 && isAd(result[result.length - 1])) {
      result = result.slice(0, -1);
    }

    if (result.length > 0 && isAd(result[0])) {
      result = result.slice(1);
    }

    // Re-index
    if (result.length !== subtitles.length) {
      result = result.map((s, i) => ({ ...s, index: i + 1 }));
    }

    return result;
  },
};
