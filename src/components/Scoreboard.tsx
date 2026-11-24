import { motion } from 'framer-motion'
import { Crown, Layers, Skull } from 'lucide-react'
import type { Player } from '../game/types'

export interface ScoreRow {
  player: Player
  collected: number
  wins?: number
  left?: number
  highlight?: boolean
  dim?: boolean
  out?: boolean
}

export interface TeamRow {
  name: string
  color: string
  collected: number
  wins: number
}

interface Props {
  rows: ScoreRow[]
  teams?: TeamRow[]
  winsTarget?: number
}

function Wins({ wins, target }: { wins: number; target: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${wins} manche${wins > 1 ? 's' : ''} gagnée${wins > 1 ? 's' : ''}`}>
      {Array.from({ length: target }, (_, i) => (
        <Crown key={i} className={`h-4 w-4 ${i < wins ? 'fill-momo-yellow text-momo-yellow' : 'text-white/20'}`} />
      ))}
    </span>
  )
}

/** Tableau des scores : bandeau défilant sur mobile, colonne latérale sur grand écran. */
export function Scoreboard({ rows, teams, winsTarget }: Props) {
  return (
    <div className="flex flex-col gap-3" data-testid="scoreboard">
      {teams && (
        <div className="grid grid-cols-2 gap-2">
          {teams.map((t) => (
            <div key={t.name} className="rounded-2xl px-3 py-2 text-navy" style={{ background: t.color }}>
              <div className="font-display text-lg leading-tight">{t.name}</div>
              <div className="flex items-center justify-between text-sm font-bold">
                <span>{t.collected} cartes</span>
                {winsTarget && <Wins wins={t.wins} target={winsTarget} />}
              </div>
            </div>
          ))}
        </div>
      )}
      <ul className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
        {rows.map((r) => (
          <motion.li
            layout
            key={r.player.id}
            className={`flex min-w-[9.5rem] shrink-0 items-center gap-3 rounded-2xl px-3 py-2 ring-1 transition lg:min-w-0 ${
              r.highlight ? 'bg-momo-yellow/15 ring-momo-yellow' : 'bg-white/8 ring-white/10'
            } ${r.dim || r.out ? 'opacity-45' : ''}`}
            data-testid={`score-${r.player.name}`}
          >
            <span className="h-8 w-8 shrink-0 rounded-full ring-2 ring-white/30" style={{ background: r.player.color }} aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 truncate font-bold lg:text-lg">
                {r.out && <Skull className="h-4 w-4 shrink-0" aria-label="éliminé" />}
                <span className="truncate">{r.player.name}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/70 lg:text-sm">
                {r.wins !== undefined && winsTarget && <Wins wins={r.wins} target={winsTarget} />}
                {r.left !== undefined && !r.out && (
                  <span className="flex items-center gap-0.5" title="Cartes restantes dans la pile">
                    <Layers className="h-3.5 w-3.5" /> {r.left}
                  </span>
                )}
              </div>
            </div>
            <motion.span
              key={r.collected}
              initial={{ scale: 1.6, color: '#ffc533' }}
              animate={{ scale: 1, color: '#ffffff' }}
              className="font-display text-2xl tabular-nums lg:text-3xl"
              aria-label={`${r.collected} cartes ramassées`}
              data-testid="collected"
            >
              {r.collected}
            </motion.span>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}
