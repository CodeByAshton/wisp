import { useState, useEffect, useLayoutEffect, useRef, useCallback, createElement } from 'react'
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
  cardBackground: string
  viewport: Viewport
  isFullscreen: boolean
  onFullscreenChange: (v: boolean) => void
  onCanvasEl?: (el: HTMLElement | null) => void
  picking?: boolean
  onElementPick?: (el: HTMLElement) => void
  onCustomSizeChange?: (hasCustom: boolean) => void
  sizeResetKey?: number
}

const VIEWPORT_WIDTHS: Record<Viewport, string> = {
  mobile:  '390px',
  tablet:  '768px',
  desktop: '100%',
}

function getCanvasBgClass(bg: CanvasBackground): string {
  switch (bg) {
    case 'checkered': return 'canvas-checkered'
    case 'dark':      return styles.bgDark
    default:          return styles.bgSubtle
  }
}

interface Rect { left: number; top: number; width: number; height: number }

export function Canvas({ story, args, background, cardBackground, viewport, isFullscreen, onFullscreenChange, onCanvasEl, picking, onElementPick, onCustomSizeChange, sizeResetKey }: CanvasProps) {
  const [mounted, setMounted] = useState(false)
  const [storyKey, setStoryKey] = useState(0)
  const prevStoryId = useRef<string>()
  const cardRef = useRef<HTMLDivElement>(null)
  const pickerOverlayRef = useRef<HTMLDivElement>(null)
  const [pickerHighlight, setPickerHighlight] = useState<Rect | null>(null)
  const resizeContainerRef = useRef<HTMLDivElement>(null)
  const widthBadgeRef = useRef<HTMLDivElement>(null)
  const [customWidth, setCustomWidth] = useState<number | null>(null)
  const [customHeight, setCustomHeight] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragState = useRef<{
    side: 'left' | 'right' | 'bottom'
    startX: number; startY: number
    startWidth: number; startHeight: number
    lastWidth: number | null; lastHeight: number | null
  } | null>(null)

  // Reset custom sizes whenever a viewport preset is clicked (even same preset).
  // State-only — React handles the DOM width/height via the style prop on re-render.
  useEffect(() => {
    if (sizeResetKey === undefined) return
    setCustomWidth(null)
    setCustomHeight(null)
  }, [sizeResetKey])

  // Notify parent whether a custom size overrides the preset
  useEffect(() => {
    onCustomSizeChange?.(customWidth !== null || customHeight !== null)
  }, [customWidth, customHeight, onCustomSizeChange])

  // Sync badge text from state (badge div has no JSX children — React must not own that text node)
  useEffect(() => {
    if (!widthBadgeRef.current) return
    const parts = [customWidth, customHeight].filter(Boolean)
    widthBadgeRef.current.textContent = parts.length ? `${parts.join(' × ')}px` : ''
  }, [customWidth, customHeight])

  const startResize = useCallback((e: React.MouseEvent, side: 'left' | 'right' | 'bottom') => {
    e.preventDefault()
    const container = resizeContainerRef.current
    const card = cardRef.current

    dragState.current = {
      side,
      startX: e.clientX, startY: e.clientY,
      startWidth: container?.offsetWidth ?? 800,
      startHeight: card?.offsetHeight ?? 400,
      lastWidth: null, lastHeight: null,
    }

    // Disable transition immediately (synchronous — no effect delay)
    if (container) container.style.transition = 'none'
    setIsDragging(true)

    const onMove = (ev: globalThis.MouseEvent) => {
      const d = dragState.current
      if (!d) return
      if (d.side === 'bottom') {
        const next = Math.max(100, Math.min(2000, d.startHeight + (ev.clientY - d.startY)))
        d.lastHeight = next
        if (card) { card.style.height = `${next}px`; card.style.overflow = 'auto' }
        if (widthBadgeRef.current) widthBadgeRef.current.textContent = `${next}px`
      } else {
        const delta = ev.clientX - d.startX
        const next = d.side === 'right'
          ? Math.max(200, Math.min(1800, d.startWidth + delta))
          : Math.max(200, Math.min(1800, d.startWidth - delta))
        d.lastWidth = next
        if (container) container.style.width = `${next}px`
        if (widthBadgeRef.current) widthBadgeRef.current.textContent = `${next}px`
      }
    }

    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      const d = dragState.current
      dragState.current = null
      if (container) container.style.transition = ''
      setIsDragging(false)
      if (d?.lastWidth !== null && d?.lastWidth !== undefined) setCustomWidth(d.lastWidth)
      if (d?.lastHeight !== null && d?.lastHeight !== undefined) setCustomHeight(d.lastHeight)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Element picker helpers
  const getElementAtPoint = useCallback((x: number, y: number): HTMLElement | null => {
    const overlay = pickerOverlayRef.current
    const card = cardRef.current
    if (!card) return null
    const elements = document.elementsFromPoint(x, y)
    for (const el of elements) {
      if (el === overlay) continue
      if (card.contains(el) && el !== card) return el as HTMLElement
    }
    return card
  }, [])

  const handlePickerMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = getElementAtPoint(e.clientX, e.clientY)
    if (!el || !cardRef.current) { setPickerHighlight(null); return }
    const cardRect = cardRef.current.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    setPickerHighlight({ left: r.left - cardRect.left, top: r.top - cardRect.top, width: r.width, height: r.height })
  }, [getElementAtPoint])

  const handlePickerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = getElementAtPoint(e.clientX, e.clientY)
    if (el) onElementPick?.(el)
    setPickerHighlight(null)
  }, [getElementAtPoint, onElementPick])

  // Clear highlight when picker exits
  useEffect(() => {
    if (!picking) setPickerHighlight(null)
  }, [picking])

  // Expose the rendered component's root element for the Inspect panel.
  // Uses rAF so the browser has committed & painted before we read the DOM.
  const notifyCanvasEl = useCallback(() => {
    const frame = requestAnimationFrame(() => {
      const child = cardRef.current?.firstElementChild as HTMLElement | null
      onCanvasEl?.(child ?? cardRef.current ?? null)
    })
    return frame
  }, [onCanvasEl])

  useEffect(() => {
    const frame = notifyCanvasEl()
    return () => cancelAnimationFrame(frame)
  }, [storyKey, notifyCanvasEl])

  // Clear on unmount
  useEffect(() => {
    return () => { onCanvasEl?.(null) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

      <div
        ref={resizeContainerRef}
        className={`${styles.resizeContainer} ${isDragging ? styles.dragging : ''}`}
        style={{ width: customWidth ? `${customWidth}px` : VIEWPORT_WIDTHS[viewport] }}
      >
        {/* Left drag handle */}
        <div
          className={`${styles.resizeHandle} ${styles.resizeHandleLeft}`}
          onMouseDown={e => startResize(e, 'left')}
        >
          <span className={styles.resizeBar} />
        </div>

        {/* Right drag handle */}
        <div
          className={`${styles.resizeHandle} ${styles.resizeHandleRight}`}
          onMouseDown={e => startResize(e, 'right')}
        >
          <span className={styles.resizeBar} />
        </div>

        {/* Bottom drag handle */}
        <div
          className={`${styles.resizeHandle} ${styles.resizeHandleBottom}`}
          onMouseDown={e => startResize(e, 'bottom')}
        >
          <span className={styles.resizeBarH} />
        </div>

        {/* Dimension badge — text is written via DOM (widthBadgeRef.current.textContent)
            so React never owns a text node here — prevents insertBefore desync crash */}
        {(isDragging || customWidth !== null || customHeight !== null) && (
          <div ref={widthBadgeRef} className={styles.widthBadge} />
        )}

        <WispPortalContext.Provider value={portalRoot}>
          <div style={{ position: 'relative', width: '100%' }}>
            <div
              key={storyKey}
              ref={cardRef}
              className={`${styles.componentCard} ${mounted ? styles.visible : ''}`}
              style={{
                background: cardBackground,
                ...(customHeight ? { height: `${customHeight}px`, overflow: 'auto' } : {}),
              }}
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

            {/* Element picker overlay — rendered over card when inspect picking is active */}
            {picking && (
              <>
                <div
                  ref={pickerOverlayRef}
                  className={styles.pickerOverlay}
                  onMouseMove={handlePickerMove}
                  onClick={handlePickerClick}
                  onMouseLeave={() => setPickerHighlight(null)}
                />
                {pickerHighlight && (
                  <div
                    className={styles.pickerHighlight}
                    style={{
                      left: pickerHighlight.left,
                      top: pickerHighlight.top,
                      width: pickerHighlight.width,
                      height: pickerHighlight.height,
                    }}
                  />
                )}
              </>
            )}
          </div>
        </WispPortalContext.Provider>
      </div>   {/* resizeContainer */}
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
