import { PluginConfig, Subtitle } from "../types";

export const extensionPlugin: PluginConfig = {
  id: "extension",
  name: "Extension",
  description:
    "Adds a custom string before .srt in the download filename. For example, with extension 'sr', 'Movie.srt' becomes 'Movie.sr.srt'.",
  enabled: false,
  params: [
    {
      key: "ext",
      label: "Extension",
      type: "text",
      defaultValue: 0,
      defaultText: "",
    },
  ],
  run(subtitles: Subtitle[]): Subtitle[] {
    return subtitles;
  },
};