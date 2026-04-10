import { RotateCcw, Copy, Check, Crosshair } from 'lucide-react'
import { useState } from 'react'
import { Toggle } from '../components/ui/Toggle'
import { InspectPanel } from './InspectPanel'
import type { ResolvedStory, ArgType } from '../types/story'
import styles from './ControlsPanel.module.css'

interface ControlsPanelProps {
  story: ResolvedStory | undefined
  args: Record<string, unknown>
  onArgsChange: (args: Record<string, unknown>) => void
  onReset: () => void
  canvasEl: HTMLElement | null
  picking: boolean
  onPickingChange: (v: boolean) => void
}

function getControlType(argType: ArgType): string {
  if (!argType.control) return 'text'
  if (typeof argType.control === 'string') return argType.control
  return argType.control.type
}

function getControlConfig(argType: ArgType) {
  if (!argType.control || typeof argType.control === 'string') return {}
  return argType.control
}

function argsToJSX(args: Record<string, unknown>): string {
  return Object.entries(args)
    .map(([key, value]) => {
      if (typeof value === 'string') return `${key}="${value}"`
      if (typeof value === 'boolean') return value ? key : `${key}={false}`
      return `${key}={${JSON.stringify(value)}}`
    })
    .join('\n  ')
}

interface ControlProps {
  name: string
  argType: ArgType
  value: unknown
  onChange: (v: unknown) => void
}

function Control({ name, argType, value, onChange }: ControlProps) {
  const controlType = getControlType(argType)
  const config = getControlConfig(argType)

  switch (controlType) {
    case 'boolean':
      return (
        <Toggle
          checked={Boolean(value)}
          onChange={onChange}
        />
      )

    case 'select':
    case 'radio':
    case 'inline-radio': {
      const opts = argType.options ?? []
      return (
        <select
          value={String(value ?? '')}
          onChange={e => onChange(e.target.value)}
          className={styles.select}
        >
          {opts.map(opt => (
            <option key={String(opt)} value={String(opt)}>{String(opt)}</option>
          ))}
        </select>
      )
    }

    case 'number': {
      return (
        <div className={styles.numberControl}>
          <input
            type="range"
            min={(config as any).min ?? 0}
            max={(config as any).max ?? 100}
            step={(config as any).step ?? 1}
            value={Number(value) || 0}
            onChange={e => onChange(Number(e.target.value))}
            className={styles.rangeInput}
          />
          <input
            type="number"
            value={Number(value) || 0}
            onChange={e => onChange(Number(e.target.value))}
            className={styles.numberInput}
          />
        </div>
      )
    }

    case 'range': {
      return (
        <div className={styles.rangeControl}>
          <input
            type="range"
            min={(config as any).min ?? 0}
            max={(config as any).max ?? 100}
            step={(config as any).step ?? 1}
            value={Number(value) || 0}
            onChange={e => onChange(Number(e.target.value))}
            className={styles.rangeInput}
          />
          <span className={styles.rangeValue}>{Number(value) || 0}</span>
        </div>
      )
    }

    case 'color': {
      return (
        <div className={styles.colorControl}>
          <div
            className={styles.colorSwatch}
            style={{ background: String(value ?? '#000') }}
          />
          <input
            type="color"
            value={String(value ?? '#000000')}
            onChange={e => onChange(e.target.value)}
            className={styles.colorInput}
          />
          <input
            type="text"
            value={String(value ?? '')}
            onChange={e => onChange(e.target.value)}
            className={styles.colorHex}
            placeholder="#000000"
            spellCheck={false}
          />
        </div>
      )
    }

    case 'text':
    default:
      return (
        <input
          type="text"
          value={String(value ?? '')}
          onChange={e => onChange(e.target.value)}
          className={styles.textInput}
          placeholder={argType.description ? `(${argType.description})` : ''}
        />
      )
  }
}

export function ControlsPanel({ story, args, onArgsChange, onReset, canvasEl, picking, onPickingChange }: ControlsPanelProps) {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'controls' | 'inspect'>('controls')

  const argTypes = story
    ? ({ ...story.meta.argTypes, ...story.story.argTypes } as Record<string, ArgType>)
    : {}
  const hasControls = Object.keys(argTypes).length > 0

  const copyProps = async () => {
    if (!story) return
    const jsx = argsToJSX(args)
    await navigator.clipboard.writeText(jsx)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <aside className={`${styles.panel} panel-frosted`}>
      {/* Header with Controls / Inspect tabs */}
      <div className={styles.header}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'controls' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('controls')}
          >
            Controls
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'inspect' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('inspect')}
          >
            Inspect
          </button>
        </div>

        {activeTab === 'controls' && story && (
          <div className={styles.headerActions}>
            <button
              className={styles.actionBtn}
              onClick={copyProps}
              title="Copy props (C)"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              className={styles.actionBtn}
              onClick={onReset}
              title="Reset (R)"
            >
              <RotateCcw size={12} />
              Reset
            </button>
          </div>
        )}

        {activeTab === 'inspect' && (
          <div className={styles.headerActions}>
            <button
              className={`${styles.actionBtn} ${picking ? styles.actionBtnActive : ''}`}
              onClick={() => onPickingChange(!picking)}
              title={picking ? 'Exit element picker' : 'Pick an element to inspect'}
            >
              <Crosshair size={12} />
              {picking ? 'Picking…' : 'Pick'}
            </button>
          </div>
        )}
      </div>

      <div className={styles.separator} />

      {/* Tab content */}
      {activeTab === 'controls' ? (
        <div className={styles.controls}>
          {!story && (
            <div className={styles.emptyState}>
              <p>No story selected</p>
            </div>
          )}

          {story && !hasControls && (
            <div className={styles.emptyState}>
              <p>No controls defined</p>
              <p className={styles.emptyHint}>Add argTypes to your story to see controls here</p>
            </div>
          )}

          {story && hasControls && Object.entries(argTypes).map(([name, argType]) => (
            <div key={name} className={styles.controlRow}>
              <div className={styles.controlLabel}>
                <span className={styles.controlName}>{name}</span>
                {argType.type && (
                  <span className={styles.controlType}>
                    {typeof argType.type === 'string' ? argType.type : argType.type.name}
                  </span>
                )}
              </div>
              <div className={styles.controlInput}>
                <Control
                  name={name}
                  argType={argType}
                  value={args[name]}
                  onChange={v => onArgsChange({ ...args, [name]: v })}
                />
              </div>
              {argType.description && (
                <p className={styles.controlDesc}>{argType.description}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <InspectPanel el={canvasEl} />
      )}
    </aside>
  )
}
