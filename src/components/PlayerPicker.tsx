import { useHotkeys } from '../hooks/useHotkeys'
import type { Player } from '../game/types'

interface Props {
  players: Player[]
  onPick: (id: string) => void
  /** Texte secondaire par joueur */
  detail?: (p: Player) => string | undefined
  disabled?: (p: Player) => boolean
}

/** Grille de gros boutons joueurs ; touches 1 à 9 au clavier. */
export function PlayerPicker({ players, onPick, detail, disabled }: Props) {
  useHotkeys(
    Object.fromEntries(
      players.slice(0, 9).map((p, i) => [String(i + 1), () => !disabled?.(p) && onPick(p.id)]),
    ),
  )
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      {players.map((p, i) => (
        <button
          key={p.id}
          onClick={() => onPick(p.id)}
          disabled={disabled?.(p)}
          className="flex min-h-14 min-w-0 items-center gap-2 rounded-2xl bg-white/10 px-2.5 py-2.5 sm:min-h-16 sm:gap-3 sm:px-4 sm:py-3 text-left ring-1 ring-white/15 transition hover:bg-white/20 active:scale-[0.98] disabled:opacity-35"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-base text-navy sm:h-9 sm:w-9 sm:text-lg" style={{ background: p.color }}>
            {i < 9 ? i + 1 : p.name[0]}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-bold sm:text-lg">{p.name}</span>
            {detail?.(p) && <span className="block truncate text-xs text-white/60 sm:text-sm">{detail(p)}</span>}
          </span>
        </button>
      ))}
    </div>
  )
}
