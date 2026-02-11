export interface Subtitle {
  index: number;
  startMs: number;
  endMs: number;
  lines: string[];
}

export interface SrtFile {
  name: string;
  encoding: string;
  originalEncoding: string;
  subtitles: Subtitle[];
  originalSubtitles: Subtitle[];
}

export interface PluginConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  params: PluginParam[];
  run: (subtitles: Subtitle[], params: Record<string, number>, activePlugins: Set<string>, allConfigs: Map<string, Record<string, number>>) => Subtitle[];
}

export interface PluginParam {
  key: string;
  label: string;
  defaultValue: number;
  min?: number;
  step?: number;
}

export interface FileProcessingLog {
  fileName: string;
  summaries: string[];
  notes: string[];
}
