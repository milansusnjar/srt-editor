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
  ["injekc", 2],  // in + jekcija  (nj spans boundary)
  ["konjuk", 3],  // kon + juktura (nj spans boundary)
  ["konjug", 3],  // kon + jugacija(nj spans boundary)
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

function cyrillizeText(text: string): string {
  // Match runs of letters/digits (including Serbian diacritics) as words
  return text.replace(/[a-zA-Z0-9\u010c\u010d\u0106\u0107\u0110\u0111\u0160\u0161\u017d\u017e]+/g, (word) => {
    if (/[wqyWQY]/.test(word)) return word;
    if (foreignWords.has(word.toLowerCase())) return word;
    if (isRomanNumeral(word)) return word;
    return cyrillizeWord(word);
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
