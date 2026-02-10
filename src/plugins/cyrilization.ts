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

function cyrillizeText(text: string): string {
  // Match runs of letters (including Serbian diacritics) as words
  return text.replace(/[a-zA-Z\u010c\u010d\u0106\u0107\u0110\u0111\u0160\u0161\u017d\u017e]+/g, (word) => {
    if (/[wqyWQY]/.test(word)) return word;
    return cyrillize(word);
  });
}

function cyrillizeLine(line: string): string {
  // Split into tag tokens and text tokens; tags are preserved as-is
  const parts = line.split(/(<[^>]+>|\{[^}]+})/);
  return parts
    .map((part, idx) => (idx % 2 === 1 ? part : cyrillizeText(part)))
    .join("");
}

export const cyrilizationPlugin: PluginConfig = {
  id: "cyrilization",
  name: "Cyrilization",
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
