import { useEffect, useState } from 'react'
import type { StoryModule, StoryGroup, StoryComponent, ResolvedStory, Meta } from '../types/story'
import virtualStoriesDefault from 'virtual:wisp-stories'

// ─── File path → hierarchy ────────────────────────────────────────────────────

/**
 * Find the longest common directory prefix shared by all file paths.
 * Used to strip the "stories root" from individual paths so we only see
 * the meaningful subdirectory structure.
 */
function commonDirPrefix(paths: string[]): string {
  if (paths.length === 0) return ''
  const normalized = paths.map(p => p.replace(/\\/g, '/'))
  // Work with directory parts only (exclude filenames)
  const dirParts = normalized.map(p => p.split('/').slice(0, -1))
  const first = dirParts[0]
  let depth = 0
  for (let i = 0; i < first.length; i++) {
    if (dirParts.every(parts => parts[i] === first[i])) depth = i + 1
    else break
  }
  const prefix = first.slice(0, depth).join('/')
  return prefix ? prefix + '/' : ''
}

/**
 * Convert a camelCase or PascalCase string to Title Case with spaces.
 * "DataDisplay" → "Data Display", "myComponent" → "My Component"
 */
function toTitleCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, c => c.toUpperCase())
    .replace(/-([a-z])/g, (_, c) => ' ' + c.toUpperCase())
    .replace(/_([a-z])/g, (_, c) => ' ' + c.toUpperCase())
    .trim()
}

/**
 * Given a filePath and the common prefix, return { category, componentName }.
 *
 * Examples (prefix = "src/stories/"):
 *   "src/stories/Inputs/Button.stories.tsx"     → { "Inputs", "Button" }
 *   "src/stories/DataDisplay/Badge.stories.tsx"  → { "Data Display", "Badge" }
 *   "src/stories/Button.stories.tsx"             → { "Components", "Button" }
 */
function filePathToHierarchy(
  filePath: string,
  prefix: string
): { category: string; componentName: string } {
  const normalized = filePath.replace(/\\/g, '/')
  const relative   = normalized.startsWith(prefix) ? normalized.slice(prefix.length) : normalized
  const parts      = relative.split('/')
  const filename   = parts[parts.length - 1]

  // Strip .stories.tsx / .stories.ts / .stories.jsx / .stories.js
  const componentName = toTitleCase(
    filename.replace(/\.stories\.(tsx?|jsx?)$/, '')
  )

  const dirParts = parts.slice(0, -1)
  if (dirParts.length === 0) {
    return { category: 'Components', componentName }
  }

  // Join all directory segments, title-casing each
  const category = dirParts.map(toTitleCase).join(' / ')
  return { category, componentName }
}

// ─── Parsing ──────────────────────────────────────────────────────────────────

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function isStoryExport(key: string, value: unknown, meta: Meta<any>): boolean {
  if (key === 'default') return false
  if (typeof value !== 'object' || value === null) return false

  if (meta.excludeStories) {
    if (Array.isArray(meta.excludeStories) && meta.excludeStories.includes(key)) return false
    if (meta.excludeStories instanceof RegExp && meta.excludeStories.test(key)) return false
    if (typeof meta.excludeStories === 'string' && key === meta.excludeStories) return false
  }
  if (meta.includeStories) {
    if (Array.isArray(meta.includeStories) && !meta.includeStories.includes(key)) return false
    if (meta.includeStories instanceof RegExp && !meta.includeStories.test(key)) return false
  }
  return true
}

function storyDisplayName(exportKey: string, story: any): string {
  if (story.name) return story.name
  return exportKey.replace(/([A-Z])/g, ' $1').trim()
}

export function parseStoryModules(
  modules: Array<{ module: StoryModule; filePath: string }>
): StoryGroup[] {
  if (modules.length === 0) return []

  // Compute the common directory prefix so we only see meaningful path structure
  const prefix = commonDirPrefix(modules.map(m => m.filePath))

  const categoryMap = new Map<string, Map<string, StoryComponent>>()

  for (const { module, filePath } of modules) {
    const meta = module.default
    if (!meta) continue

    // Derive hierarchy from file path — this is the source of truth.
    // meta.title is only used as a display-name override for the component
    // when it contains no "/" (i.e. just a plain name like "Button").
    const { category, componentName: pathComponentName } = filePathToHierarchy(filePath, prefix)

    // Component display name: prefer meta.title if it's a simple name (no slash)
    let componentName = pathComponentName
    if (meta.title) {
      if (!meta.title.includes('/')) {
        componentName = meta.title  // simple override, e.g. "Button"
      }
      // If meta.title contains "/" (old Storybook convention like "Inputs/Button"),
      // we ignore it in favour of the file path structure.
    }

    const componentId = slugify(`${category}/${componentName}`)

    const stories: ResolvedStory[] = []
    for (const [exportKey, exportValue] of Object.entries(module)) {
      if (!isStoryExport(exportKey, exportValue, meta)) continue
      const story    = exportValue as any
      const storyId  = `${componentId}--${slugify(exportKey)}`
      stories.push({
        id: storyId,
        name: storyDisplayName(exportKey, story),
        componentName,
        category,
        meta,
        story,
        filePath,
      })
    }

    if (stories.length === 0) continue

    if (!categoryMap.has(category)) categoryMap.set(category, new Map())
    categoryMap.get(category)!.set(componentId, {
      id: componentId,
      name: componentName,
      category,
      stories,
      meta,
      filePath,
    })
  }

  return Array.from(categoryMap.entries())
    .map(([title, compMap]) => ({
      id: slugify(title),
      title,
      components: Array.from(compMap.values()),
    }))
    .sort((a, b) => a.title.localeCompare(b.title))
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStoryModules() {
  const [modules, setModules] = useState<Array<{ module: StoryModule; filePath: string }>>(
    () => virtualStoriesDefault ?? []
  )
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !import.meta.hot) return

    const handler = async () => {
      setLoading(true)
      try {
        const mod = await import(/* @vite-ignore */ `virtual:wisp-stories?t=${Date.now()}`)
        setModules(mod.default ?? [])
      } catch {
        // keep existing on error
      } finally {
        setLoading(false)
      }
    }

    import.meta.hot.on('wisp:stories-changed', handler)
    import.meta.hot.accept(() => { setModules(virtualStoriesDefault ?? []) })

    return () => { import.meta.hot?.off('wisp:stories-changed', handler) }
  }, [])

  return { modules, loading }
}

export { virtualStoriesDefault as initialStoryModules }
