import { useId } from 'react'
import styles from './Toggle.module.css'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  const id = useId()

  return (
    <label
      htmlFor={id}
      className={styles.wrapper}
      style={{ opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={e => !disabled && onChange(e.target.checked)}
        className={styles.input}
        disabled={disabled}
      />
      <span className={`${styles.track} ${checked ? styles.checked : ''}`}>
        <span className={styles.thumb} />
      </span>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  )
}
