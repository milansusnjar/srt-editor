import { SrtFile } from "../types";
import { serializeSrt } from "../srt";
import { encode } from "../encoding";

export function encodingLabel(enc: string): string {
  if (enc === "windows-1250") return "1250";
  if (enc === "windows-1251") return "1251";
  return enc.toUpperCase().replace("WINDOWS-", "");
}

export function encodingClass(enc: string): string {
  return "enc-" + enc.replace("windows-", "").replace(/[\s-]/g, "").toLowerCase();
}

export function getDownloadName(file: SrtFile, pluginStates: Map<string, { enabled: boolean; params: Record<string, number> }>): string {
  let name = file.name;
  if (pluginStates.get("cyrillization")?.enabled) {
    name = name.replace(/\.srt$/i, ".cyr.sr.srt");
  }
  return name;
}

export function fileChanged(file: SrtFile): boolean {
  if (file.originalSubtitles.length !== file.subtitles.length) return true;
  for (let i = 0; i < file.subtitles.length; i++) {
    const orig = file.originalSubtitles[i];
    const proc = file.subtitles[i];
    if (orig.startMs !== proc.startMs || orig.endMs !== proc.endMs) return true;
    if (orig.lines.join("\n") !== proc.lines.join("\n")) return true;
  }
  return false;
}

export function downloadFile(file: SrtFile, pluginStates: Map<string, { enabled: boolean; params: Record<string, number> }>) {
  const content = serializeSrt(file.subtitles);
  const bytes = encode(content, file.encoding);
  const blob = new Blob([bytes as unknown as ArrayBuffer], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = getDownloadName(file, pluginStates);
  a.click();
  URL.revokeObjectURL(url);
}
