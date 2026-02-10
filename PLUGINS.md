# SRT Editor Plugins

## Cyrilization

**Purpose:** Converts subtitle text from Serbian Latin script to Cyrillic script.

**Parameters:** None (toggle only).

**How it works:**
1. For each subtitle line, split text into tag tokens and content tokens. Formatting tags (`<b>`, `{i}`, `<font ...>`, etc.) are preserved as-is.
2. Content tokens are converted left-to-right, matching digraphs before single characters:
   - Digraphs: `lj` → `љ`, `nj` → `њ`, `dž` → `џ` (and their capitalized/uppercase variants)
   - Single characters: `a` → `а`, `b` → `б`, `š` → `ш`, etc.
   - Words containing `w`, `q`, or `y` (foreign words) are left entirely in Latin.
   - Characters outside the Serbian Latin alphabet (digits, punctuation) are left unchanged.
3. If the input file's encoding is `windows-1250`, it is automatically changed to `windows-1251` on output. UTF-8 files remain UTF-8.

**Execution order:** Cyrilization runs first (text transform), before CPS and Gap (timing adjustments).

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

## Gap (Minimum Gap)

**Purpose:** Enforces a minimum time gap between consecutive subtitles so they don't appear to run together.

**Parameter:**
- **Min Gap** (default: `125` ms) — The minimum number of milliseconds required between the end of one subtitle and the start of the next.

**How it works:**
1. For each subtitle (except the last), check the gap to the next subtitle: `gap = next_start - current_end`.
2. If the gap is less than the configured minimum, trim the current subtitle's end time back to `next_start - min_gap`.
3. The subtitle is never trimmed so far that its end time goes to or before its start time.

**Interaction with CPS:**
When the Gap plugin is active, it constrains how far the CPS plugin can extend a subtitle. CPS will not push a subtitle's end time past `next_start - min_gap`. When Gap is inactive, CPS is free to extend a subtitle up to 1ms before the next subtitle starts.

**Execution order:**
CPS runs first (extends durations), then Gap runs (trims any remaining violations).
