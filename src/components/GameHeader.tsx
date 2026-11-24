import { BookOpen, Home, Undo2, Volume2, VolumeX } from 'lucide-react'
import { Logo } from './Logo'

interface Props {
  subtitle: string
  sound: boolean
  canUndo: boolean
  onUndo: () => void
  onToggleSound: () => void
  onRules: () => void
  onHome: () => void
}

const iconBtn = 'flex h-11 w-11 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-30'

export function GameHeader({ subtitle, sound, canUndo, onUndo, onToggleSound, onRules, onHome }: Props) {
  return (
    <header className="flex items-center justify-between gap-2 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="hidden sm:block"><Logo small /></span>
        <span className="truncate rounded-full bg-white/10 px-3 py-1 text-sm font-semibold sm:text-base" data-testid="game-subtitle">
          {subtitle}
        </span>
      </div>
      <nav className="flex shrink-0 items-center">
        <button className={iconBtn} onClick={onUndo} disabled={!canUndo} aria-label="Annuler la dernière action" title="Annuler (U)">
          <Undo2 className="h-5 w-5" />
        </button>
        <button className={iconBtn} onClick={onToggleSound} aria-label={sound ? 'Couper le son' : 'Activer le son'} aria-pressed={sound} title="Son">
          {sound ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </button>
        <button className={iconBtn} onClick={onRules} aria-label="Règles du jeu" title="Règles (R)">
          <BookOpen className="h-5 w-5" />
        </button>
        <button className={iconBtn} onClick={onHome} aria-label="Accueil" title="Accueil (partie sauvegardée)">
          <Home className="h-5 w-5" />
        </button>
      </nav>
    </header>
  )
}
