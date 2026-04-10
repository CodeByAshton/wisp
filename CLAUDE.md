# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Start dev server at http://localhost:5174
npm run build     # Type-check + Vite production build
npm run preview   # Preview production build
```

There is no test suite configured.

## Architecture

Wisp is a local component explorer (Storybook alternative) built with Vite + React + TypeScript. It reads `*.stories.tsx` files from a configurable directory and hot-reloads them via a custom Vite plugin.

### Data flow

1. **`src/core/wisp-plugin.ts`** — the Vite plugin. On startup it scans the stories directory and generates a virtual module (`virtual:wisp-stories`) that dynamically imports every discovered story file. It also registers chokidar watchers and two dev-server API endpoints:
   - `GET /wisp-api/status` — returns current config state
   - `POST /wisp-api/set-directory` — rewrites `wisp.config.ts` and triggers a hot-reload

2. **`src/core/StoryLoader.tsx`** — consumes `virtual:wisp-stories`, parses each module into `StoryGroup[]` via `parseStoryModules`, and listens for `wisp:stories-changed` HMR events to refresh the module list without a full page reload. File path structure (not `meta.title`) is the source of truth for sidebar hierarchy.

3. **`src/hooks/useStories.ts`** — wraps `useStoryModules()` from StoryLoader and exposes the parsed groups to the UI.

4. **`src/shell/Layout.tsx`** — the root layout; owns all top-level state (selected story, args, viewport, tab, fullscreen, sidebar width). Composes Sidebar, TopBar, Canvas, ControlsPanel, CodeViewer, DocsPanel, and SettingsPanel.

5. **`src/core/Canvas.tsx`** — renders the selected story. Stories with hooks in their `render()` function are wrapped in a `StoryRenderer` component (its own React fiber) to avoid hook-count violations when switching between stories.

### Config resolution

`wisp.config.ts` is parsed at runtime via regex (not full TS compilation) in `wisp-plugin.ts`. Config priority: `WISP_STORIES_DIR` env var > `wisp.config.ts` > default (`src/stories`). The SettingsPanel writes back to `wisp.config.ts` by calling `POST /wisp-api/set-directory`, which patches the file with regex replacements.

### Key patterns

- **CSS Modules** for all component styles; design tokens are in `src/styles/tokens.css` (Apple HIG token set).
- **`src/types/story.ts`** is aliased as `wisp` in `vite.config.ts`, so story files can `import type { Meta, StoryObj } from 'wisp'` — matching Storybook's API.
- **`WispPortalContext`** (`src/core/CanvasContext.tsx`) provides a portal root inside the canvas so modal/overlay stories render within the canvas bounds rather than escaping to the viewport.
- App settings (theme, canvas background, sidebar width) are persisted to `localStorage` via `useSettings`.
- `src/core/virtual-stories-shim.ts` provides a TypeScript declaration for the `virtual:wisp-stories` module.

### Directory layout

```
src/
  core/        # Vite plugin, Canvas, StoryLoader, ControlsPanel, CodeViewer, DocsPanel
  shell/       # Layout, Sidebar, TopBar, SettingsPanel
  hooks/       # useStories, useSettings, useTheme, useDirectoryWatch
  components/  # Shared UI primitives (Toggle, SegmentedControl, Tooltip, StatusBadge)
  types/       # story.ts — CSF3 type definitions (exported as the 'wisp' package alias)
  stories/     # Built-in demo stories (Inputs, DataDisplay, Layout, Overlays)
  styles/      # tokens.css, globals.css
bin/wisp.js    # CLI entry point
wisp.config.ts # User-facing config (storiesDir, storiesGlob, aliases, port)
```
