import { motion } from 'framer-motion'
import { BookOpen, Play, RotateCcw } from 'lucide-react'
import { Button } from '../components/Button'
import { Logo } from '../components/Logo'
import { MomoCard } from '../components/MomoCard'
import { useHotkeys } from '../hooks/useHotkeys'
import type { Card } from '../game/types'

const DECO: Card[] = [
  { id: 'd1', kind: 'blue', letter: 'F' },
  { id: 'd2', kind: 'theme', theme: 'Métier', emoji: '👷' },
  { id: 'd3', kind: 'red', letter: 'D' },
]

interface Props {
  canResume: boolean
  onResume: () => void
  onNew: () => void
  onRules: () => void
}

export function Home({ canResume, onResume, onNew, onRules }: Props) {
  useHotkeys({ ' ': () => (canResume ? onResume() : onNew()), Enter: () => (canResume ? onResume() : onNew()) })
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-between px-4 pb-safe pt-10 sm:justify-center sm:gap-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <Logo />
        <p className="font-display text-2xl text-momo-yellow sm:text-3xl">Le compagnon de jeu</p>
        <p className="max-w-sm text-white/70">Les mots se crient à voix haute, l’appli s’occupe des cartes, des contraintes et des scores.</p>
      </div>

      <div className="my-8 flex items-end justify-center" aria-hidden>
        {DECO.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ y: 40, opacity: 0, rotate: 0 }}
            animate={{ y: i === 1 ? -14 : 0, opacity: 1, rotate: (i - 1) * 12 }}
            transition={{ delay: 0.2 + i * 0.12, type: 'spring', stiffness: 180, damping: 14 }}
            className="-mx-3"
          >
            <MomoCard card={c} flip={false} />
          </motion.div>
        ))}
      </div>

      <div className="flex w-full flex-col gap-3">
        {canResume && (
          <Button big onClick={onResume} icon={<Play className="h-6 w-6 fill-navy" />} kbd="Espace">
            Reprendre la partie
          </Button>
        )}
        <Button big variant={canResume ? 'secondary' : 'primary'} onClick={onNew} icon={<RotateCcw className="h-6 w-6" />} kbd={canResume ? undefined : 'Espace'}>
          Nouvelle partie
        </Button>
        <Button big variant="ghost" onClick={onRules} icon={<BookOpen className="h-6 w-6" />}>
          Règles du jeu
        </Button>
      </div>
    </div>
  )
}
