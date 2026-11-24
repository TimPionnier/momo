import { motion } from 'framer-motion'
import { ArrowLeft, Coffee, Plus, Skull, Trophy, Trash2, Users } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button } from '../components/Button'
import { PLAYER_LIMITS } from '../game/classic'
import type { Mode, Player } from '../game/types'
import type { SetupConfig } from '../game/store'
import { PLAYER_COLORS, TEAM_COLORS, TEAM_NAMES } from '../lib/players'

const MODES: { mode: Mode; title: string; subtitle: string; icon: ReactNode }[] = [
  { mode: 'classic', title: 'Règle officielle', subtitle: '2 à 6 joueurs · 3 manches gagnantes', icon: <Trophy className="h-6 w-6" /> },
  { mode: 'team', title: 'Mode équipe', subtitle: '4 ou 6 joueurs · 2 équipes', icon: <Users className="h-6 w-6" /> },
  { mode: 'survival', title: 'Mode survie', subtitle: '4 à 6 joueurs · élimination', icon: <Skull className="h-6 w-6" /> },
  { mode: 'tranquille', title: 'Variante tranquille', subtitle: '2 à 8 joueurs · chacun son tour', icon: <Coffee className="h-6 w-6" /> },
]

let uid = 0
function newId(): string {
  uid += 1
  return `p${Date.now().toString(36)}${uid}`
}

function defaultPlayers(n: number): Player[] {
  return Array.from({ length: n }, (_, i) => ({ id: newId(), name: '', color: PLAYER_COLORS[i], team: (i % 2) as 0 | 1 }))
}

export function validateSetup(mode: Mode, players: Player[]): string | null {
  const { min, max } = PLAYER_LIMITS[mode]
  if (players.length < min || players.length > max) return `Ce mode se joue de ${min} à ${max} joueurs.`
  if (mode === 'team') {
    if (players.length % 2 !== 0) return 'Le mode équipe se joue à 4 ou 6 joueurs.'
    const a = players.filter((p) => p.team === 0).length
    if (a !== players.length / 2) return 'Les deux équipes doivent avoir le même nombre de joueurs.'
  }
  return null
}

interface Props {
  initial: SetupConfig | null
  onBack: () => void
  onStart: (setup: SetupConfig) => void
}

export function Setup({ initial, onBack, onStart }: Props) {
  const [mode, setMode] = useState<Mode>(initial?.mode ?? 'classic')
  const [players, setPlayers] = useState<Player[]>(() => initial?.players.map((p) => ({ ...p })) ?? defaultPlayers(3))
  const limits = PLAYER_LIMITS[mode]

  const named = players.map((p, i) => ({ ...p, name: p.name.trim() || `Joueur ${i + 1}` }))
  const error = validateSetup(mode, named)

  const update = (id: string, patch: Partial<Player>) => setPlayers((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  const add = () =>
    setPlayers((ps) => {
      const used = new Set(ps.map((p) => p.color))
      const color = PLAYER_COLORS.find((c) => !used.has(c)) ?? PLAYER_COLORS[ps.length % PLAYER_COLORS.length]
      const t0 = ps.filter((p) => p.team === 0).length
      return [...ps, { id: newId(), name: '', color, team: t0 <= ps.length - t0 ? 0 : 1 }]
    })
  const remove = (id: string) => setPlayers((ps) => ps.filter((p) => p.id !== id))

  const start = () => {
    if (error) return
    onStart({ mode, players: named.map((p) => (mode === 'team' ? p : { ...p, team: undefined })) })
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-4xl flex-col px-4 pt-4">
      <header className="flex items-center gap-2">
        <Button variant="ghost" onClick={onBack} icon={<ArrowLeft className="h-5 w-5" />} aria-label="Retour">
          <span className="hidden sm:inline">Retour</span>
        </Button>
        <h1 className="font-display text-3xl tracking-wide sm:text-4xl">Nouvelle partie</h1>
      </header>

      <div className="grid flex-1 gap-6 py-6 lg:grid-cols-2 lg:gap-10">
        <section aria-labelledby="mode-title">
          <h2 id="mode-title" className="mb-3 font-display text-xl text-momo-yellow">1. Mode de jeu</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {MODES.map((m) => (
              <motion.button
                key={m.mode}
                whileTap={{ scale: 0.97 }}
                onClick={() => setMode(m.mode)}
                aria-pressed={mode === m.mode}
                className={`flex items-center gap-3 rounded-2xl p-4 text-left ring-2 transition ${
                  mode === m.mode ? 'bg-momo-yellow text-navy ring-momo-yellow' : 'bg-white/8 ring-white/10 hover:bg-white/15'
                }`}
              >
                {m.icon}
                <span>
                  <span className="block text-lg font-bold">{m.title}</span>
                  <span className={`block text-sm ${mode === m.mode ? 'text-navy/75' : 'text-white/60'}`}>{m.subtitle}</span>
                </span>
              </motion.button>
            ))}
          </div>
        </section>

        <section aria-labelledby="players-title">
          <h2 id="players-title" className="mb-3 font-display text-xl text-momo-yellow">
            2. Joueurs <span className="font-sans text-sm text-white/60">({players.length}/{limits.max})</span>
          </h2>
          <ul className="flex flex-col gap-2">
            {players.map((p, i) => (
              <motion.li layout key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
                <span className="h-10 w-10 shrink-0 rounded-full ring-2 ring-white/30" style={{ background: p.color }} aria-hidden />
                <input
                  value={p.name}
                  onChange={(e) => update(p.id, { name: e.target.value })}
                  placeholder={`Joueur ${i + 1}`}
                  aria-label={`Nom du joueur ${i + 1}`}
                  maxLength={16}
                  className="h-12 min-w-0 flex-1 rounded-xl bg-white/10 px-3 text-lg font-semibold placeholder:text-white/40 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-momo-yellow"
                />
                {mode === 'team' && (
                  <button
                    onClick={() => update(p.id, { team: p.team === 0 ? 1 : 0 })}
                    className="h-12 shrink-0 rounded-xl px-3 text-sm font-bold text-navy"
                    style={{ background: TEAM_COLORS[p.team ?? 0] }}
                    aria-label={`Équipe de ${p.name || `Joueur ${i + 1}`} : ${TEAM_NAMES[p.team ?? 0]}`}
                  >
                    {p.team === 1 ? 'Rouge' : 'Bleue'}
                  </button>
                )}
                <button
                  onClick={() => remove(p.id)}
                  disabled={players.length <= 2}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white/60 hover:bg-white/10 hover:text-momo-red-light disabled:opacity-30"
                  aria-label={`Retirer ${p.name || `Joueur ${i + 1}`}`}
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </motion.li>
            ))}
          </ul>
          {players.length < 8 && (
            <Button variant="secondary" className="mt-3 w-full" onClick={add} icon={<Plus className="h-5 w-5" />}>
              Ajouter un joueur
            </Button>
          )}
          {players.length === 2 && mode === 'classic' && (
            <p className="mt-3 rounded-xl bg-white/5 p-3 text-sm text-white/75">À 2 joueurs : 2 piles de 11 cartes chacun, 2 cartes par tour, 2 mots à trouver.</p>
          )}
        </section>
      </div>

      <div className="pb-safe sticky bottom-0 -mx-4 bg-gradient-to-t from-navy-deep via-navy-deep/95 to-transparent px-4 pt-6">
        {error && <p className="mb-2 text-center text-sm font-semibold text-momo-red-light" role="alert">{error}</p>}
        <Button big className="w-full lg:mx-auto lg:flex lg:w-96" onClick={start} disabled={!!error}>
          Lancer la partie
        </Button>
      </div>
    </div>
  )
}
