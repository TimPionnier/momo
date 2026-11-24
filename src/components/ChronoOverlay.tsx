import { motion } from 'framer-motion'
import { Check, TimerOff, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from './Button'
import { useHotkeys } from '../hooks/useHotkeys'
import { play } from '../lib/sound'

interface Props {
  seconds: number
  playerName: string
  launcherName: string
  sound: boolean
  onFound: () => void
  onTimeout: () => void
  onCancel: () => void
}

const R = 90
const CIRC = 2 * Math.PI * R

/** Sablier 15 s : anneau qui se vide + barre de temps, bips sur les 5 dernières secondes. */
export function ChronoOverlay({ seconds, playerName, launcherName, sound, onFound, onTimeout, onCancel }: Props) {
  const [left, setLeft] = useState(seconds)
  const over = left <= 0

  useEffect(() => {
    if (over) {
      play('alarm', sound)
      return
    }
    if (left <= 5) play('tick', sound)
    const t = setTimeout(() => setLeft((v) => v - 1), 1000)
    return () => clearTimeout(t)
  }, [left, over, sound])

  useHotkeys({ ' ': () => (over ? onTimeout() : onFound()), Enter: () => (over ? onTimeout() : onFound()), Escape: onCancel })

  const ratio = Math.max(0, left / seconds)
  const color = left > 5 ? '#ffc533' : '#e5345f'

  return (
    <motion.div
      className="pb-safe fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-navy-deep/95 px-4 backdrop-blur"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      role="timer"
      aria-live="polite"
      aria-label={`Chrono : ${left} secondes`}
    >
      <p className="text-center text-lg text-white/80">
        <b>{launcherName}</b> lance le chrono sur <b>{playerName}</b> — silence !
      </p>
      <div className="relative h-64 w-64 sm:h-80 sm:w-80">
        <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
          <circle cx="100" cy="100" r={R} stroke="rgba(255,255,255,.12)" strokeWidth="14" fill="none" />
          <motion.circle
            cx="100"
            cy="100"
            r={R}
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={CIRC}
            animate={{ strokeDashoffset: CIRC * (1 - ratio) }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </svg>
        <motion.span
          key={left}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          className="absolute inset-0 flex items-center justify-center font-display text-8xl tabular-nums"
          style={{ color }}
          data-testid="chrono-left"
        >
          {over ? <TimerOff className="h-24 w-24" /> : left}
        </motion.span>
      </div>
      <div className="h-3 w-full max-w-md overflow-hidden rounded-full bg-white/10">
        <motion.div className="h-full rounded-full" style={{ background: color }} animate={{ width: `${ratio * 100}%` }} transition={{ duration: 1, ease: 'linear' }} />
      </div>
      <div className="flex w-full max-w-md flex-col gap-3">
        {over ? (
          <Button big variant="danger" onClick={onTimeout} kbd="Espace">
            Temps écoulé : {playerName} ramasse
          </Button>
        ) : (
          <Button big variant="success" onClick={onFound} icon={<Check className="h-6 w-6" />} kbd="Espace">
            {playerName} a trouvé : {launcherName} ramasse
          </Button>
        )}
        <Button variant="ghost" onClick={onCancel} icon={<X className="h-5 w-5" />}>
          Annuler le chrono
        </Button>
      </div>
    </motion.div>
  )
}
