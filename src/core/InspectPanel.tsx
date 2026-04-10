import { useState, useEffect } from 'react'
import styles from './InspectPanel.module.css'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rgbToHex(rgb: string): string {
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!m) return rgb
  return '#' + [m[1], m[2], m[3]].map(n => parseInt(n).toString(16).padStart(2, '0')).join('')
}

function trimPx(v: string): string {
  const n = parseFloat(v)
  return isNaN(n) ? v : n === 0 ? '0' : v
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useInspectData(el: HTMLElement | null) {
  const [, tick] = useState(0)

  useEffect(() => {
    if (!el) return
    const ro = new ResizeObserver(() => tick(n => n + 1))
    ro.observe(el)
    return () => ro.disconnect()
  }, [el])

  if (!el || !el.isConnected) return null
  try {
    return {
      cs: window.getComputedStyle(el),
      rect: el.getBoundingClientRect(),
    }
  } catch {
    return null
  }
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className={styles.section}>
      <button className={styles.sectionHeader} onClick={() => setOpen(o => !o)}>
        <span className={styles.sectionChevron} data-open={String(open)}>›</span>
        <span className={styles.sectionTitle}>{title}</span>
      </button>
      {open && <div className={styles.sectionBody}>{children}</div>}
    </div>
  )
}

// ─── Prop row ─────────────────────────────────────────────────────────────────

function PropRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className={styles.propRow}>
      <span className={styles.propLabel}>{label}</span>
      {children ?? <span className={styles.propValue}>{value}</span>}
    </div>
  )
}

// ─── Layout section ───────────────────────────────────────────────────────────

function LayoutSection({ cs, rect }: { cs: CSSStyleDeclaration; rect: DOMRect }) {
  const d = cs.display
  const isFlex = d === 'flex' || d === 'inline-flex'
  const isGrid = d === 'grid' || d === 'inline-grid'

  // Borders — show if any side is non-zero
  const borderWidths = [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth]
  const hasBorder = borderWidths.some(w => parseFloat(w) > 0)
  const borderShorthand = (() => {
    if (!hasBorder) return null
    const allSame = new Set(borderWidths).size === 1
    const w = allSame ? cs.borderTopWidth : borderWidths.map(trimPx).join(' ')
    const style = cs.borderTopStyle
    const color = rgbToHex(cs.borderTopColor)
    return allSame ? `${w} ${style} ${color}` : `${w} (sides differ)`
  })()

  // Border radius — show if non-zero
  const radii = [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius]
  const hasRadius = radii.some(r => parseFloat(r) > 0)
  const radiusShorthand = (() => {
    if (!hasRadius) return null
    const allSame = new Set(radii).size === 1
    return allSame ? cs.borderTopLeftRadius : radii.map(trimPx).join(' ')
  })()

  return (
    <div className={styles.propTable}>
      <PropRow label="display" value={d} />
      {isFlex && <PropRow label="direction" value={cs.flexDirection} />}
      {isFlex && <PropRow label="justify" value={cs.justifyContent} />}
      {isFlex && <PropRow label="align" value={cs.alignItems} />}
      {isFlex && cs.flexWrap !== 'nowrap' && <PropRow label="wrap" value={cs.flexWrap} />}
      {(isFlex || isGrid) && cs.gap !== 'normal' && cs.gap !== '0px' && (
        <PropRow label="gap" value={cs.gap} />
      )}
      {isGrid && cs.gridTemplateColumns !== 'none' && (
        <PropRow label="columns" value={cs.gridTemplateColumns} />
      )}
      {isGrid && cs.gridTemplateRows !== 'none' && (
        <PropRow label="rows" value={cs.gridTemplateRows} />
      )}
      <PropRow label="width"  value={`${Math.round(rect.width)}px`} />
      <PropRow label="height" value={`${Math.round(rect.height)}px`} />
      {cs.position !== 'static' && <PropRow label="position" value={cs.position} />}
      {cs.overflow !== 'visible' && <PropRow label="overflow" value={cs.overflow} />}
      {borderShorthand && <PropRow label="border" value={borderShorthand} />}
      {radiusShorthand && <PropRow label="radius" value={radiusShorthand} />}
      {cs.opacity !== '1' && <PropRow label="opacity" value={cs.opacity} />}
      {cs.boxShadow !== 'none' && <PropRow label="shadow" value="(set)" />}
    </div>
  )
}

// ─── Box model ────────────────────────────────────────────────────────────────

interface Sides { t: string; r: string; b: string; l: string }

function BoxModel({ cs, rect }: { cs: CSSStyleDeclaration; rect: DOMRect }) {
  const m: Sides  = { t: trimPx(cs.marginTop),       r: trimPx(cs.marginRight),       b: trimPx(cs.marginBottom),       l: trimPx(cs.marginLeft)       }
  const bo: Sides = { t: trimPx(cs.borderTopWidth),   r: trimPx(cs.borderRightWidth),  b: trimPx(cs.borderBottomWidth),  l: trimPx(cs.borderLeftWidth)  }
  const p: Sides  = { t: trimPx(cs.paddingTop),       r: trimPx(cs.paddingRight),      b: trimPx(cs.paddingBottom),      l: trimPx(cs.paddingLeft)      }

  const bx = parseFloat(cs.borderLeftWidth)  + parseFloat(cs.borderRightWidth)
  const by = parseFloat(cs.borderTopWidth)   + parseFloat(cs.borderBottomWidth)
  const px = parseFloat(cs.paddingLeft)      + parseFloat(cs.paddingRight)
  const py = parseFloat(cs.paddingTop)       + parseFloat(cs.paddingBottom)
  const cw = Math.max(0, Math.round(rect.width  - bx - px))
  const ch = Math.max(0, Math.round(rect.height - by - py))

  return (
    <div className={styles.boxModel}>
      {/* Margin */}
      <div className={`${styles.bmLayer} ${styles.bmMargin}`}>
        <span className={styles.bmEdge}>{m.t}</span>
        <div className={styles.bmRow}>
          <span className={styles.bmSide}>{m.l}</span>
          {/* Border */}
          <div className={`${styles.bmLayer} ${styles.bmBorder} ${styles.bmInner}`}>
            <span className={styles.bmEdge}>{bo.t}</span>
            <div className={styles.bmRow}>
              <span className={styles.bmSide}>{bo.l}</span>
              {/* Padding */}
              <div className={`${styles.bmLayer} ${styles.bmPadding} ${styles.bmInner}`}>
                <span className={styles.bmEdge}>{p.t}</span>
                <div className={styles.bmRow}>
                  <span className={styles.bmSide}>{p.l}</span>
                  {/* Content */}
                  <div className={`${styles.bmContent} ${styles.bmInner}`}>
                    {cw}&thinsp;×&thinsp;{ch}
                  </div>
                  <span className={styles.bmSide}>{p.r}</span>
                </div>
                <span className={styles.bmEdge}>{p.b}</span>
              </div>
              <span className={styles.bmSide}>{bo.r}</span>
            </div>
            <span className={styles.bmEdge}>{bo.b}</span>
          </div>
          <span className={styles.bmSide}>{m.r}</span>
        </div>
        <span className={styles.bmEdge}>{m.b}</span>
      </div>

      <div className={styles.bmLegend}>
        <span className={`${styles.bmLegendItem} ${styles.bmLegendMargin}`}>margin</span>
        <span className={`${styles.bmLegendItem} ${styles.bmLegendBorder}`}>border</span>
        <span className={`${styles.bmLegendItem} ${styles.bmLegendPadding}`}>padding</span>
        <span className={`${styles.bmLegendItem} ${styles.bmLegendContent}`}>content</span>
      </div>
    </div>
  )
}

// ─── Typography section ───────────────────────────────────────────────────────

function TypographySection({ cs }: { cs: CSSStyleDeclaration }) {
  const fontFamily = cs.fontFamily.split(',')[0].trim().replace(/['"]/g, '')
  const colorHex   = rgbToHex(cs.color)

  return (
    <div className={styles.propTable}>
      <PropRow label="font"   value={fontFamily} />
      <PropRow label="size"   value={cs.fontSize} />
      <PropRow label="weight" value={cs.fontWeight} />
      <PropRow label="line-h" value={cs.lineHeight} />
      {cs.letterSpacing !== 'normal' && (
        <PropRow label="tracking" value={cs.letterSpacing} />
      )}
      {cs.textAlign !== 'start' && cs.textAlign !== 'left' && (
        <PropRow label="align" value={cs.textAlign} />
      )}
      {cs.textTransform !== 'none' && (
        <PropRow label="transform" value={cs.textTransform} />
      )}
      <PropRow label="color">
        <div className={styles.colorValue}>
          <span className={styles.colorSwatch} style={{ background: cs.color }} />
          <span className={styles.propValue}>{colorHex}</span>
        </div>
      </PropRow>
    </div>
  )
}

// ─── InspectPanel ─────────────────────────────────────────────────────────────

interface InspectPanelProps {
  el: HTMLElement | null
}

export function InspectPanel({ el }: InspectPanelProps) {
  const data = useInspectData(el)

  if (!data) {
    return (
      <div className={styles.empty}>
        <p>Select a story to inspect</p>
      </div>
    )
  }

  return (
    <div className={styles.panelScroll}>
      <Section title="Layout">
        <LayoutSection cs={data.cs} rect={data.rect} />
      </Section>
      <Section title="Box Model">
        <BoxModel cs={data.cs} rect={data.rect} />
      </Section>
      <Section title="Typography">
        <TypographySection cs={data.cs} />
      </Section>
    </div>
  )
}
