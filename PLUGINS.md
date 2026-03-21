# SRT Editor Plugins

## Remove Ads

**Purpose:** Removes known advertisement subtitles from the beginning and end of the file.

**Parameters:** None (toggle only).

**How it works:**
1. If the last subtitle's text is `Preuzeto sa www.titlovi.com`, it is removed.
2. If the first subtitle's text is `www.titlovi.com`, it is removed.
3. Remaining subtitles are re-indexed sequentially.

**Execution order:** Runs first, before all other plugins (cleanup step).

---

## Dialog Dash

**Purpose:** Removes the dialog dash from the first speaker's line and removes the space after dashes on subsequent speaker lines. In subtitle dialog convention, the first speaker doesn't need a dash — only speaker changes are marked with dashes.

**Parameters:** None (toggle only).

**How it works:**
1. Only affects multi-line subtitles (2+ lines) where at least two lines start with `- ` (after optional tags).
2. **First line:** The `- ` (dash + space) is removed entirely (after any leading tags like `{\an8}`, `{i}`, `<b>`, etc.).
3. **Other lines:** The space after the dash is removed (`- Text` → `-Text`), keeping the dash itself.
4. Lines that don't start with a dash are left unchanged.
5. Dashes in the middle of a line (e.g. `Text -more`) are not affected.

**Example:**
```
- Laku noć, cure.
- Vidimo se ujutro, drugarice.
```
becomes:
```
Laku noć, cure.
-Vidimo se ujutro, drugarice.
```

With tags:
```
{\an8}- Gdje si dosad?
- Dobra večer.
```
becomes:
```
{\an8}Gdje si dosad?
-Dobra večer.
```

**Execution order:** Runs after Remove Ads and before Cyrillization (improves original subtitle before any transforms).

---

## Cyrillization

**Purpose:** Converts subtitle text from Serbian Latin script to Cyrillic script.

**Parameters:** None (toggle only).

**How it works:**
1. For each subtitle line, split text into tag tokens and content tokens. Formatting tags (`<b>`, `{i}`, `<font ...>`, etc.) are preserved as-is.
2. Content tokens are converted left-to-right, matching digraphs before single characters:
   - Digraphs: `lj` → `љ`, `nj` → `њ`, `dž` → `џ` (and their capitalized/uppercase variants)
   - Single characters: `a` → `а`, `b` → `б`, `š` → `ш`, etc.
   - Words containing `w`, `q`, or `y` (foreign words) are left entirely in Latin.
   - A blocklist of common foreign words (e.g. `live`, `discord`, `fresh`, `visa`, `co2`, `h2o`, etc.) is matched case-insensitively and left in Latin.
   - Uppercase Roman numerals with 2+ characters (e.g. `IV`, `VII`, `XII`, `MCMXCIX`) are detected and left in Latin. Single `I` is always cyrillized (treated as the Serbian conjunction "и").
   - Digraph exceptions at morpheme boundaries: `nj` is not merged to `њ` in words starting with `injekc`, `konjuk`, `konjug`, or `tanjug`; `dž` is not merged to `џ` in words starting with `nadž`.
   - Characters outside the Serbian Latin alphabet (digits, punctuation) are left unchanged.
3. If the input file's encoding is `windows-1250`, it is automatically changed to `windows-1251` on output. UTF-8 files remain UTF-8.
4. Toggling Cyrillization on automatically enables the Extension plugin with `cyr.sr`, so downloaded files get `.cyr.sr` inserted before the `.srt` extension (e.g. `Movie.Name.srt` → `Movie.Name.cyr.sr.srt`).

**Execution order:** Cyrillization runs after Dialog Dash, before Long Lines, CPS, and Gap.

---

## Long Lines

**Purpose:** Ensures no subtitle line exceeds a maximum character length by re-splitting text across two balanced lines.

**Parameter:**
- **Max Line Length** (default: `42`) — Maximum visible characters per line (tags excluded from count).

**How it works:**
1. For each subtitle, check if any line exceeds the max length (visible characters only, tags stripped for counting).
2. If a line is too long:
   - Merge all lines into a single line.
   - If the merged text fits within the max length, keep it as one line.
   - Otherwise, split into two lines at the word boundary closest to the midpoint, producing approximately equal-length lines.

**Execution order:** Runs after Cyrillization and before CPS/Gap. Dialog Dash runs before Long Lines, so dash removal may shorten lines enough to avoid splitting.

---

## CPS (Characters Per Second)

**Purpose:** Ensures that subtitles don't display text faster than a viewer can comfortably read.

**Parameter:**
- **Max CPS** (default: `25`) — The maximum allowed characters per second. If a subtitle exceeds this value, its end time is extended to bring CPS down to the threshold.

**How it works:**
1. For each subtitle, strip all formatting tags and then count visible characters across all lines (including spaces).
   Stripped tags:
   - HTML: `<b>`, `</b>`, `<i>`, `</i>`, `<u>`, `</u>`, `<font color="...">`, `</font>`
   - SRT curly-brace: `{b}`, `{/b}`, `{i}`, `{/i}`, `{u}`, `{/u}`
2. Calculate `CPS = visible_characters / duration_in_seconds`.
3. If CPS is above the configured max, compute a new end time: `new_end = start + (total_characters / max_cps) * 1000`.
4. The extension is constrained so that the subtitle does not overlap with the next subtitle:
   - **If the Gap plugin is active:** The subtitle can only extend up to `next_start - min_gap` (respecting the minimum gap).
   - **If the Gap plugin is inactive:** The subtitle can extend up to `next_start - 1ms`.
5. The subtitle is never shortened — if the constraint prevents full extension, it keeps its original end time or extends as far as allowed.

**Example:**
A subtitle with 60 characters and duration of 2 seconds has CPS = 30. With Max CPS = 25, the required duration is 60/25 = 2.4 seconds. The end time is extended by 400ms (if the next subtitle allows it).

---

## Min Duration

**Purpose:** Ensures no subtitle is shorter than a configurable minimum duration. Short subtitles flash on screen too quickly to read.

**Parameter:**
- **Min Duration** (default: `2000` ms) — The minimum allowed subtitle duration in milliseconds. If a subtitle's duration is below this value, its end time is extended.

**How it works:**
1. For each subtitle, calculate its duration: `duration = end - start`.
2. If the duration is below the configured minimum, compute a new end time: `new_end = start + min_duration`.
3. The extension is constrained so that the subtitle does not overlap with the next subtitle:
   - **If the Gap plugin is active:** The subtitle can only extend up to `next_start - min_gap` (respecting the minimum gap).
   - **If the Gap plugin is inactive:** The subtitle can extend up to `next_start - 1ms`.
4. The subtitle is never shortened — if the constraint prevents full extension, it keeps its original end time or extends as far as allowed.
5. The last subtitle has no next-subtitle constraint and extends freely.

**Interaction with CPS and Gap:**
CPS runs first and may extend subtitles enough to meet the minimum duration. Min Duration then catches any remaining short subtitles. Gap runs last and trims any gap violations that result from extensions.

**Execution order:** Runs after CPS and before Gap.

---

## Gap (Minimum Gap)

**Purpose:** Enforces a minimum time gap between consecutive subtitles so they don't appear to run together.

**Parameter:**
- **Min Gap** (default: `125` ms) — The minimum number of milliseconds required between the end of one subtitle and the start of the next.

**How it works:**
1. For each subtitle (except the last), check the gap to the next subtitle: `gap = next_start - current_end`.
2. If the gap is less than the configured minimum, trim the current subtitle's end time back to `next_start - min_gap`.
3. The subtitle is never trimmed so far that its end time goes to or before its start time.

**Interaction with CPS and Min Duration:**
When the Gap plugin is active, it constrains how far the CPS and Min Duration plugins can extend a subtitle. Neither will push a subtitle's end time past `next_start - min_gap`. When Gap is inactive, they can extend up to 1ms before the next subtitle starts.

**Execution order:**
CPS runs first (extends durations), then Min Duration (extends short subtitles), then Gap runs (trims any remaining violations).

---

## Encoding

**Purpose:** Choose the output encoding for processed SRT files.

**Parameter:**
- **Target Encoding** (default: `Keep original`) — Select dropdown with options:
  - **Keep original** — File stays in its detected encoding.
  - **UTF-8** — Convert output to UTF-8.
  - **Windows-1250** — Convert output to Windows-1250 (Central/Eastern European).
  - **Windows-1251** — Convert output to Windows-1251 (Cyrillic).

**How it works:**
1. After all content and timing plugins have run, the chosen encoding is applied to the output file.
2. If "Keep original" is selected (or the plugin is disabled), the file keeps its detected encoding.
3. Files where only the encoding changed (no subtitle modifications) are still marked as changed and available for download.

**Interaction with Cyrillization:**
When Cyrillization is active, Windows-1250 is incompatible with Cyrillic characters. If the resulting encoding would be Windows-1250 (whether from "Keep original" on a 1250 file or explicitly selected), it is automatically overridden to Windows-1251. A note is added to the processing log.

**Execution order:**
Encoding runs after all content and timing transforms (Dialog Dash → Cyrillization → Long Lines → CPS → Min Duration → Gap → Encoding → Extension).

---

## Extension

**Purpose:** Adds a custom string before `.srt` in the download filename. Useful for indicating the language or variant in the filename (e.g. `Movie.srt` → `Movie.sr.srt`).

**Parameter:**
- **Extension** (default: empty) — A text string inserted before `.srt` in the output filename. For example, entering `sr` produces `Movie.sr.srt`.

**How it works:**
1. When enabled with a non-empty extension value, the download filename is modified: `filename.srt` → `filename.<extension>.srt`.
2. The extension does not affect subtitle content — it only changes the download filename.

**Interaction with Cyrillization:**
When Cyrillization is toggled on, the Extension plugin is automatically enabled with the value `cyr.sr`, so files download as `Movie.cyr.sr.srt`. The extension can be manually changed after auto-activation.

**Execution order:**
Extension runs last (filename-only transform, after Encoding).
