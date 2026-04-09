import { createContext, useContext } from 'react'

/**
 * Provides a portal target element scoped to the WISP canvas area.
 * Demo components (Modal, Drawer, etc.) that use createPortal should
 * consume this context so their overlays stay within the canvas instead
 * of covering the entire WISP shell.
 *
 * In production (outside WISP), the context is null and components fall
 * back to document.body — zero impact on real usage.
 */
export const WispPortalContext = createContext<HTMLElement | null>(null)

export function useWispPortal(): HTMLElement {
  const el = useContext(WispPortalContext)
  return el ?? document.body
}
