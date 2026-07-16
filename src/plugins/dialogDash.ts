import { PluginConfig, Subtitle } from "../types";

/** Regex to match leading tags (ASS curly-brace tags and HTML tags) */
const LEADING_TAGS_RE = /^((?:\{[^}]*\}|<[^>]*>)*)/;

/**
 * Check if a line starts with "- " after optional leading tags.
 * Returns the match groups or null.
 */
function parseDialogLine(line: string): { tags: string; rest: string } | null {
  const m = LEADING_TAGS_RE.exec(line);
  const tags = m ? m[1] : "";
  const rest = line.slice(tags.length);
  if (rest.startsWith("- ")) {
    return { tags, rest: rest.slice(2) };
  }
  if (rest.startsWith("-")) {
    return { tags, rest: rest.slice(1) };
  }
  return null;
}

/** Lowercase letter before dash means a regular dash, not dialog. */
function isDialogDashAt(str: string, offset: number): boolean {
  const charBefore = offset > 0 ? str[offset - 1] : "";
  return !/\p{Ll}/u.test(charBefore);
}

/** Remove space after mid-line dialog dashes: " - Text" → " -Text". */
function fixMidLineDialogDashes(line: string): string {
  return line.replace(/ - /g, (match, offset, str) =>
    isDialogDashAt(str, offset) ? " -" : match,
  );
}

function hasDialogMarkers(lines: string[]): boolean {
  return lines.some(
    (line) =>
      parseDialogLine(line) !== null ||
      fixMidLineDialogDashes(line) !== line,
  );
}

function processLine(line: string, isFirstLine: boolean): string {
  const parsed = parseDialogLine(line);
  const withoutLineStart = parsed
    ? isFirstLine
      ? parsed.tags + parsed.rest
      : parsed.tags + "-" + parsed.rest
    : line;
  return fixMidLineDialogDashes(withoutLineStart);
}

export const dialogDashPlugin: PluginConfig = {
  id: "dialogDash",
  name: "Dialog Dash",
  description:
    "Removes the dash and space from the first speaker's line. For other speakers, removes only the space after the dash.",
  enabled: true,
  params: [],
  run(subtitles: Subtitle[]): Subtitle[] {
    return subtitles.map((sub) => {
      if (!hasDialogMarkers(sub.lines)) return sub;

      const newLines = sub.lines.map((line, i) => processLine(line, i === 0));

      return { ...sub, lines: newLines };
    });
  },
};