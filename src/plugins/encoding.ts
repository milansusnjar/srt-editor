import { PluginConfig } from "../types";

export const ENCODING_MAP: Record<number, string | null> = {
  0: null,         // Keep original
  1: "utf-8",
  2: "windows-1250",
  3: "windows-1251",
};

export const encodingPlugin: PluginConfig = {
  id: "encoding",
  name: "Encoding",
  description: "Choose the output encoding for processed files. When Cyrillization is active, Windows-1250 is automatically changed to Windows-1251.",
  enabled: false,
  params: [
    {
      key: "targetEncoding",
      label: "Target Encoding",
      defaultValue: 0,
      options: [
        { value: 0, label: "Keep original" },
        { value: 1, label: "UTF-8" },
        { value: 2, label: "Windows-1250" },
        { value: 3, label: "Windows-1251" },
      ],
    },
  ],
  run: (subtitles) => subtitles,
};
