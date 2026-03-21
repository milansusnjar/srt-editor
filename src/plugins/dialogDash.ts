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

export const dialogDashPlugin: PluginConfig = {
  id: "dialogDash",
  name: "Dialog Dash",
  description:
    "Removes the dash and space from the first speaker's line in dialog subtitles. For other speakers, removes only the space after the dash. Only affects multi-line subtitles where lines start with dashes.",
  enabled: false,
  params: [],
  run(subtitles: Subtitle[]): Subtitle[] {
    return subtitles.map((sub) => {
      if (sub.lines.length < 2) return sub;

      // Check if first line starts with "- " (after optional tags)
      const firstParsed = parseDialogLine(sub.lines[0]);
      if (!firstParsed) return sub;

      // Check that at least one other line also starts with a dash
      const hasOtherDash = sub.lines
        .slice(1)
        .some((line) => parseDialogLine(line) !== null);
      if (!hasOtherDash) return sub;

      const newLines = sub.lines.map((line, i) => {
        const parsed = parseDialogLine(line);
        if (!parsed) return line;

        if (i === 0) {
          // First line: remove dash and space entirely
          return parsed.tags + parsed.rest;
        } else {
          // Other lines: keep dash, remove space
          return parsed.tags + "-" + parsed.rest;
        }
      });

      return { ...sub, lines: newLines };
    });
  },
};