import { useState, useEffect, useLayoutEffect, useRef, createElement } from 'react'
import { X } from 'lucide-react'
import type { ResolvedStory } from '../types/story'
import type { CanvasBackground, Viewport } from '../hooks/useSettings'
import { WispPortalContext } from './CanvasContext'
import styles from './Canvas.module.css'

// ─── StoryRenderer ────────────────────────────────────────────────────────────
//
// THIS IS THE CRITICAL FIX for stories that use hooks (useState, useEffect…)
// inside their render function — like the Modal stories.
//
// Problem: if Canvas calls storyObj.render(args) as a plain function, any hooks
// inside that render function execute as part of Canvas's render cycle.
// React tracks hooks by call-order per fiber. When you switch from a story
// without hooks (Button) to one with hooks (Modal's render has useState), the
// hook count changes and React silently fails the render → blank black card.
//
// Fix: StoryRenderer is a real React function component defined at module scope.
// When Canvas renders <StoryRenderer story={s} args={a} />, React gives it its
// own fiber. Hooks inside storyObj.render execute in StoryRenderer's fiber —
// totally valid. key={story.id} on the componentCard above ensures StoryRenderer
// unmounts+remounts when the story changes, so hook order never diverges.

interface StoryRendererProps {
  story: ResolvedStory
  args: Record<string, unknown>
}

function StoryRenderer({ story, args }: StoryRendererProps) {
  const { meta, story: storyObj } = story
  const mergedArgs = { ...meta.args, ...storyObj.args, ...args }
  const allDecorators = [...(storyObj.decorators ?? []), ...(meta.decorators ?? [])]

  // Build the base element
  let element: React.ReactNode

  if (storyObj.render) {
    // render() may contain hooks — safe here because this IS a React component
    element = storyObj.render(mergedArgs as any)
  } else if (meta.component) {
    element = createElement(meta.component, mergedArgs as any)
  } else {
    element = <p style={{ color: 'var(--color-label-tertiary)', fontSize: 13 }}>No component defined</p>
  }

  // Apply decorators (inner-first)
  for (const decorator of allDecorators) {
    const Inner = () => element as React.ReactElement
    element = decorator(Inner)
  }

  return <>{element}</>
}

// ─── Canvas ───────────────────────────────────────────────────────────────────

interface CanvasProps {
  story: ResolvedStory | undefined
  args: Record<string, unknown>
  background: CanvasBackground
  viewport: Viewport
  isFullscreen: boolean
  onFullscreenChange: (v: boolean) => void
}

const VIEWPORT_WIDTHS: Record<Viewport, string> = {
  mobile:  '390px',
  tablet:  '768px',
  desktop: '100%',
}

function getCanvasBgClass(bg: CanvasBackground): string {
  switch (bg) {
    case 'checkered': return 'canvas-checkered'
    case 'subtle':    return styles.bgSubtle
    case 'dark':      return styles.bgDark
    default:          return styles.bgWhite
  }
}

export function Canvas({ story, args, background, viewport, isFullscreen, onFullscreenChange }: CanvasProps) {
  const [mounted, setMounted] = useState(false)
  const [storyKey, setStoryKey] = useState(0)
  const prevStoryId = useRef<string>()

  // Portal root: sits inside canvasWrapper (full canvas area).
  // CSS transform:translateZ(0) makes it the containing block for any
  // position:fixed child — modal overlays stay inside the canvas.
  const portalRootRef = useRef<HTMLDivElement>(null)
  const [portalRoot, setPortalRoot] = useState<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    setPortalRoot(portalRootRef.current)
  }, [])

  // Fade on story switch
  useEffect(() => {
    if (story?.id !== prevStoryId.current) {
      prevStoryId.current = story?.id
      setMounted(false)
      const t = setTimeout(() => setMounted(true), 20)
      return () => clearTimeout(t)
    }
  }, [story?.id])

  useEffect(() => { setMounted(true) }, [])

  // Increment key only on story change — not on args edits — so the StoryRenderer
  // remounts (fresh hook state) for each new story but stays alive for control tweaks.
  useEffect(() => {
    setStoryKey(k => k + 1)
  }, [story?.id])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) { onFullscreenChange(false); return }
      if (
        e.key === 'f' && !e.metaKey && !e.ctrlKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        onFullscreenChange(!isFullscreen)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isFullscreen, onFullscreenChange])

  const canvasContent = (
    <div
      className={[
        styles.canvasWrapper,
        getCanvasBgClass(background),
        isFullscreen ? styles.fullscreen : '',
        'canvas-dotgrid',
      ].join(' ')}
    >
      {/* Portal root — story overlays render here via createPortal.
          transform:translateZ(0) is the key: it makes position:fixed children
          relative to this element instead of the viewport. */}
      <div ref={portalRootRef} className={styles.portalRoot} />

      {isFullscreen && (
        <button
          className={styles.exitFullscreen}
          onClick={() => onFullscreenChange(false)}
          aria-label="Exit fullscreen"
        >
          <X size={16} />
          <span>Exit fullscreen</span>
        </button>
      )}

      <div className={styles.viewportFrame} style={{ width: VIEWPORT_WIDTHS[viewport] }}>
        <WispPortalContext.Provider value={portalRoot}>
          <div
            key={storyKey}
            className={`${styles.componentCard} ${mounted ? styles.visible : ''}`}
          >
            {story ? (
              <StoryRenderer story={story} args={args} />
            ) : (
              <div className={styles.emptyCanvas}>
                <div className={styles.emptyDot} />
                <p className={styles.emptyTitle}>Select a component</p>
                <p className={styles.emptySubtitle}>
                  Choose a story from the sidebar to preview it here
                </p>
              </div>
            )}
          </div>
        </WispPortalContext.Provider>
      </div>
    </div>
  )

  if (isFullscreen) {
    return (
      <div
        className={styles.fullscreenBackdrop}
        onClick={e => { if (e.target === e.currentTarget) onFullscreenChange(false) }}
      >
        {canvasContent}
      </div>
    )
  }

  return canvasContent
}
