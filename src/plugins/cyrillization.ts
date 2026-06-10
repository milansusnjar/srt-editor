import { PluginConfig, Subtitle } from "../types";

/** Serbian Latin → Cyrillic digraph mappings (must match before single chars) */
const digraphs = new Map<string, string>([
  ["lj", "љ"], ["Lj", "Љ"], ["LJ", "Љ"],
  ["nj", "њ"], ["Nj", "Њ"], ["NJ", "Њ"],
  ["dž", "џ"], ["Dž", "Џ"], ["DŽ", "Џ"],
]);

/** Serbian Latin → Cyrillic single-character mappings */
const singles = new Map<string, string>([
  ["a", "а"], ["A", "А"], ["b", "б"], ["B", "Б"],
  ["c", "ц"], ["C", "Ц"], ["č", "ч"], ["Č", "Ч"],
  ["ć", "ћ"], ["Ć", "Ћ"], ["d", "д"], ["D", "Д"],
  ["đ", "ђ"], ["Đ", "Ђ"], ["e", "е"], ["E", "Е"],
  ["f", "ф"], ["F", "Ф"], ["g", "г"], ["G", "Г"],
  ["h", "х"], ["H", "Х"], ["i", "и"], ["I", "И"],
  ["j", "ј"], ["J", "Ј"], ["k", "к"], ["K", "К"],
  ["l", "л"], ["L", "Л"], ["m", "м"], ["M", "М"],
  ["n", "н"], ["N", "Н"], ["o", "о"], ["O", "О"],
  ["p", "п"], ["P", "П"], ["r", "р"], ["R", "Р"],
  ["s", "с"], ["S", "С"], ["š", "ш"], ["Š", "Ш"],
  ["t", "т"], ["T", "Т"], ["u", "у"], ["U", "У"],
  ["v", "в"], ["V", "В"], ["z", "з"], ["Z", "З"],
  ["ž", "ж"], ["Ž", "Ж"],
]);

function cyrillize(text: string): string {
  let result = "";
  let i = 0;
  while (i < text.length) {
    if (i + 1 < text.length) {
      const pair = text[i] + text[i + 1];
      const mapped = digraphs.get(pair);
      if (mapped !== undefined) {
        result += mapped;
        i += 2;
        continue;
      }
    }
    const ch = text[i];
    result += singles.get(ch) ?? ch;
    i++;
  }
  return result;
}

/** Whole foreign words that should never be cyrillized (matched case-insensitively) */
const foreignWords = new Set([
  "about", "air", "alpha", "and", "back", "bitcoin", "brainz",
  "celebrities", "co2", "conditions", "cpu", "creative", "disclaimer",
  "discord", "dj", "electronics", "entertainment", "files", "fresh",
  "fun", "geographic", "gmbh", "green", "h2o", "hair", "have", "home",
  "idj", "idjtv", "latest", "life", "like", "live",
  "login", "made", "makeup", "must", "national", "previous", "public",
  "punk", "reserved", "score", "screen", "terms", "the", "url",
  "visa",
]);

/** Valid Roman numeral pattern (uppercase only, e.g. IV, XII, MCMXCIX) */
const romanNumeralRe =
  /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;

function isRomanNumeral(word: string): boolean {
  return word.length >= 2 && romanNumeralRe.test(word);
}

/**
 * Prefixes where a digraph at the morpheme boundary must NOT be merged.
 * [lowercasePrefix, splitPosition] — the word is split at splitPosition
 * so the two digraph characters end up in separate cyrillize() calls.
 */
const digraphSplitPrefixes: [string, number][] = [
  ["nadž", 3],    // nad + živeti  (dž spans boundary)
  ["podž", 3],    // pod + žanr    (dž spans boundary)
  ["injekc", 2],  // in + jekcija  (nj spans boundary)
  ["konjuk", 3],  // kon + juktura (nj spans boundary)
  ["konjug", 3],  // kon + jugacija(nj spans boundary)
  ["konjunk", 3], // kon + junktura(nj spans boundary)
  ["tanjug", 3],  // tan + jug     (nj spans boundary)
];

function cyrillizeWord(word: string): string {
  const lower = word.toLowerCase();
  for (const [prefix, splitAt] of digraphSplitPrefixes) {
    if (lower.startsWith(prefix)) {
      return cyrillize(word.slice(0, splitAt)) + cyrillize(word.slice(splitAt));
    }
  }
  return cyrillize(word);
}

/** rock-and-roll, rock and roll, rock'n'roll (case-insensitive) */
const rockAndRollRe =
  /\brock(?:(?:[-\s]+and[-\s]+)|(?:'\s*n\s*'))roll\b/gi;

/** Letters/digits that can appear in a word segment (incl. accented Latin) */
const wordSegmentRe = /[a-zA-Z0-9\u00c0-\u024f]+/gi;

/** URL or email-like tokens (e.g. imdb.com, user@mail.com) */
const urlSegmentRe =
  /(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?|[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}/g;

/** Hyphenated compounds (e.g. Wi-Fi, KWF-u, rok-end-rol) */
const hyphenSegmentRe = new RegExp(
  `${wordSegmentRe.source}(?:-${wordSegmentRe.source})+`,
  "g",
);

const textSegmentRe = new RegExp(
  `${rockAndRollRe.source}|${urlSegmentRe.source}|${hyphenSegmentRe.source}|${wordSegmentRe.source}`,
  "gi",
);

/** A word is foreign if it contains any letter outside the Serbian Latin alphabet */
const foreignLetterRe = /[^a-pr-vzA-PR-VZ0-9\u010c\u010d\u0106\u0107\u0110\u0111\u0160\u0161\u017d\u017e]/;

/** Strictly URL/email shaped: lowercase TLD so sentence boundaries ("kraj.Ali") don't match */
const strictUrlRe =
  /^(?:(?:[a-zA-Z0-9-]+\.)+[a-z]{2,}(?:\/[^\s]*)?|[^\s@]+@[^\s@]+\.[a-z]{2,})$/;

/** Serbian case endings that may follow a hyphen after a foreign word/acronym */
const caseSuffixes = new Set([
  "a", "e", "i", "o", "u", "om", "em", "ju", "jem",
  "ima", "ama", "ovima", "evima",
  "ov", "ev", "ova", "eva", "ove", "eve", "ovu", "evu",
  "ovi", "evi", "ovo", "evo", "ovog", "evog", "ovom", "evom",
  "jev", "jeva", "jeve", "jevu", "jevi", "jevo", "jevog", "jevom",
]);

function isRockAndRollPhrase(segment: string): boolean {
  return /^rock(?:(?:[-\s]+and[-\s]+)|(?:'\s*n\s*'))roll$/i.test(segment);
}

function convertWord(word: string): string {
  if (foreignLetterRe.test(word)) return word;
  if (foreignWords.has(word.toLowerCase())) return word;
  if (isRomanNumeral(word)) return word;
  return cyrillizeWord(word);
}

function convertHyphenated(segment: string): string {
  const parts = segment.split("-");
  const anyForeign = parts.some(
    (p) => foreignLetterRe.test(p) || foreignWords.has(p.toLowerCase()),
  );
  if (!anyForeign) return parts.map(convertWord).join("-");
  // Foreign compound: keep parts Latin, but cyrillize Serbian case-ending
  // suffixes (e.g. KWF-u → KWF-у)
  return parts
    .map((p) =>
      caseSuffixes.has(p) && !foreignLetterRe.test(p) ? cyrillize(p) : p,
    )
    .join("-");
}

function cyrillizeText(text: string): string {
  return text.replace(textSegmentRe, (segment) => {
    if (isRockAndRollPhrase(segment)) return segment;
    if (segment.includes(".") || segment.includes("@") || segment.includes("/")) {
      if (strictUrlRe.test(segment)) return segment;
      // Not actually a URL (e.g. sentence boundary "kraj.Ali") — convert parts
      return segment.replace(wordSegmentRe, convertWord);
    }
    if (segment.includes("-")) return convertHyphenated(segment);
    return convertWord(segment);
  });
}

function cyrillizeLine(line: string): string {
  // Split into tag tokens and text tokens; tags are preserved as-is
  const parts = line.split(/(<[^>]+>|\{[^}]+})/);
  return parts
    .map((part, idx) => (idx % 2 === 1 ? part : cyrillizeText(part)))
    .join("");
}

export const cyrillizationPlugin: PluginConfig = {
  id: "cyrillization",
  name: "Cyrillization",
  description:
    "Converts subtitle text from Serbian Latin to Cyrillic. Handles digraphs (lj→љ, nj→њ, dž→џ). Preserves formatting tags.",
  enabled: false,
  params: [],
  run(subtitles: Subtitle[]): Subtitle[] {
    return subtitles.map((sub) => ({
      ...sub,
      lines: sub.lines.map(cyrillizeLine),
    }));
  },
};
