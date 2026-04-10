<div align="center">

<br />

# ◉ wisp

**The component explorer built by the design team at [literal](https://x.com/literalhq).**  
*Built for teams using AI to write frontend code.*

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

## Why we built this

AI writes a lot of our frontend code. That's fast — until you need to actually see what was generated, inspect its layout, tweak a prop, or check how it behaves at different sizes. The feedback loop between AI output and visual confirmation matters.

The tools that existed were too slow. A component explorer that takes 30 seconds to start doesn't fit inside an AI-assisted workflow. We needed something that opened instantly, showed the component exactly as it renders, and got out of the way.

So the design team at **[literal](https://x.com/literalhq)** built wisp for ourselves. We're open-sourcing it because the workflow is universal — if you're using AI to build UI, you have the same problem.

---

## What it does

wisp is a local component explorer for React + TypeScript. Point it at a folder of `*.stories.tsx` files and it runs — no build config, no plugin ecosystem. Files hot-reload the moment they're saved, which means the loop between AI generating a component and you seeing it is as short as it can be.

```bash
npx wisp --dir ../my-app/src/components
```

Inspired by Storybook's CSF3 story format — existing story files work without changes.

---

## Features

- **Component preview** — hierarchical sidebar built from your folder structure
- **Live controls** — auto-generated from `argTypes`: text, boolean, select, number, range, color
- **Resizable canvas** — drag the frame edges to test responsive behavior; viewport presets for mobile, tablet, and desktop
- **Element inspector** — click any element to read its box model, spacing, borders, and typography directly from the DOM
- **Code view** — JSX usage snippet with syntax highlighting and one-click copy
- **Docs** — editable markdown documentation per component, rendered inline
- **Hot reload** — new `.stories.tsx` files appear the moment they're saved
- **Fullscreen** — press `F` to expand any component to full viewport

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

**Edit `wisp.config.ts`:**

```ts
import { defineConfig } from './src/config'

export default defineConfig({
  storiesDir: '../my-app/src/components',
  storiesGlob: '**/*.stories.tsx',
})
```

**Or use the CLI:**

```bash
npx wisp --dir ../my-app/src/components --port 3000
```

**Or use the settings panel** — click the gear icon, enter a path, hit Apply. wisp rewrites the config and reloads.

---

## Story format

```tsx
// Button.stories.tsx
import type { Meta, StoryObj } from 'wisp'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  component: Button,
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost'] },
    label:   { control: 'text' },
    disabled:{ control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Primary:   Story = { args: { variant: 'primary',   label: 'Continue' } }
export const Secondary: Story = { args: { variant: 'secondary', label: 'Cancel'   } }
```

Folder structure determines sidebar navigation — no `title` strings needed:

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

MIT © [literal](https://x.com/literalhq)
