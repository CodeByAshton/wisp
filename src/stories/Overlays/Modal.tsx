import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useWispPortal } from '../../core/CanvasContext'
import styles from './Modal.module.css'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children?: ReactNode
  footer?: ReactNode
  closeOnBackdrop?: boolean
}

export function Modal({
  open,
  onClose,
  title,
  size = 'md',
  children,
  footer,
  closeOnBackdrop = true,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  // In WISP: renders into the canvas portal root (contained, no full-screen blackout).
  // In production: falls back to document.body.
  const portalTarget = useWispPortal()

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement
    panelRef.current?.focus()
    return () => prev?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className={styles.overlay}
      onClick={closeOnBackdrop ? e => { if (e.target === e.currentTarget) onClose() } : undefined}
      role="dialog"
      aria-modal
      aria-label={title ?? 'Dialog'}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`${styles.panel} ${styles[size]}`}
      >
        {/* Header */}
        {title && (
          <div className={styles.header}>
            <h2 className={styles.title}>{title}</h2>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close dialog">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className={styles.body}>{children}</div>

        {/* Footer */}
        {footer && (
          <div className={styles.footer}>{footer}</div>
        )}
      </div>
    </div>,
    portalTarget
  )
}
