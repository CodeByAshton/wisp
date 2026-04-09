import { useState, useEffect, useCallback } from 'react'

export type WatchStatus = 'watching' | 'not-found' | 'empty' | 'loading'

interface DirectoryStatus {
  status: WatchStatus
  storyCount: number
  variantCount: number
  resolvedDir: string
  storiesGlob: string
}

export function useDirectoryWatch(totalVariants: number) {
  const [status, setStatus] = useState<DirectoryStatus>({
    status: 'loading',
    storyCount: 0,
    variantCount: 0,
    resolvedDir: '',
    storiesGlob: '**/*.stories.tsx',
  })

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/wisp-api/status')
      const data = await res.json()

      let watchStatus: WatchStatus = 'watching'
      if (!data.dirExists) watchStatus = 'not-found'
      else if (data.storyCount === 0) watchStatus = 'empty'

      setStatus({
        status: watchStatus,
        storyCount: data.storyCount,
        variantCount: totalVariants,
        resolvedDir: data.storiesDir,
        storiesGlob: data.storiesGlob,
      })
    } catch {
      setStatus(prev => ({ ...prev, status: 'not-found' }))
    }
  }, [totalVariants])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  // Listen for HMR events to update status
  useEffect(() => {
    if (!import.meta.hot) return

    const handler = () => {
      setTimeout(fetchStatus, 200) // Brief delay to let server update
    }

    import.meta.hot.on('wisp:stories-changed', handler)
    return () => import.meta.hot?.off('wisp:stories-changed', handler)
  }, [fetchStatus])

  return { ...status, refresh: fetchStatus }
}
