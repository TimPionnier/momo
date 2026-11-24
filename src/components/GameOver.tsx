import { motion } from 'framer-motion'
import { Crown, Home, RotateCcw } from 'lucide-react'
import { useEffect } from 'react'
import { Button } from './Button'
import { useHotkeys } from '../hooks/useHotkeys'
import { celebrate } from '../lib/confetti'
import { play } from '../lib/sound'

export interface RankRow {
  id: string
  name: string
  color: string
  value: string
  winner: boolean
}

interface Props {
  title: string
  subtitle?: string
  rows: RankRow[]
  sound: boolean
  onReplay: () => void
  onHome: () => void
}

export function GameOver({ title, subtitle, rows, sound, onReplay, onHome }: Props) {
  useEffect(() => {
    celebrate()
    play('win', sound)
  }, [])
  useHotkeys({ Enter: onReplay, ' ': onReplay })

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 py-6 text-center"
      aria-label="Fin de partie"
    >
      <motion.div
        initial={{ y: -40, rotate: -20, opacity: 0 }}
        animate={{ y: 0, rotate: [0, -8, 8, 0], opacity: 1 }}
        transition={{ duration: 0.9 }}
      >
        <Crown className="h-24 w-24 fill-momo-yellow text-amber-500 drop-shadow-[0_6px_0_rgba(0,0,0,.3)]" />
      </motion.div>
      <div>
        <h2 className="font-display text-4xl leading-tight text-momo-yellow sm:text-5xl" data-testid="winner-title">
          {title}
        </h2>
        {subtitle && <p className="mt-2 text-lg text-white/80">{subtitle}</p>}
      </div>
      <ol className="flex w-full flex-col gap-2">
        {rows.map((r, i) => (
          <motion.li
            key={r.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${r.winner ? 'bg-momo-yellow text-navy' : 'bg-white/8'}`}
          >
            <span className="w-6 font-display text-xl">{i + 1}</span>
            <span className="h-7 w-7 rounded-full ring-2 ring-white/40" style={{ background: r.color }} aria-hidden />
            <span className="flex-1 text-left text-lg font-bold">{r.name}</span>
            <span className="font-semibold">{r.value}</span>
          </motion.li>
        ))}
      </ol>
      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <Button big className="flex-1" onClick={onReplay} icon={<RotateCcw className="h-5 w-5" />} kbd="Entrée">
          Rejouer
        </Button>
        <Button big variant="secondary" className="flex-1" onClick={onHome} icon={<Home className="h-5 w-5" />}>
          Accueil
        </Button>
      </div>
    </motion.section>
  )
}
