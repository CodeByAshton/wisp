import { useRef, useState, useLayoutEffect } from 'react'
import styles from './SegmentedControl.module.css'

interface Segment<T extends string> {
  value: T
  label: React.ReactNode
  title?: string
}

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[]
  value: T | undefined
  onChange: (value: T) => void
  size?: 'sm' | 'md'
}

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  size = 'md',
}: SegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [thumbStyle, setThumbStyle] = useState<React.CSSProperties>({})
  const activeIndex = segments.findIndex(s => s.value === value)

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    const buttons = container.querySelectorAll<HTMLButtonElement>('button')
    const activeBtn = buttons[activeIndex]
    if (!activeBtn) {
      setThumbStyle({ width: 0, opacity: 0 })
      return
    }
    setThumbStyle({
      width: activeBtn.offsetWidth,
      transform: `translateX(${activeBtn.offsetLeft}px)`,
      opacity: 1,
    })
  }, [activeIndex, segments])

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${size === 'sm' ? styles.sm : ''}`}
      role="group"
    >
      <span className={styles.thumb} style={thumbStyle} aria-hidden />
      {segments.map(seg => (
        <button
          key={seg.value}
          type="button"
          title={seg.title}
          onClick={() => onChange(seg.value)}
          className={`${styles.btn} ${seg.value === value ? styles.active : ''}`}
          aria-pressed={seg.value === value}
        >
          {seg.label}
        </button>
      ))}
    </div>
  )
}
