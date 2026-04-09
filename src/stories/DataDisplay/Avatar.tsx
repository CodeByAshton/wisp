import type { HTMLAttributes } from 'react'
import styles from './Avatar.module.css'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type AvatarShape = 'circle' | 'rounded'

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string
  name?: string
  size?: AvatarSize
  shape?: AvatarShape
  status?: 'online' | 'offline' | 'away' | 'busy'
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(p => p[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')
}

const SIZE_MAP: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 72,
}

// Generate a consistent color from a name string
function nameToColor(name: string): string {
  const colors = ['#007AFF', '#34C759', '#FF9F0A', '#FF3B30', '#AF52DE', '#5AC8FA', '#FF6B6B', '#30D158']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export function Avatar({
  src,
  name = 'User',
  size = 'md',
  shape = 'circle',
  status,
  className,
  style,
  ...props
}: AvatarProps) {
  const px = SIZE_MAP[size]
  const initials = getInitials(name)
  const bgColor = nameToColor(name)

  return (
    <div
      className={[
        styles.avatar,
        styles[size],
        styles[shape],
        className ?? '',
      ].filter(Boolean).join(' ')}
      style={{ width: px, height: px, ...style }}
      aria-label={name}
      {...props}
    >
      {src ? (
        <img src={src} alt={name} className={styles.img} />
      ) : (
        <span
          className={styles.initials}
          style={{ background: bgColor, fontSize: Math.max(10, px * 0.35) }}
        >
          {initials}
        </span>
      )}
      {status && (
        <span className={`${styles.statusDot} ${styles[`status-${status}`]}`} aria-hidden />
      )}
    </div>
  )
}
