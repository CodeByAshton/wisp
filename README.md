<div align="center">

<br />

# ◉ wisp

**The component explorer built by the design team at [Literal](https://github.com/CodeByAshton).**  
*A blazing-fast, local Storybook alternative that starts in under a second.*

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

## Built at Literal

wisp was created by the design team at **Literal** — a secure document management platform — to bridge the gap between design and engineering. As our component library grew, we needed a tool that could keep up with the pace of product development: instant feedback, no configuration overhead, and a UI that felt as polished as the product itself.

We open-sourced it because we think every design team deserves tooling this fast.

---

## What is wisp?

**wisp** is a local-first component explorer for React + TypeScript. It reads your existing `*.stories.tsx` files with **zero changes** and hot-reloads the moment a file is saved. Point it at any folder on your machine and you're running.

```bash
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
| Drop-in CSF3 support | **Yes** | Yes |

wisp is intentionally minimal. It's the tool you open 40 times a day, so it has to feel instant.

---

## Features

- **Component explorer** — hierarchical sidebar derived from your folder structure (`Inputs/Button.tsx` → `Inputs › Button`)
- **Live controls** — auto-generated from `argTypes` with text, boolean, select, number, range, and color inputs
- **Resizable frame** — drag to resize the canvas horizontally and vertically, with viewport presets
- **Element inspector** — click any element to inspect its box model, spacing, borders, and typography
- **Code view** — JSX usage snippet with syntax highlighting and copy-to-clipboard
- **Docs tab** — editable markdown docs per component
- **Hot reload** — chokidar watches the directory; new `.stories.tsx` files appear instantly
- **Fullscreen preview** — press `F` to expand any component to full viewport

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
import { defineConfig } from './src/config'

export default defineConfig({
  storiesDir: '../my-app/src/components',
  storiesGlob: '**/*.stories.tsx',
})
```

### Option 2 — CLI flag

```bash
npx wisp --dir ../my-app/src/components
npx wisp --dir /Users/you/projects/myapp/src/components --port 3000
```

### Option 3 — In-app settings

Click the **⚙** gear in the top-right corner, type a path in the **Component Directory** field, and hit **Apply**. wisp rewrites `wisp.config.ts` and reloads instantly.

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

Folder structure determines navigation — no nested `title` strings needed:

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
| `R` | Reset controls |
| `← →` | Previous / next variant |

---

## Tech stack

- **[Vite 5](https://vitejs.dev)** — dev server, HMR, virtual module plugin
- **[React 18](https://react.dev)** — UI
- **[TypeScript 5](https://www.typescriptlang.org)** — end-to-end types
- **[Lucide React](https://lucide.dev)** — icons
- **CSS Modules** — scoped styles, Apple HIG design tokens

---

## License

MIT © [Literal](https://github.com/CodeByAshton)
