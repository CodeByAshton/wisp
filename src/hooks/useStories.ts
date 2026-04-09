import { useMemo } from 'react'
import { useStoryModules, parseStoryModules } from '../core/StoryLoader'
import type { StoryGroup, StoryComponent, ResolvedStory } from '../types/story'

export type { StoryGroup, StoryComponent, ResolvedStory }

export function useStories() {
  const { modules, loading } = useStoryModules()

  const groups = useMemo(() => parseStoryModules(modules), [modules])

  const allStories = useMemo(() => {
    const stories: ResolvedStory[] = []
    for (const group of groups) {
      for (const component of group.components) {
        stories.push(...component.stories)
      }
    }
    return stories
  }, [groups])

  const totalFiles = modules.length
  const totalVariants = allStories.length

  function findStory(id: string): ResolvedStory | undefined {
    return allStories.find(s => s.id === id)
  }

  function findComponent(id: string): StoryComponent | undefined {
    for (const group of groups) {
      const component = group.components.find(c => c.id === id)
      if (component) return component
    }
    return undefined
  }

  function getFirstStory(): ResolvedStory | undefined {
    return groups[0]?.components[0]?.stories[0]
  }

  function getAdjacentStory(currentId: string, direction: 'prev' | 'next'): ResolvedStory | undefined {
    const idx = allStories.findIndex(s => s.id === currentId)
    if (idx === -1) return undefined
    const nextIdx = direction === 'next' ? idx + 1 : idx - 1
    return allStories[nextIdx]
  }

  return {
    groups,
    allStories,
    totalFiles,
    totalVariants,
    loading,
    findStory,
    findComponent,
    getFirstStory,
    getAdjacentStory,
  }
}
