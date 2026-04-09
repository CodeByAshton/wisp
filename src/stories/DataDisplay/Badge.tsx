import type { HTMLAttributes } from 'react'
import styles from './Badge.module.css'

export type BadgeVariant = 'default' | 'info' | 'success' | 'warning' | 'danger' | 'purple'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  label: string
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
}

export function Badge({
  label,
  variant = 'default',
  size = 'md',
  dot = false,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={[styles.badge, styles[variant], styles[size], className ?? ''].filter(Boolean).join(' ')}
      {...props}
    >
      {dot && <span className={styles.dot} aria-hidden />}
      {label}
    </span>
  )
}
