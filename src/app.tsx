import { useEffect } from 'react'
import { Layout } from './shell/Layout'
import { useTheme } from './hooks/useTheme'

export function App() {
  const { resolvedTheme } = useTheme()

  // Apply theme to document on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme)
  }, [resolvedTheme])

  return <Layout />
}
