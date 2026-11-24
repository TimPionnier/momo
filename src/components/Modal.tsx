import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useId, type ReactNode } from 'react'

interface Props {
  open: boolean
  onClose?: () => void
  title: string
  children: ReactNode
  wide?: boolean
}

/** Feuille en bas d'écran sur mobile, boîte centrée sur grand écran. */
export function Modal({ open, onClose, title, children, wide }: Props) {
  const id = useId()
  // Bloque le défilement de la page derrière la feuille (mobile)
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open || !onClose) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={id}
            className={`pb-safe flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-navy-deep ring-1 ring-white/15 sm:rounded-3xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
              <h2 id={id} className="font-display text-2xl tracking-wide text-momo-yellow sm:text-3xl">
                {title}
              </h2>
              {onClose && (
                <button onClick={onClose} className="rounded-full p-2 hover:bg-white/10" aria-label="Fermer">
                  <X className="h-6 w-6" />
                </button>
              )}
            </div>
            <div className="overflow-y-auto px-5 py-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
