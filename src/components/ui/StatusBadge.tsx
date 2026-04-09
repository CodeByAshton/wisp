import type { WatchStatus } from '../../hooks/useDirectoryWatch'
import styles from './StatusBadge.module.css'

interface StatusBadgeProps {
  status: WatchStatus
  storyCount?: number
  variantCount?: number
  compact?: boolean
}

const STATUS_CONFIG = {
  watching: { color: 'green', label: 'Watching' },
  'not-found': { color: 'red', label: 'Not found' },
  empty: { color: 'yellow', label: 'No stories' },
  loading: { color: 'gray', label: 'Loading' },
} satisfies Record<WatchStatus, { color: string; label: string }>

export function StatusBadge({ status, storyCount, variantCount, compact }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  let label = config.label
  if (status === 'watching' && storyCount !== undefined && !compact) {
    label = `${storyCount} file${storyCount !== 1 ? 's' : ''}`
    if (variantCount !== undefined) label += ` · ${variantCount} variant${variantCount !== 1 ? 's' : ''}`
  }

  return (
    <span className={`${styles.badge} ${styles[config.color]}`}>
      <span className={`${styles.dot} ${status === 'watching' ? styles.pulse : ''}`} />
      {!compact && <span className={styles.label}>{label}</span>}
    </span>
  )
}
