import type React from 'react'
import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

vi.mock('canvas-confetti', () => ({ default: vi.fn() }))

// Les sorties animées (AnimatePresence) attendent des frames réelles : en test on démonte immédiatement
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>()
  return { ...actual, AnimatePresence: ({ children }: { children?: React.ReactNode }) => children }
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})

// Animations instantanées en test
import { MotionGlobalConfig } from 'framer-motion'
MotionGlobalConfig.skipAnimations = true

// jsdom n'implémente pas matchMedia / scrollTo
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

// Permet à Testing Library de faire avancer les faux timers de Vitest (shim de l'API jest)
;(globalThis as unknown as { jest: unknown }).jest = {
  advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms),
}
