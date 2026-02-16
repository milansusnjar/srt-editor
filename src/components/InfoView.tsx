import { SrtFile } from "../types";
import { computeSubInfo, SubtitleInfo } from "../utils/subInfo";

interface InfoViewProps {
  file: SrtFile;
  hasRun: boolean;
}

function formatCps(value: number): string {
  return Math.round(value).toString();
}

function formatDuration(value: number): string {
  return value.toFixed(2) + "s";
}

function StatRow({ label, original, processed }: {
  label: string;
  original: { display: string; line: number };
  processed?: { display: string; line: number };
}) {
  return (
    <div class="info-stat">
      <span class="info-stat-label">{label}</span>
      <span class="info-stat-value">
        {original.display} <span class="info-stat-line">(line {original.line})</span>
      </span>
      {processed && (
        <span class="info-stat-value">
          {processed.display} <span class="info-stat-line">(line {processed.line})</span>
        </span>
      )}
    </div>
  );
}

function CountRow({ label, original, processed }: {
  label: string;
  original: { count: number; line: number };
  processed?: { count: number; line: number };
}) {
  return (
    <div class="info-stat">
      <span class="info-stat-label">{label}</span>
      <span class="info-stat-value">
        {original.count > 0
          ? <>{original.count} <span class="info-stat-line">(first: line {original.line})</span></>
          : "None"}
      </span>
      {processed && (
        <span class="info-stat-value">
          {processed.count > 0
            ? <>{processed.count} <span class="info-stat-line">(first: line {processed.line})</span></>
            : "None"}
        </span>
      )}
    </div>
  );
}

function statDisplay(info: SubtitleInfo) {
  return {
    maxCps: { display: formatCps(info.maxCps.value), line: info.maxCps.line },
    maxLineLength: { display: info.maxLineLength.value.toString(), line: info.maxLineLength.line },
    maxDuration: { display: formatDuration(info.maxDuration.value), line: info.maxDuration.line },
    minDuration: { display: formatDuration(info.minDuration.value), line: info.minDuration.line },
    moreThanTwoLines: { count: info.moreThanTwoLines.value, line: info.moreThanTwoLines.line },
  };
}

export function InfoView({ file, hasRun }: InfoViewProps) {
  const origInfo = computeSubInfo(file.originalSubtitles);
  const orig = statDisplay(origInfo);

  const procInfo = hasRun ? computeSubInfo(file.subtitles) : null;
  const proc = procInfo ? statDisplay(procInfo) : null;

  return (
    <div>
      <div class={`info-grid${proc ? " info-grid-two" : ""}`}>
        <div />
        <span class="info-grid-header">Original</span>
        {proc && <span class="info-grid-header">Processed</span>}

        <StatRow label="Max CPS" original={orig.maxCps} processed={proc?.maxCps} />
        <StatRow label="Max line length" original={orig.maxLineLength} processed={proc?.maxLineLength} />
        <StatRow label="Max duration" original={orig.maxDuration} processed={proc?.maxDuration} />
        <StatRow label="Min duration" original={orig.minDuration} processed={proc?.minDuration} />
        <CountRow label="> 2 lines" original={orig.moreThanTwoLines} processed={proc?.moreThanTwoLines} />
      </div>
    </div>
  );
}
