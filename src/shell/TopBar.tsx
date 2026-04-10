import { Monitor, Tablet, Smartphone, Settings, Maximize2 } from 'lucide-react'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { Tooltip } from '../components/ui/Tooltip'
import type { ResolvedStory } from '../hooks/useStories'
import type { Viewport } from '../hooks/useSettings'
import styles from './TopBar.module.css'

interface TopBarProps {
  selectedStory: ResolvedStory | undefined
  viewport: Viewport | undefined
  onViewportChange: (v: Viewport) => void
  onSettingsOpen: () => void
  onFullscreen: () => void
}

const VIEWPORT_SEGMENTS = [
  { value: 'mobile' as Viewport,  label: <Smartphone size={13} />, title: 'Mobile (390px)' },
  { value: 'tablet' as Viewport,  label: <Tablet size={13} />,     title: 'Tablet (768px)' },
  { value: 'desktop' as Viewport, label: <Monitor size={13} />,    title: 'Desktop (fill)' },
]

export function TopBar({
  selectedStory,
  viewport,
  onViewportChange,
  onSettingsOpen,
  onFullscreen,
}: TopBarProps) {
  const breadcrumb = selectedStory
    ? [selectedStory.category, selectedStory.componentName, selectedStory.name]
        .filter(Boolean)
        .join(' › ')
    : 'Select a component'

  return (
    <header className={`${styles.topBar} panel-frosted`}>
      {/* Wordmark */}
      <div className={styles.wordmark}>
        <span className={styles.accentDot} aria-hidden />
        <span className={styles.wordmarkText}>wisp</span>
      </div>

      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <span className={styles.breadcrumbText}>{breadcrumb}</span>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <SegmentedControl
          segments={VIEWPORT_SEGMENTS}
          value={viewport}
          onChange={onViewportChange}
          size="sm"
        />

        <div className={styles.separator} />

        <Tooltip content="Fullscreen (F)">
          <button className={styles.iconBtn} onClick={onFullscreen} aria-label="Fullscreen">
            <Maximize2 size={15} />
          </button>
        </Tooltip>

        <Tooltip content="Settings">
          <button className={styles.iconBtn} onClick={onSettingsOpen} aria-label="Open settings">
            <Settings size={15} />
          </button>
        </Tooltip>
      </div>
    </header>
  )
}
