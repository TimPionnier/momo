import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { play } from '../lib/sound'

interface Props {
  onDone: () => void
  sound: boolean
  from?: number
}

/** Décompte 3-2-1 plein écran : tout le monde découvre les cartes en même temps. */
export function RevealCountdown({ onDone, sound, from = 3 }: Props) {
  const [n, setN] = useState(from)
  useEffect(() => {
    if (n === 0) {
      play('go', sound)
      onDone()
      return
    }
    play('tick', sound)
    const t = setTimeout(() => setN((v) => v - 1), 600)
    return () => clearTimeout(t)
  }, [n, onDone, sound])

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-navy-deep/85 backdrop-blur" role="status" aria-live="assertive">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={n}
          className="font-display text-[10rem] leading-none text-momo-yellow drop-shadow-[0_8px_0_rgba(0,0,0,0.3)] sm:text-[14rem]"
          initial={{ scale: 2.2, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.4, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        >
          {n > 0 ? n : 'MOMO !'}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}
