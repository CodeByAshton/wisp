import { useState, useCallback, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { SettingsPanel } from './SettingsPanel'
import { Canvas } from '../core/Canvas'
import { ControlsPanel } from '../core/ControlsPanel'
import { CodeViewer } from '../core/CodeViewer'
import { DocsPanel } from '../core/DocsPanel'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { useStories } from '../hooks/useStories'
import { useSettings } from '../hooks/useSettings'
import { useTheme } from '../hooks/useTheme'
import { useDirectoryWatch } from '../hooks/useDirectoryWatch'
import type { ResolvedStory } from '../types/story'
import type { Viewport } from '../hooks/useSettings'
import styles from './Layout.module.css'

type TabId = 'preview' | 'code' | 'docs'

const TAB_SEGMENTS = [
  { value: 'preview' as TabId, label: 'Preview' },
  { value: 'code' as TabId,    label: 'Code' },
  { value: 'docs' as TabId,    label: 'Docs' },
]

export function Layout() {
  const { groups, allStories, totalFiles, totalVariants, getFirstStory, getAdjacentStory } = useStories()
  const { settings, setSettings } = useSettings()
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme()
  const watchInfo = useDirectoryWatch(totalVariants)

  const [selectedStory, setSelectedStory] = useState<ResolvedStory | undefined>(undefined)
  const [args, setArgs] = useState<Record<string, unknown>>({})
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const [tab, setTab] = useState<TabId>('preview')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(settings.sidebarWidth)

  // Select first story on load
  useEffect(() => {
    if (!selectedStory && allStories.length > 0) {
      const first = getFirstStory()
      if (first) selectStory(first)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allStories.length])

  function selectStory(story: ResolvedStory) {
    setSelectedStory(story)
    // Reset args to story defaults
    const defaultArgs = { ...story.meta.args, ...story.story.args }
    setArgs(defaultArgs as Record<string, unknown>)
  }

  const resetArgs = useCallback(() => {
    if (!selectedStory) return
    const defaultArgs = { ...selectedStory.meta.args, ...selectedStory.story.args }
    setArgs(defaultArgs as Record<string, unknown>)
  }, [selectedStory])

  // Sync theme with settings
  useEffect(() => {
    if (settings.theme !== theme) {
      setTheme(settings.theme)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.theme])

  // Sync sidebar width with settings
  useEffect(() => {
    setSidebarWidth(settings.sidebarWidth)
  }, [settings.sidebarWidth])

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch (e.key) {
        case 'r': case 'R':
          if (!e.metaKey) { e.preventDefault(); resetArgs() }
          break
        case 'c': case 'C':
          if (!e.metaKey) {
            e.preventDefault()
            // Trigger copy from controls panel
          }
          break
        case 'd': case 'D':
          if (!e.metaKey) { e.preventDefault(); toggleTheme() }
          break
        case 'ArrowLeft':
          if (!e.metaKey) {
            e.preventDefault()
            const prev = selectedStory ? getAdjacentStory(selectedStory.id, 'prev') : undefined
            if (prev) selectStory(prev)
          }
          break
        case 'ArrowRight':
          if (!e.metaKey) {
            e.preventDefault()
            const next = selectedStory ? getAdjacentStory(selectedStory.id, 'next') : undefined
            if (next) selectStory(next)
          }
          break
        case '?':
          e.preventDefault()
          // Show keyboard shortcuts
          break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedStory, resetArgs, toggleTheme, getAdjacentStory])

  return (
    <div className={styles.root}>
      <TopBar
        selectedStory={selectedStory}
        viewport={viewport}
        onViewportChange={setViewport}
        theme={theme}
        resolvedTheme={resolvedTheme}
        onThemeToggle={toggleTheme}
        onSettingsOpen={() => setSettingsOpen(true)}
        onFullscreen={() => setFullscreen(true)}
      />

      <div className={styles.body}>
        <Sidebar
          groups={groups}
          selectedStoryId={selectedStory?.id}
          onSelectStory={selectStory}
          width={sidebarWidth}
          onWidthChange={w => {
            setSidebarWidth(w)
            setSettings({ sidebarWidth: w })
          }}
          watchStatus={watchInfo.status}
          storyCount={totalFiles}
          variantCount={totalVariants}
          resolvedDir={watchInfo.resolvedDir}
        />

        <main className={styles.main}>
          {/* Tab bar */}
          <div className={styles.tabBar}>
            <SegmentedControl
              segments={TAB_SEGMENTS}
              value={tab}
              onChange={setTab}
              size="sm"
            />
          </div>

          <div className={styles.content}>
            {tab === 'preview' && (
              <>
                <Canvas
                  story={selectedStory}
                  args={args}
                  background={settings.canvasBackground}
                  viewport={viewport}
                  isFullscreen={fullscreen}
                  onFullscreenChange={setFullscreen}
                />
                <ControlsPanel
                  story={selectedStory}
                  args={args}
                  onArgsChange={setArgs}
                  onReset={resetArgs}
                />
              </>
            )}

            {tab === 'code' && (
              <div className={styles.codeWrapper}>
                <CodeViewer story={selectedStory} args={args} />
              </div>
            )}

            {tab === 'docs' && (
              <div className={styles.docsWrapper}>
                <DocsPanel story={selectedStory} />
              </div>
            )}
          </div>
        </main>
      </div>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={{ ...settings, theme }}
        onSettingsChange={patch => {
          setSettings(patch)
          if (patch.theme) setTheme(patch.theme)
        }}
        watchStatus={watchInfo.status}
        storyCount={totalFiles}
        variantCount={totalVariants}
        resolvedDir={watchInfo.resolvedDir}
        onRefreshStatus={watchInfo.refresh}
      />
    </div>
  )
}
