<div align="center">

<br />

# ◉ wisp

**A blazing-fast, local component explorer for React + TypeScript.**  
*The Storybook alternative that starts in under a second and gets out of your way.*

<br />

[![Built with Vite](https://img.shields.io/badge/built%20with-vite-%23646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![React 18](https://img.shields.io/badge/react-18-%2361DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/typescript-5-%233178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License MIT](https://img.shields.io/badge/license-MIT-green?style=flat-square)](./LICENSE)

<br />

![wisp screenshot](https://placehold.co/900x520/0a0a0f/007AFF?text=wisp+preview&font=monospace)

<br />

</div>

---

## What is wisp?

**wisp** is a local-first component explorer designed for **design handoff** — the moment when a designer or PM needs to understand, interact with, and inspect a React component before it goes to a developer.

It reads your existing `*.stories.tsx` files with **zero changes**. Point it at any folder on your machine, and it hot-reloads the moment a story is saved in your editor.

```bash
# Use your existing stories instantly
npx wisp --dir ../my-app/src/components
```

---

## Why wisp instead of Storybook?

| | wisp | Storybook |
|---|---|---|
| Cold start | **< 500ms** | 10–30s |
| Config needed | **None** | `main.ts`, addons, builders |
| Watch any directory | **Yes** | Tied to its own build |
| Bundle size | **~200KB** | 2MB+ |
| Zero-dependency stories | **Yes** | Yes |
| Drop-in CSF3 support | **Yes** | Yes |

wisp is intentionally smaller and faster. It's the tool you open 40 times a day, so it has to feel instant.

---

## Features

- **Component explorer** — hierarchical sidebar derived from your folder structure (`Inputs/Button.tsx` → `Inputs › Button`)
- **Live controls** — auto-generated from `argTypes` with text, boolean, select, number, range, and color inputs
- **Code view** — JSX usage snippet with syntax highlighting and copy-to-clipboard
- **Docs tab** — renders `parameters.docs` markdown inline
- **Hot reload** — chokidar watches the external directory; new `.stories.tsx` files appear instantly
- **Dark mode** — full Apple HIG token set, light/dark/system
- **Fullscreen preview** — press `F` to expand any component to full viewport
- **Configurable** — `wisp.config.ts`, in-app settings panel, or CLI flags

---

## Getting started

```bash
git clone https://github.com/CodeByAshton/wisp
cd wisp
npm install
npm run dev
```

Opens at `http://localhost:5174` with the built-in demo stories.

---

## Pointing at your own project

### Option 1 — Edit `wisp.config.ts`

```ts
// wisp.config.ts
import { defineConfig } from './src/config'

export default defineConfig({
  storiesDir: '../my-app/src/components',
  storiesGlob: '**/*.stories.tsx',
})
```

### Option 2 — CLI flag

```bash
npx wisp --dir ../my-app/src/components
npx wisp --dir /Users/ashton/projects/myapp/src/components --port 3000
```

### Option 3 — In-app settings

Click the **⚙** gear in the top-right corner, type a path in the **Component Directory** field, hit **Apply**. wisp rewrites `wisp.config.ts` and reloads instantly.

---

## Story format

wisp uses **CSF3** — the same format as Storybook. Existing story files work with zero changes.

```tsx
// Button.stories.tsx
import type { Meta, StoryObj } from 'wisp'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'Button',
  component: Button,
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'destructive'],
    },
    label:    { control: 'text' },
    disabled: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Primary:     Story = { args: { variant: 'primary',     label: 'Continue' } }
export const Destructive: Story = { args: { variant: 'destructive', label: 'Delete'   } }
```

The folder structure determines navigation — no need for nested `title` strings:

```
src/components/
  Inputs/
    Button.stories.tsx      →  Inputs › Button
    InputField.stories.tsx  →  Inputs › Input Field
  DataDisplay/
    Badge.stories.tsx       →  Data Display › Badge
  Overlays/
    Modal.stories.tsx       →  Overlays › Modal
```

---

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `⌘K` | Focus search |
| `F` | Toggle fullscreen |
| `D` | Toggle dark mode |
| `R` | Reset controls |
| `← →` | Previous / next variant |

---

## Project structure

```
wisp/
├── bin/wisp.js              # CLI entry point
├── wisp.config.ts           # User-facing config
├── vite.config.ts
└── src/
    ├── core/
    │   ├── wisp-plugin.ts   # Vite plugin: virtual module + file watcher + API
    │   ├── Canvas.tsx        # Isolated story renderer
    │   ├── ControlsPanel.tsx # Auto-generated arg controls
    │   ├── CodeViewer.tsx    # JSX snippet + syntax highlight
    │   └── DocsPanel.tsx     # Markdown docs renderer
    ├── shell/
    │   ├── Sidebar.tsx       # Hierarchical nav tree
    │   ├── TopBar.tsx        # Wordmark + breadcrumb + controls
    │   └── SettingsPanel.tsx # Directory config + appearance
    ├── stories/              # Built-in demo stories
    │   ├── Inputs/           Button, InputField
    │   ├── DataDisplay/      Badge, Avatar
    │   ├── Layout/           Card
    │   └── Overlays/         Modal
    └── styles/
        ├── tokens.css        # Full Apple HIG token set
        └── globals.css
```

---

## Configuration reference

```ts
// wisp.config.ts
import { defineConfig } from './src/config'

export default defineConfig({
  // Path to your component stories (absolute or relative)
  storiesDir: '../my-app/src/components',

  // Glob pattern within that dir
  storiesGlob: '**/*.stories.tsx',

  // Extra dirs to watch (shared types, utils…)
  watchDirs: ['../my-app/src/types'],

  // tsconfig-style path aliases
  aliases: {
    '@': '../my-app/src',
    '@components': '../my-app/src/components',
  },

  // Dev server port (default: 5174)
  port: 5174,
})
```

---

## CLI reference

```
wisp [options]

  -d, --dir <path>    Path to stories directory
  -g, --glob <glob>   Glob pattern (default: **/*.stories.tsx)
  -p, --port <port>   Dev server port (default: 5174)
  -h, --help          Show help
```

---

## Tech stack

- **[Vite 5](https://vitejs.dev)** — dev server, HMR, virtual module plugin
- **[React 18](https://react.dev)** — UI
- **[TypeScript 5](https://www.typescriptlang.org)** — end-to-end types
- **[Lucide React](https://lucide.dev)** — icons
- **CSS Modules** — scoped styles, Apple HIG tokens

---

## License

MIT © [CodeByAshton](https://github.com/CodeByAshton)
