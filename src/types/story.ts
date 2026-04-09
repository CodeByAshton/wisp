import type { ComponentType, ComponentPropsWithRef } from 'react'

// ─── ArgType ────────────────────────────────────────────────────────────────

export type ControlType =
  | 'text'
  | 'boolean'
  | 'select'
  | 'multi-select'
  | 'number'
  | 'range'
  | 'color'
  | 'date'
  | 'object'
  | 'radio'
  | 'inline-radio'
  | 'check'
  | 'inline-check'

export interface ArgType {
  control?: ControlType | { type: ControlType; min?: number; max?: number; step?: number }
  options?: string[] | number[]
  description?: string
  defaultValue?: unknown
  name?: string
  type?: { name: string; required?: boolean }
  table?: {
    type?: { summary?: string }
    defaultValue?: { summary?: string }
    category?: string
  }
}

// ─── Parameters ─────────────────────────────────────────────────────────────

export interface StoryParameters {
  docs?: string
  layout?: 'centered' | 'fullscreen' | 'padded'
  backgrounds?: { default?: string; values?: Array<{ name: string; value: string }> }
  viewport?: { defaultViewport?: string }
  [key: string]: unknown
}

// ─── Meta ────────────────────────────────────────────────────────────────────

export type Meta<T extends ComponentType<any> = ComponentType<any>> = {
  title: string
  component?: T
  parameters?: StoryParameters
  argTypes?: Partial<Record<keyof ComponentPropsWithRef<T>, ArgType>> & Record<string, ArgType>
  args?: Partial<ComponentPropsWithRef<T>>
  decorators?: Array<(Story: ComponentType) => JSX.Element>
  tags?: string[]
  excludeStories?: string | string[] | RegExp
  includeStories?: string | string[] | RegExp
}

// ─── StoryObj ────────────────────────────────────────────────────────────────

export type StoryObj<T extends ComponentType<any> = ComponentType<any>> = {
  name?: string
  args?: Partial<ComponentPropsWithRef<T>>
  argTypes?: Partial<Record<keyof ComponentPropsWithRef<T>, ArgType>> & Record<string, ArgType>
  parameters?: StoryParameters
  decorators?: Array<(Story: ComponentType) => JSX.Element>
  render?: (args: ComponentPropsWithRef<T>) => JSX.Element
  play?: (context: { canvasElement: HTMLElement }) => Promise<void>
  tags?: string[]
}

// ─── Resolved Story (internal) ──────────────────────────────────────────────

export interface ResolvedStory {
  id: string
  name: string
  componentName: string
  category: string
  meta: Meta<any>
  story: StoryObj<any>
  filePath?: string
}

export interface StoryGroup {
  id: string
  title: string
  components: StoryComponent[]
}

export interface StoryComponent {
  id: string
  name: string
  category: string
  stories: ResolvedStory[]
  meta: Meta<any>
  filePath?: string
}

// ─── Module shape ────────────────────────────────────────────────────────────

export interface StoryModule {
  default: Meta<any>
  [exportName: string]: StoryObj<any> | Meta<any>
}
