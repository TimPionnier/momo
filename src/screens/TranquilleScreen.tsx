import { AnimatePresence, motion } from 'framer-motion'
import { Check, Hand, Timer, X, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../components/Button'
import { ChronoOverlay } from '../components/ChronoOverlay'
import { ConstraintsPanel } from '../components/ConstraintsPanel'
import { GameOver } from '../components/GameOver'
import { CardBack, MomoCard } from '../components/MomoCard'
import { Modal } from '../components/Modal'
import { PlayerPicker } from '../components/PlayerPicker'
import { Scoreboard } from '../components/Scoreboard'
import { CHRONO_SECONDS, currentPlayer, FLASHES_TO_END } from '../game/tranquille'
import type { TranquilleGame } from '../game/types'
import { useHotkeys } from '../hooks/useHotkeys'
import { playerName, plural } from '../lib/players'
import { play } from '../lib/sound'

interface Props {
  game: TranquilleGame
  sound: boolean
  modalOpen: boolean
  onDraw: () => void
  onSuccess: () => void
  onFail: () => void
  onChrono: (launcher: string, found: boolean) => void
  onReplay: () => void
  onHome: () => void
}

export function tranquilleSubtitle(game: TranquilleGame): string {
  if (game.phase === 'gameOver') return 'Partie terminée'
  return `Variante tranquille · Tour ${game.turn}`
}

export function TranquilleScreen({ game, sound, modalOpen, onDraw, onSuccess, onFail, onChrono, onReplay, onHome }: Props) {
  const [pickLauncher, setPickLauncher] = useState(false)
  const [launcher, setLauncher] = useState<string | null>(null)
  const player = currentPlayer(game)
  const top = game.stack[game.stack.length - 1]

  useEffect(() => {
    if (game.phase === 'answer' && top) play(top.kind === 'flash' ? 'flash' : 'flip', sound)
  }, [game.phase, top, sound])

  const primary = () => {
    if (game.phase === 'draw') onDraw()
    else if (game.phase === 'answer') {
      onSuccess()
      play('success', sound)
    }
  }
  useHotkeys(
    { ' ': primary, Enter: primary, Backspace: () => game.phase === 'answer' && onFail(), c: () => game.phase === 'answer' && setPickLauncher(true) },
    !modalOpen && !pickLauncher && !launcher && game.phase !== 'gameOver',
  )

  if (game.phase === 'gameOver') {
    const rows = [...game.players]
      .sort((a, b) => game.collected[a.id] - game.collected[b.id])
      .map((p) => ({ id: p.id, name: p.name, color: p.color, value: plural(game.collected[p.id], 'carte'), winner: game.winners.includes(p.id) }))
    const names = game.winners.map((id) => playerName(game.players, id)).join(' & ')
    return (
      <GameOver
        title={`${names} gagne${game.winners.length > 1 ? 'nt' : ''} la partie !`}
        subtitle="La 2ᵉ carte Flash a été piochée."
        rows={rows}
        sound={sound}
        onReplay={onReplay}
        onHome={onHome}
      />
    )
  }

  return (
    <div className="lg:grid lg:grid-cols-[300px_1fr] lg:gap-8">
      <aside className="lg:sticky lg:top-4 lg:self-start">
        <Scoreboard rows={game.players.map((p, i) => ({ player: p, collected: game.collected[p.id], highlight: i === game.current }))} />
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white/8 px-3 py-2 text-sm" data-testid="flash-counter">
          <Zap className="h-4 w-4 fill-momo-yellow text-momo-yellow" />
          Cartes Flash piochées : <b>{game.flashCount} / {FLASHES_TO_END}</b>
        </div>
      </aside>

      <main className="flex min-h-[60dvh] flex-col gap-5 pb-48 pt-4 lg:pb-8 lg:pt-0">
        {game.lastTurn && (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-2xl bg-momo-yellow px-4 py-2 text-center font-bold text-navy">
            <Zap className="mr-1 inline h-5 w-5 fill-navy" /> 2ᵉ Flash ! Dernier tour, la partie s’arrête après.
          </motion.div>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={game.turn}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            className="text-center"
          >
            {game.lastEvent && <p className="mb-1 text-white/70">{game.lastEvent}</p>}
            <h2 className="font-display text-4xl sm:text-5xl" data-testid="current-player">
              Au tour de <span style={{ color: player.color }}>{player.name}</span>
            </h2>
            <p className="mt-1 text-white/70">
              {game.stack.length === 0 ? 'Pile vide : on repart de zéro.' : `${plural(game.stack.length, 'carte')} accumulée${game.stack.length > 1 ? 's' : ''}`}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="flex min-h-48 flex-wrap items-end justify-center gap-2 sm:gap-3">
          {game.stack.length === 0 && game.phase === 'draw' && <CardBack />}
          {game.stack.map((c, i) => (
            <MomoCard key={`${c.id}-${i}`} card={c} size={i === game.stack.length - 1 ? 'md' : 'sm'} flip={i === game.stack.length - 1} />
          ))}
        </div>

        {game.stack.length > 0 && <ConstraintsPanel cards={game.stack} title="Le mot doit respecter toutes les cartes" />}
      </main>

      <div className="pb-safe fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-navy-deep via-navy-deep/95 to-transparent px-4 pt-8 lg:static lg:col-start-2 lg:bg-none lg:p-0">
        <div className="mx-auto flex max-w-3xl flex-col gap-2">
          {game.phase === 'draw' ? (
            <Button big onClick={onDraw} icon={<Hand className="h-6 w-6" />} kbd="Espace">
              {player.name} pioche une carte
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setPickLauncher(true)} icon={<Timer className="h-5 w-5" />} kbd="C">
                Chrono {CHRONO_SECONDS} s
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button big variant="danger" onClick={() => { onFail(); play('fail', sound) }} icon={<X className="h-6 w-6" />} kbd="⌫">
                  Raté / sèche
                </Button>
                <Button big variant="success" onClick={primary} icon={<Check className="h-6 w-6" />} kbd="Espace">
                  Trouvé !
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <Modal open={pickLauncher} onClose={() => setPickLauncher(false)} title="Qui lance le chrono ?">
        <p className="mb-4 text-white/70">
          Si {player.name} ne trouve pas en {CHRONO_SECONDS} secondes, il ramasse. S’il trouve, c’est le lanceur qui ramasse !
        </p>
        <PlayerPicker
          players={game.players.filter((p) => p.id !== player.id)}
          onPick={(id) => {
            setPickLauncher(false)
            setLauncher(id)
          }}
        />
      </Modal>

      {launcher && (
        <ChronoOverlay
          seconds={CHRONO_SECONDS}
          playerName={player.name}
          launcherName={playerName(game.players, launcher)}
          sound={sound}
          onFound={() => {
            onChrono(launcher, true)
            play('success', sound)
            setLauncher(null)
          }}
          onTimeout={() => {
            onChrono(launcher, false)
            setLauncher(null)
          }}
          onCancel={() => setLauncher(null)}
        />
      )}
    </div>
  )
}
