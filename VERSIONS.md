# SRT Editor — Version Log

## 2.0 — Extended Subtitle Info
- CPS distribution (count of subtitles exceeding each threshold: >15, >16, ..., >30)
- Short duration buckets (count of subtitles < 1000ms, < 1500ms, < 2000ms)
- Total subtitle count and total duration
- Inspired by SubReport Pascal script for Subtitle Workshop

## 1.9 — Subtitle Info
- Per-file info button showing subtitle statistics (max CPS, line length, duration, >2 lines)
- Before/after comparison after processing

## 1.8 — Content-aware Diff
- Improved diff alignment using diff library for content-aware matching

## 1.7 — Remove Ads Plugin
- Removes known ad subtitles (titlovi.com) from beginning/end of files

## 1.6 — Encoding Plugin
- Output encoding selection (UTF-8, Windows-1250, Windows-1251, keep original)

## 1.5 — Preact Rewrite
- Converted UI from vanilla DOM manipulation to Preact components

## 1.4 — UI Redesign
- Single drop zone with file list, modal diff/log, new visual theme

## 1.3 — Diff View
- Side-by-side diff for comparing original vs processed subtitles

## 1.2 — Cyrillization Improvements
- Foreign word blocklist and Roman numeral detection
- Digraph split exceptions for morpheme boundaries
- Fixed re-run counting bug, added .cyr.sr filename suffix

## 1.1 — Test Suite
- Added vitest test suite

## 1.0 — Initial Release
- SRT parser/serializer with encoding detection
- CPS, Gap, Long Lines, Cyrillization plugins
- Drag-and-drop file processing
