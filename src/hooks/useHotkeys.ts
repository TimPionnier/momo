import { useEffect, useRef } from 'react'

export type HotkeyMap = Record<string, (e: KeyboardEvent) => void>

/**
 * Raccourcis clavier. Les clés sont des `KeyboardEvent.key` (ex : " ", "Enter", "Escape", "1", "z").
 * Ignorés lorsque l'utilisateur tape dans un champ.
 */
export function useHotkeys(map: HotkeyMap, enabled = true): void {
  const ref = useRef(map)
  ref.current = map
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const handler = ref.current[e.key] ?? ref.current[e.key.toLowerCase()]
      if (handler) {
        e.preventDefault()
        handler(e)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled])
}
