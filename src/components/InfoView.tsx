import { SrtFile } from "../types";
import { computeSubInfo, SubtitleInfo, CPS_THRESHOLDS, SHORT_DURATION_THRESHOLDS } from "../utils/subInfo";

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

function formatTimestamp(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const millis = ms % 1000;
  const pad2 = (n: number) => n.toString().padStart(2, "0");
  const pad3 = (n: number) => n.toString().padStart(3, "0");
  return `${pad2(h)}:${pad2(m)}:${pad2(s)},${pad3(millis)}`;
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

function SimpleRow({ label, original, processed }: {
  label: string;
  original: string;
  processed?: string;
}) {
  return (
    <div class="info-stat">
      <span class="info-stat-label">{label}</span>
      <span class="info-stat-value">{original}</span>
      {processed !== undefined && (
        <span class="info-stat-value">{processed}</span>
      )}
    </div>
  );
}

function DistributionRow({ label, original, processed }: {
  label: string;
  original: number;
  processed?: number;
}) {
  if (original === 0 && (!processed || processed === 0)) return null;
  return (
    <div class="info-stat">
      <span class="info-stat-label info-stat-label-indent">{label}</span>
      <span class="info-stat-value">{original}</span>
      {processed !== undefined && (
        <span class="info-stat-value">{processed}</span>
      )}
    </div>
  );
}

export function InfoView({ file, hasRun }: InfoViewProps) {
  const origInfo = computeSubInfo(file.originalSubtitles);
  const procInfo = hasRun ? computeSubInfo(file.subtitles) : null;
  const twoCol = !!procInfo;

  const origMaxCps = { display: formatCps(origInfo.maxCps.value), line: origInfo.maxCps.line };
  const procMaxCps = procInfo ? { display: formatCps(procInfo.maxCps.value), line: procInfo.maxCps.line } : undefined;

  const origMaxLine = { display: origInfo.maxLineLength.value.toString(), line: origInfo.maxLineLength.line };
  const procMaxLine = procInfo ? { display: procInfo.maxLineLength.value.toString(), line: procInfo.maxLineLength.line } : undefined;

  const origMaxDur = { display: formatDuration(origInfo.maxDuration.value), line: origInfo.maxDuration.line };
  const procMaxDur = procInfo ? { display: formatDuration(procInfo.maxDuration.value), line: procInfo.maxDuration.line } : undefined;

  const origMinDur = { display: formatDuration(origInfo.minDuration.value), line: origInfo.minDuration.line };
  const procMinDur = procInfo ? { display: formatDuration(procInfo.minDuration.value), line: procInfo.minDuration.line } : undefined;

  const origMoreThan2 = { count: origInfo.moreThanTwoLines.value, line: origInfo.moreThanTwoLines.line };
  const procMoreThan2 = procInfo ? { count: procInfo.moreThanTwoLines.value, line: procInfo.moreThanTwoLines.line } : undefined;

  return (
    <div>
      <div class={`info-grid${twoCol ? " info-grid-two" : ""}`}>
        <div />
        <span class="info-grid-header">Original</span>
        {twoCol && <span class="info-grid-header">Processed</span>}

        <SimpleRow
          label="Subtitles"
          original={origInfo.totalCount.toString()}
          processed={procInfo ? procInfo.totalCount.toString() : undefined}
        />
        <SimpleRow
          label="Duration"
          original={formatTimestamp(origInfo.totalDurationMs)}
          processed={procInfo ? formatTimestamp(procInfo.totalDurationMs) : undefined}
        />

        <div class="info-separator" />
        {twoCol && <div class="info-separator" />}
        {twoCol && <div class="info-separator" />}

        <StatRow label="Max CPS" original={origMaxCps} processed={procMaxCps} />
        <StatRow label="Max line length" original={origMaxLine} processed={procMaxLine} />
        <StatRow label="Max duration" original={origMaxDur} processed={procMaxDur} />
        <StatRow label="Min duration" original={origMinDur} processed={procMinDur} />
        <CountRow label="> 2 lines" original={origMoreThan2} processed={procMoreThan2} />

        <div class="info-separator" />
        {twoCol && <div class="info-separator" />}
        {twoCol && <div class="info-separator" />}

        {CPS_THRESHOLDS.map((t) => (
          <DistributionRow
            key={`cps-${t}`}
            label={`> ${t} CPS`}
            original={origInfo.cpsDistribution[t]}
            processed={procInfo ? procInfo.cpsDistribution[t] : undefined}
          />
        ))}

        <div class="info-separator" />
        {twoCol && <div class="info-separator" />}
        {twoCol && <div class="info-separator" />}

        {SHORT_DURATION_THRESHOLDS.map((t) => (
          <DistributionRow
            key={`dur-${t}`}
            label={`< ${t} ms`}
            original={origInfo.shortDuration[t]}
            processed={procInfo ? procInfo.shortDuration[t] : undefined}
          />
        ))}
      </div>
    </div>
  );
}
