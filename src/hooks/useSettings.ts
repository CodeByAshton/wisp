import { useState, useCallback, useEffect } from 'react'
import type { Theme } from './useTheme'

export type CanvasBackground = 'subtle' | 'checkered' | 'dark'
export type Viewport = 'mobile' | 'tablet' | 'desktop'

export interface WispSettings {
  theme: Theme
  canvasBackground: CanvasBackground
  cardBackground: string   // hex color or 'transparent'
  sidebarWidth: number
  storiesDir: string
  storiesGlob: string
  aliases: Array<{ key: string; value: string }>
  watchIncludeNodeModules: boolean
  watchDebounce: number
}

const DEFAULTS: WispSettings = {
  theme: 'system',
  canvasBackground: 'subtle',
  cardBackground: '#222222',
  sidebarWidth: 240,
  storiesDir: './src/stories',
  storiesGlob: '**/*.stories.tsx',
  aliases: [],
  watchIncludeNodeModules: false,
  watchDebounce: 150,
}

const STORAGE_KEY = 'wisp-settings'

function load(): WispSettings {
  if (typeof window === 'undefined') return DEFAULTS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return DEFAULTS
  }
}

function save(settings: WispSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export function useSettings() {
  const [settings, setSettingsState] = useState<WispSettings>(load)

  const setSettings = useCallback((patch: Partial<WispSettings>) => {
    setSettingsState(prev => {
      const next = { ...prev, ...patch }
      save(next)
      return next
    })
  }, [])

  // Sync storiesDir from server on mount
  useEffect(() => {
    fetch('/wisp-api/status')
      .then(r => r.json())
      .then((data: { storiesDir: string; storiesGlob: string; aliases: Record<string, string> }) => {
        const aliases = Object.entries(data.aliases ?? {}).map(([key, value]) => ({ key, value }))
        setSettings({
          storiesDir: data.storiesDir,
          storiesGlob: data.storiesGlob,
          aliases: aliases.length > 0 ? aliases : settings.aliases,
        })
      })
      .catch(() => {
        // Server not available — use localStorage values
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { settings, setSettings }
}
