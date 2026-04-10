import { useState, useEffect, useCallback } from 'react'
import { X, FolderOpen, Check, AlertCircle, RefreshCw, Plus, Trash2, ExternalLink } from 'lucide-react'
import { Toggle } from '../components/ui/Toggle'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { StatusBadge } from '../components/ui/StatusBadge'
import type { WispSettings, CanvasBackground } from '../hooks/useSettings'
import type { WatchStatus } from '../hooks/useDirectoryWatch'
import styles from './SettingsPanel.module.css'

interface SettingsPanelProps {
  open: boolean
  onClose: () => void
  settings: WispSettings
  onSettingsChange: (patch: Partial<WispSettings>) => void
  watchStatus: WatchStatus
  storyCount: number
  variantCount: number
  resolvedDir: string
  onRefreshStatus: () => void
}

interface DirectoryStatus {
  status: WatchStatus
  message: string
}

async function setDirectory(directory: string, glob?: string): Promise<{ success: boolean; storyCount: number; dirExists: boolean; resolvedDir: string }> {
  const res = await fetch('/wisp-api/set-directory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ directory, glob }),
  })
  return res.json()
}

export function SettingsPanel({
  open,
  onClose,
  settings,
  onSettingsChange,
  watchStatus,
  storyCount,
  variantCount,
  resolvedDir,
  onRefreshStatus,
}: SettingsPanelProps) {
  const [dirInput, setDirInput] = useState(settings.storiesDir)
  const [globInput, setGlobInput] = useState(settings.storiesGlob)
  const [editingDir, setEditingDir] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [aliases, setAliases] = useState(settings.aliases)

  useEffect(() => {
    setDirInput(settings.storiesDir)
    setGlobInput(settings.storiesGlob)
    setAliases(settings.aliases)
  }, [settings.storiesDir, settings.storiesGlob, settings.aliases])

  const applyDirectory = useCallback(async () => {
    setSaving(true)
    setSaveError('')
    try {
      const result = await setDirectory(dirInput, globInput)
      if (result.success !== false) {
        onSettingsChange({ storiesDir: dirInput, storiesGlob: globInput })
        setEditingDir(false)
        onRefreshStatus()
      } else {
        setSaveError('Failed to update directory')
      }
    } catch (e) {
      setSaveError(String(e))
    } finally {
      setSaving(false)
    }
  }, [dirInput, globInput, onSettingsChange, onRefreshStatus])

  const addAlias = () => {
    setAliases(prev => [...prev, { key: '', value: '' }])
  }

  const removeAlias = (i: number) => {
    const next = aliases.filter((_, idx) => idx !== i)
    setAliases(next)
    onSettingsChange({ aliases: next })
  }

  const updateAlias = (i: number, field: 'key' | 'value', val: string) => {
    const next = aliases.map((a, idx) => idx === i ? { ...a, [field]: val } : a)
    setAliases(next)
    onSettingsChange({ aliases: next })
  }

  const syncFromTsconfig = async () => {
    try {
      const res = await fetch('/wisp-api/status')
      const data = await res.json()
      // In a real implementation, this would read the tsconfig.json from the project root
      // For now, show what aliases are currently active
      const existing = Object.entries(data.aliases ?? {}).map(([key, value]) => ({ key, value: value as string }))
      if (existing.length > 0) {
        setAliases(existing)
        onSettingsChange({ aliases: existing })
      }
    } catch {
      // Noop
    }
  }

  const bgSegments = [
    { value: 'subtle' as CanvasBackground, label: 'Subtle' },
    { value: 'checkered' as CanvasBackground, label: 'Checked' },
    { value: 'dark' as CanvasBackground, label: 'Dark' },
  ]

  // Derived: is cardBackground a valid hex color?
  const cardBgIsHex = /^#[0-9a-f]{3,8}$/i.test(settings.cardBackground)
  const cardBgForPicker = cardBgIsHex ? settings.cardBackground : '#222222'

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className={styles.backdrop}
          onClick={onClose}
          aria-hidden
        />
      )}

      {/* Panel */}
      <aside className={`${styles.panel} ${open ? styles.open : ''} panel-frosted`} role="dialog" aria-label="Settings" aria-modal>
        <div className={styles.header}>
          <h2 className={styles.title}>Settings</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close settings">
            <X size={16} />
          </button>
        </div>

        <div className={styles.body}>

          {/* ── 1. Component Directory ──────────────────────────── */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Component Directory</h3>

            <div className={styles.dirDisplay}>
              {editingDir ? (
                <div className={styles.dirEdit}>
                  <div className={styles.fieldRow}>
                    <label className={styles.fieldLabel}>Path</label>
                    <input
                      type="text"
                      value={dirInput}
                      onChange={e => setDirInput(e.target.value)}
                      className={styles.dirInput}
                      placeholder="/absolute/path or ../relative"
                      spellCheck={false}
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') applyDirectory()
                        if (e.key === 'Escape') {
                          setEditingDir(false)
                          setDirInput(settings.storiesDir)
                        }
                      }}
                    />
                  </div>
                  <div className={styles.fieldRow}>
                    <label className={styles.fieldLabel}>Glob</label>
                    <input
                      type="text"
                      value={globInput}
                      onChange={e => setGlobInput(e.target.value)}
                      className={styles.dirInput}
                      placeholder="**/*.stories.tsx"
                      spellCheck={false}
                    />
                  </div>
                  {saveError && (
                    <div className={styles.error}>
                      <AlertCircle size={12} />
                      {saveError}
                    </div>
                  )}
                  <div className={styles.btnRow}>
                    <button
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      onClick={applyDirectory}
                      disabled={saving}
                    >
                      {saving ? <RefreshCw size={12} className={styles.spin} /> : <Check size={12} />}
                      Apply
                    </button>
                    <button
                      className={styles.btn}
                      onClick={() => {
                        setEditingDir(false)
                        setDirInput(settings.storiesDir)
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.dirView}>
                  <code className={`${styles.dirPath} truncate-left`} title={resolvedDir || settings.storiesDir}>
                    {resolvedDir || settings.storiesDir || '(not set)'}
                  </code>
                  <div className={styles.dirActions}>
                    <StatusBadge
                      status={watchStatus}
                      storyCount={storyCount}
                      variantCount={variantCount}
                    />
                    <button
                      className={`${styles.btn} ${styles.btnSmall}`}
                      onClick={() => setEditingDir(true)}
                    >
                      <FolderOpen size={12} />
                      Change
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.statsRow}>
              <span className={styles.stat}>{storyCount} story file{storyCount !== 1 ? 's' : ''}</span>
              <span className={styles.statDot}>·</span>
              <span className={styles.stat}>{variantCount} variant{variantCount !== 1 ? 's' : ''}</span>
            </div>
          </section>

          {/* ── 2. Watch Settings ───────────────────────────────── */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Watch Settings</h3>

            <div className={styles.field}>
              <Toggle
                checked={settings.watchIncludeNodeModules}
                onChange={v => onSettingsChange({ watchIncludeNodeModules: v })}
                label="Include node_modules"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>
                Debounce delay: <strong>{settings.watchDebounce}ms</strong>
              </label>
              <input
                type="range"
                min={100}
                max={1000}
                step={50}
                value={settings.watchDebounce}
                onChange={e => onSettingsChange({ watchDebounce: parseInt(e.target.value) })}
                className={styles.range}
              />
              <div className={styles.rangeLabels}>
                <span>100ms</span>
                <span>1000ms</span>
              </div>
            </div>
          </section>

          {/* ── 3. Path Aliases ─────────────────────────────────── */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Path Aliases</h3>
              <button className={`${styles.btn} ${styles.btnSmall}`} onClick={syncFromTsconfig}>
                <RefreshCw size={11} />
                Sync tsconfig
              </button>
            </div>

            <div className={styles.aliasTable}>
              {aliases.length === 0 && (
                <p className={styles.emptyAliases}>No aliases configured</p>
              )}
              {aliases.map((alias, i) => (
                <div key={i} className={styles.aliasRow}>
                  <input
                    type="text"
                    value={alias.key}
                    onChange={e => updateAlias(i, 'key', e.target.value)}
                    placeholder="@"
                    className={styles.aliasInput}
                  />
                  <span className={styles.aliasArrow}>→</span>
                  <input
                    type="text"
                    value={alias.value}
                    onChange={e => updateAlias(i, 'value', e.target.value)}
                    placeholder="../src"
                    className={`${styles.aliasInput} ${styles.aliasInputWide}`}
                  />
                  <button
                    className={styles.deleteBtn}
                    onClick={() => removeAlias(i)}
                    aria-label="Remove alias"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>

            <button className={`${styles.btn} ${styles.btnAdd}`} onClick={addAlias}>
              <Plus size={12} />
              Add alias
            </button>
          </section>

          {/* ── 4. Appearance ───────────────────────────────────── */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Appearance</h3>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Canvas background</label>
              <SegmentedControl
                segments={bgSegments}
                value={settings.canvasBackground}
                onChange={v => onSettingsChange({ canvasBackground: v })}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Frame background</label>
              <div className={styles.colorPickerRow}>
                <div className={styles.colorSwatchWrap}>
                  <span
                    className={styles.colorSwatch}
                    style={{
                      background: settings.cardBackground === 'transparent' ? 'transparent' : settings.cardBackground,
                    }}
                  />
                  <input
                    type="color"
                    value={cardBgForPicker}
                    onChange={e => onSettingsChange({ cardBackground: e.target.value })}
                    className={styles.nativeColorInput}
                    title="Pick frame color"
                  />
                </div>
                <input
                  type="text"
                  value={settings.cardBackground}
                  onChange={e => onSettingsChange({ cardBackground: e.target.value })}
                  placeholder="#222222 or transparent"
                  className={styles.hexInput}
                  spellCheck={false}
                />
                <button
                  className={`${styles.btn} ${styles.btnSmall} ${settings.cardBackground === 'transparent' ? styles.btnActive : ''}`}
                  onClick={() => onSettingsChange({ cardBackground: 'transparent' })}
                >
                  None
                </button>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>
                Sidebar width: <strong>{settings.sidebarWidth}px</strong>
              </label>
              <input
                type="range"
                min={200}
                max={320}
                step={10}
                value={settings.sidebarWidth}
                onChange={e => onSettingsChange({ sidebarWidth: parseInt(e.target.value) })}
                className={styles.range}
              />
              <div className={styles.rangeLabels}>
                <span>200px</span>
                <span>320px</span>
              </div>
            </div>
          </section>

          {/* ── 5. About ────────────────────────────────────────── */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>About</h3>
            <div className={styles.aboutRows}>
              <div className={styles.aboutRow}>
                <span className={styles.aboutLabel}>WISP</span>
                <span className={styles.aboutValue}>v0.1.0</span>
              </div>
              <div className={styles.aboutRow}>
                <span className={styles.aboutLabel}>Vite</span>
                <span className={styles.aboutValue}>v5.x</span>
              </div>
              <div className={styles.aboutRow}>
                <span className={styles.aboutLabel}>React</span>
                <span className={styles.aboutValue}>v18.x</span>
              </div>
            </div>
            <a
              href="https://github.com/your-org/wisp"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.githubLink}
            >
              <ExternalLink size={12} />
              View on GitHub
            </a>
          </section>

        </div>
      </aside>
    </>
  )
}
