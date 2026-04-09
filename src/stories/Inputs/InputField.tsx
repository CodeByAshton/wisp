import { forwardRef, InputHTMLAttributes, useState } from 'react'
import styles from './InputField.module.css'

export interface InputFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  hint?: string
  error?: string
  prefix?: string
  suffix?: string
  size?: 'sm' | 'md' | 'lg'
  clearable?: boolean
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(function InputField(
  {
    label,
    hint,
    error,
    prefix,
    suffix,
    size = 'md',
    clearable = false,
    value: valueProp,
    defaultValue,
    onChange,
    className,
    ...props
  },
  ref
) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? '')
  const isControlled = valueProp !== undefined
  const currentValue = isControlled ? valueProp : internalValue

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setInternalValue(e.target.value)
    onChange?.(e)
  }

  const handleClear = () => {
    if (!isControlled) setInternalValue('')
    const nativeInput = (ref as React.RefObject<HTMLInputElement>)?.current
    if (nativeInput) {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(nativeInput, '')
      nativeInput.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }

  return (
    <div className={[styles.wrapper, error ? styles.hasError : '', className ?? ''].filter(Boolean).join(' ')}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={`${styles.inputRow} ${styles[size]}`}>
        {prefix && <span className={styles.prefix}>{prefix}</span>}
        <input
          ref={ref}
          value={currentValue}
          onChange={handleChange}
          className={styles.input}
          aria-invalid={!!error}
          aria-describedby={error ? 'field-error' : hint ? 'field-hint' : undefined}
          {...props}
        />
        {clearable && String(currentValue).length > 0 && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={handleClear}
            aria-label="Clear input"
            tabIndex={-1}
          >
            ×
          </button>
        )}
        {suffix && <span className={styles.suffix}>{suffix}</span>}
      </div>
      {error && <p id="field-error" className={styles.error}>{error}</p>}
      {!error && hint && <p id="field-hint" className={styles.hint}>{hint}</p>}
    </div>
  )
})
