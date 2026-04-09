import type { HTMLAttributes, ReactNode } from 'react'
import styles from './Card.module.css'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  footer?: ReactNode
  image?: string
  imageAlt?: string
  elevated?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({
  title,
  subtitle,
  footer,
  image,
  imageAlt,
  elevated = false,
  padding = 'md',
  children,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={[
        styles.card,
        elevated ? styles.elevated : '',
        className ?? '',
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {image && (
        <div className={styles.imageWrap}>
          <img src={image} alt={imageAlt ?? ''} className={styles.image} />
        </div>
      )}
      <div className={`${styles.body} ${styles[`pad-${padding}`]}`}>
        {(title || subtitle) && (
          <div className={styles.header}>
            {title && <h3 className={styles.title}>{title}</h3>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
        )}
        {children && <div className={styles.content}>{children}</div>}
      </div>
      {footer && (
        <>
          <div className={styles.footerSep} />
          <div className={`${styles.footer} ${styles[`pad-${padding}`]}`}>
            {footer}
          </div>
        </>
      )}
    </div>
  )
}
