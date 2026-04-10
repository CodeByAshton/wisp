import { useState, useRef, useCallback, useEffect, KeyboardEvent } from 'react'
import { Search, ChevronRight, X } from 'lucide-react'
import type { StoryGroup, ResolvedStory } from '../hooks/useStories'
import { StatusBadge } from '../components/ui/StatusBadge'
import type { WatchStatus } from '../hooks/useDirectoryWatch'
import styles from './Sidebar.module.css'

interface SidebarProps {
  groups: StoryGroup[]
  selectedStoryId: string | undefined
  onSelectStory: (story: ResolvedStory) => void
  width: number
  onWidthChange: (w: number) => void
  watchStatus: WatchStatus
  storyCount: number
  variantCount: number
  resolvedDir: string
}

function fuzzyMatch(text: string, query: string): boolean {
  const t = text.toLowerCase()
  const q = query.toLowerCase()
  let qi = 0
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++
  }
  return qi === q.length
}

export function Sidebar({
  groups,
  selectedStoryId,
  onSelectStory,
  width,
  onWidthChange,
  watchStatus,
  storyCount,
  variantCount,
  resolvedDir,
}: SidebarProps) {
  const [query, setQuery] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(groups.map(g => g.id)))
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set())
  const searchRef = useRef<HTMLInputElement>(null)
  const isResizing = useRef(false)

  // Auto-expand group containing selected story
  useEffect(() => {
    if (!selectedStoryId) return
    for (const group of groups) {
      for (const comp of group.components) {
        if (comp.stories.some(s => s.id === selectedStoryId)) {
          setExpandedGroups(prev => new Set([...prev, group.id]))
          setExpandedComponents(prev => new Set([...prev, comp.id]))
          return
        }
      }
    }
  }, [selectedStoryId, groups])

  // Auto-expand all when new stories appear
  useEffect(() => {
    setExpandedGroups(new Set(groups.map(g => g.id)))
  }, [groups])

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleComponent = (id: string) => {
    setExpandedComponents(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Resize handle
  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isResizing.current = true
    const startX = e.clientX
    const startWidth = width

    const onMove = (e: MouseEvent) => {
      if (!isResizing.current) return
      const delta = e.clientX - startX
      const newWidth = Math.max(200, Math.min(380, startWidth + delta))
      onWidthChange(newWidth)
    }

    const onUp = () => {
      isResizing.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [width, onWidthChange])

  // Keyboard navigation
  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setQuery('')
      searchRef.current?.blur()
    }
  }

  // Global ⌘K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
        searchRef.current?.select()
      }
    }
    window.addEventListener('keydown', handler as any)
    return () => window.removeEventListener('keydown', handler as any)
  }, [])

  // Filter stories by query
  const filteredGroups = query
    ? groups
        .map(group => ({
          ...group,
          components: group.components
            .map(comp => ({
              ...comp,
              stories: comp.stories.filter(
                s =>
                  fuzzyMatch(s.name, query) ||
                  fuzzyMatch(comp.name, query) ||
                  fuzzyMatch(group.title, query)
              ),
            }))
            .filter(c => c.stories.length > 0),
        }))
        .filter(g => g.components.length > 0)
    : groups

  // When searching, force-expand everything that has results
  const isGroupExpanded = (id: string) => query ? true : expandedGroups.has(id)
  const isCompExpanded  = (id: string) => query ? true : expandedComponents.has(id)

  const shortDir = resolvedDir
    ? resolvedDir.replace(/\\/g, '/').split('/').slice(-3).join('/')
    : ''

  return (
    <aside className={`${styles.sidebar} panel-frosted`} style={{ width }}>
      {/* Search */}
      <div className={styles.searchWrap}>
        <Search className={styles.searchIcon} size={14} />
        <input
          ref={searchRef}
          type="text"
          placeholder="Search components…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className={styles.searchInput}
          spellCheck={false}
        />
        {query && (
          <button className={styles.clearBtn} onClick={() => setQuery('')} tabIndex={-1}>
            <X size={12} />
          </button>
        )}
        <kbd className={styles.kbdHint}>
          <span className={styles.kbdMeta}>⌘</span>
          <span className={styles.kbdKey}>K</span>
        </kbd>
      </div>

      <div className={styles.separator} />

      {/* Tree */}
      <div className={styles.tree}>
        {filteredGroups.length === 0 && (
          <div className={styles.emptyState}>
            {query ? 'No results' : 'No stories found'}
          </div>
        )}

        {filteredGroups.map((group, gi) => (
          <div key={group.id} className={styles.group}>
            <button
              className={styles.groupHeader}
              onClick={() => toggleGroup(group.id)}
              aria-expanded={isGroupExpanded(group.id)}
            >
              <ChevronRight
                size={12}
                className={`${styles.chevron} ${isGroupExpanded(group.id) ? styles.expanded : ''}`}
              />
              <span className={styles.groupTitle}>{group.title}</span>
            </button>

            <div
              className={`${styles.groupContent} ${isGroupExpanded(group.id) ? styles.open : ''}`}
            >
              {group.components.map((comp, ci) => (
                <div key={comp.id} className={styles.component}>
                  <button
                    className={`${styles.componentHeader} ${
                      comp.stories.some(s => s.id === selectedStoryId) ? styles.hasActive : ''
                    }`}
                    onClick={() => {
                      toggleComponent(comp.id)
                      if (comp.stories.length > 0) onSelectStory(comp.stories[0])
                    }}
                    aria-expanded={isCompExpanded(comp.id)}
                    style={{ animationDelay: `${(gi * 3 + ci) * 30}ms` }}
                  >
                    <ChevronRight
                      size={11}
                      className={`${styles.compChevron} ${
                        isCompExpanded(comp.id) ? styles.expanded : ''
                      }`}
                    />
                    <span className={styles.componentName}>{comp.name}</span>
                    <span className={styles.storyCount}>{comp.stories.length}</span>
                  </button>

                  <div
                    className={`${styles.storiesList} ${
                      isCompExpanded(comp.id) ? styles.open : ''
                    }`}
                  >
                    {comp.stories.map(story => (
                      <button
                        key={story.id}
                        className={`${styles.storyItem} ${
                          story.id === selectedStoryId ? styles.active : ''
                        }`}
                        onClick={() => onSelectStory(story)}
                      >
                        <span className={styles.storyDot} />
                        <span className={styles.storyName}>{story.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom strip */}
      <div className={styles.bottomStrip}>
        <StatusBadge
          status={watchStatus}
          storyCount={storyCount}
          variantCount={variantCount}
        />
        {shortDir && (
          <span className={`${styles.dirPath} truncate`} title={resolvedDir}>
            …/{shortDir}
          </span>
        )}
      </div>

      {/* Resize handle */}
      <div className={styles.resizeHandle} onMouseDown={startResize} />
    </aside>
  )
}
