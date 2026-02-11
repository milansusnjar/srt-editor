# SRT Editor — Development Guide

## Project Overview

Browser-based .srt subtitle file processor. Users drop .srt files, configure plugins, run them, and download the results. Built with Preact + TypeScript + Vite.

## Architecture

```
src/
├── main.tsx                  — App component + render entry point
├── types.ts                  — Shared interfaces (Subtitle, SrtFile, PluginConfig, PluginParam, FileProcessingLog)
├── srt.ts                    — SRT parser (parseSrt) and serializer (serializeSrt)
├── constants.ts              — Global constants (e.g. MIN_SUBTITLE_BUFFER_MS)
├── encoding.ts               — Encoding detection & codec (UTF-8, Windows-1250, Windows-1251, UTF-16 LE/BE)
├── components/
│   ├── DropZone.tsx          — File drop/upload area with file list
│   ├── FileItem.tsx          — Single file row (encoding tag, diff/download buttons)
│   ├── ActionButtons.tsx     — Run, Show Log, Download All
│   ├── PluginList.tsx        — Plugin grid container
│   ├── PluginCard.tsx        — Plugin toggle + params
│   ├── Modal.tsx             — Generic modal (backdrop, header, close, body)
│   ├── DiffView.tsx          — Side-by-side diff content
│   └── LogView.tsx           — Processing log content
├── hooks/
│   └── usePluginState.ts     — Plugin state + localStorage persistence
├── utils/
│   ├── icons.tsx             — SVG icon components (DownloadIcon, DiffIcon, LogIcon)
│   ├── files.ts              — fileChanged(), getDownloadName(), downloadFile(), encodingLabel/Class
│   └── diff.ts               — computeDiff() pure function
└── plugins/
    ├── index.ts              — Plugin registry, controls execution order
    ├── cps.ts                — CPS plugin (characters per second)
    └── gap.ts                — Gap plugin (minimum gap between subtitles)
```

## Key Rules

### Plugins
- **Always update `PLUGINS.md`** when adding, modifying, or removing a plugin. That file is the user-facing documentation for all plugins.
- Plugin-specific constants (defaults, thresholds) must be defined in the plugin's own file, not in `constants.ts`.
- Global constants shared across plugins or the app go in `src/constants.ts`.
- Plugins are registered in `src/plugins/index.ts` — order matters (they run top to bottom).
- Each plugin receives `activePlugins` set and `allConfigs` map so it can be aware of other plugins' state and parameters.

### SRT Parsing
- Subtitles can have multi-line text (1, 2, or more lines).
- Timestamps are in `HH:MM:SS,mmm` format, internally stored as milliseconds.
- Tags (`<b>`, `{i}`, `<font color="...">`, etc.) must be preserved in output — only stripped for counting/analysis purposes.

### Encoding
- Files are read as `ArrayBuffer`, not text, to preserve encoding.
- Encoding is auto-detected and stored per file. Supported encodings:
  - **UTF-8** — detected via BOM or valid byte sequences
  - **UTF-16 LE / UTF-16 BE** — detected via BOM (`FF FE` / `FE FF`)
  - **Windows-1250** — Central/Eastern European (fallback when not UTF-8 and low high-byte ratio)
  - **Windows-1251** — Cyrillic (fallback when not UTF-8 and high-byte ratio >20%)
- Downloads are re-encoded to the original encoding.

### UI
- UI uses Preact components with JSX. App component in `main.tsx` manages top-level state.
- State: `files`, `hasRun`, `processingLogs`, `modal` via `useState`; plugin state via `usePluginState` hook with localStorage sync.
- Styles are in `index.html` `<style>` block — CSS class names and IDs are preserved for compatibility.
- Modal system uses conditional rendering + `useEffect` for body scroll lock and Escape key.

## Commands

- `npm run dev` — Start Vite dev server
- `npm run build` — TypeScript check + Vite production build
