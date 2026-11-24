import { AnimatePresence, motion } from 'framer-motion'
import { Check, Eye, HelpCircle, RefreshCw, Skull, Users, Zap } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '../components/Button'
import { ConstraintsPanel } from '../components/ConstraintsPanel'
import { GameOver, type RankRow } from '../components/GameOver'
import { CardBack, MomoCard } from '../components/MomoCard'
import { Modal } from '../components/Modal'
import { PlayerPicker } from '../components/PlayerPicker'
import { RevealCountdown } from '../components/RevealCountdown'
import { Scoreboard, type ScoreRow, type TeamRow } from '../components/Scoreboard'
import { canRelaunch, cardsLeft, pileConfig, ROUNDS_TO_WIN, teamScore, type Resolution } from '../game/classic'
import type { ClassicGame, Player } from '../game/types'
import { useHotkeys } from '../hooks/useHotkeys'
import { playerName, plural, TEAM_COLORS, TEAM_NAMES } from '../lib/players'
import { play } from '../lib/sound'

type Sheet = null | 'loser' | 'first' | 'malus' | 'flash' | 'partial'

interface Props {
  game: ClassicGame
  sound: boolean
  modalOpen: boolean
  onReveal: () => void
  onRelaunch: (stillIn?: string[]) => void
  onResolve: (r: Resolution) => void
  onFlash: (target: string) => void
  onNextRound: () => void
  onReplay: () => void
  onHome: () => void
}

export function classicSubtitle(game: ClassicGame): string {
  if (game.phase === 'gameOver') return 'Partie terminée'
  if (game.suddenDeath) return 'Mort subite !'
  const base = game.final ? 'Finale' : `Manche ${game.round}`
  return game.turn > 0 ? `${base} · Tour ${game.turn}` : base
}

export function ClassicScreen(props: Props) {
  const { game, sound, modalOpen, onReveal, onRelaunch, onResolve, onFlash, onNextRound } = props
  const [counting, setCounting] = useState(false)
  const [sheet, setSheet] = useState<Sheet>(null)
  const [loser, setLoser] = useState<string | null>(null)
  const [first, setFirst] = useState<string | null>(null)
  const [stillIn, setStillIn] = useState<string[]>([])

  const byId = (id: string) => game.players.find((p) => p.id === id)!
  const participants = game.suddenDeath ?? game.active
  const pileIndexes = [...new Set(game.center.map((c) => c.pile))].sort()
  const groups = pileIndexes.map((pile) => ({ pile, center: game.center.filter((c) => c.pile === pile) }))
  const hasFlash = game.center.some((c) => c.card.kind === 'flash')
  const twoWords = pileConfig(game).piles === 2 && !game.suddenDeath

  // Son du retournement / flash
  const prevTurn = useRef(game.turn + game.relaunches * 100)
  useEffect(() => {
    const key = game.turn + game.relaunches * 100
    if (game.phase === 'play' && key !== prevTurn.current) play(hasFlash ? 'flash' : 'flip', sound)
    prevTurn.current = key
  }, [game.turn, game.relaunches, game.phase, hasFlash, sound])

  const closeSheet = () => {
    setSheet(null)
    setLoser(null)
    setFirst(null)
  }

  const finishResolve = useCallback(
    (r: Resolution) => {
      onResolve(r)
      play('fail', sound)
      setSheet(null)
      setLoser(null)
      setFirst(null)
    },
    [onResolve, sound],
  )

  const pickLoser = (id: string) => {
    if (game.suddenDeath) return finishResolve({ loser: id })
    const canGiveMalus = game.active.some((p) => p !== id && (game.collected[p] ?? 0) > 0)
    if (!canGiveMalus) return finishResolve({ loser: id })
    setLoser(id)
    setSheet('first')
  }

  const pickFirst = (id: string) => {
    setFirst(id)
    setSheet('malus')
  }

  const startReveal = () => setCounting(true)
  const doneCounting = useCallback(() => {
    setCounting(false)
    onReveal()
  }, [onReveal])

  const primary = () => {
    if (game.phase === 'ready') return startReveal()
    if (game.phase === 'play') return setSheet(hasFlash ? 'flash' : 'loser')
    if (game.phase === 'roundEnd') return onNextRound()
  }

  useHotkeys({ ' ': primary, Enter: primary }, !modalOpen && !sheet && !counting && game.phase !== 'gameOver')

  const rows: ScoreRow[] = game.players.map((p) => ({
    player: p,
    collected: game.collected[p.id] ?? 0,
    wins: game.mode === 'classic' ? game.roundWins[p.id] ?? 0 : undefined,
    left: game.active.includes(p.id) ? cardsLeft(game, p.id) : undefined,
    out: game.eliminated.includes(p.id),
    highlight: game.phase === 'play' && game.relaunches > 0 && game.inTurn.includes(p.id),
    dim: !!game.suddenDeath && !game.suddenDeath.includes(p.id),
  }))
  const teams: TeamRow[] | undefined =
    game.mode === 'team'
      ? ([0, 1] as const).map((t) => ({ name: TEAM_NAMES[t], color: TEAM_COLORS[t], collected: teamScore(game, t), wins: game.roundWins[`team${t}`] ?? 0 }))
      : undefined

  const candidates = (ids: string[]) => ids.map(byId)

  return (
    <div className="lg:grid lg:grid-cols-[300px_1fr] lg:gap-8">
      <aside className="lg:sticky lg:top-4 lg:self-start">
        <Scoreboard rows={rows} teams={teams} winsTarget={game.mode === 'survival' ? undefined : ROUNDS_TO_WIN} />
        {game.mode === 'survival' && (
          <p className="mt-3 hidden text-sm text-white/60 lg:block">
            {game.final ? 'Finale : le moins de cartes gagne la partie.' : 'Fin de manche : le joueur avec le plus de cartes est éliminé.'}
          </p>
        )}
      </aside>

      <main className="flex flex-col pb-44 pt-3 short:pb-2 lg:min-h-[60dvh] lg:pb-8 lg:pt-0">
        <AnimatePresence mode="wait">
          {game.phase === 'ready' && (
            <motion.section key={`ready-${game.round}-${game.turn}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-1 flex-col items-center justify-center gap-5 py-4 text-center lg:gap-6">
              {game.suddenDeath ? (
                <div className="flex flex-col items-center gap-2">
                  <Skull className="h-14 w-14 text-momo-red-light" />
                  <h2 className="font-display text-4xl">Mort subite !</h2>
                  <p className="text-white/75">
                    {game.suddenDeath.map((id) => playerName(game.players, id)).join(' vs ')} : 1 carte chacun, celui qui ramasse {game.final ? 'perd la finale' : 'est éliminé'}.
                  </p>
                </div>
              ) : (
                <div>
                  <h2 className="font-display text-4xl sm:text-5xl">{game.final ? 'Finale !' : `Manche ${game.round}`}</h2>
                  <p className="mt-2 text-white/70">
                    {game.turn === 0
                      ? twoWords
                        ? 'Chacun a 2 piles : 2 cartes par tour, 2 mots à trouver.'
                        : 'Préparez-vous : tout le monde découvre les cartes en même temps.'
                      : 'Prêts pour le tour suivant ?'}
                  </p>
                </div>
              )}
              <div className="flex flex-wrap justify-center gap-4">
                {participants.map((id) => (
                  <div key={id} className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <CardBack size="sm" className="rotate-[-4deg]" />
                      <span className="absolute -right-2 -top-2 rounded-full bg-momo-yellow px-2 py-0.5 text-sm font-bold text-navy">{cardsLeft(game, id)}</span>
                    </div>
                    <span className="text-sm font-semibold">{playerName(game.players, id)}</span>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {game.phase === 'play' && (
            <motion.section key={`play-${game.round}-${game.turn}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4 sm:gap-5">
              {game.relaunches > 0 && (
                <div className="rounded-2xl bg-white/8 px-4 py-2 text-center text-sm sm:text-base">
                  <RefreshCw className="mr-1 inline h-4 w-4" />
                  Nouvelles cartes ! {game.inTurn.length < participants.length ? <>Cherchent encore : <b>{game.inTurn.map((id) => playerName(game.players, id)).join(', ')}</b></> : 'Tout le monde cherche.'}
                  <span className="ml-1 text-white/60">({plural(game.pot, 'carte')} en jeu)</span>
                </div>
              )}
              <div className={`grid gap-6 ${twoWords && groups.length > 1 ? 'xl:grid-cols-2' : ''}`}>
                {groups.map((group, gi) => (
                  <div key={group.pile} className="flex flex-col items-center gap-3 sm:gap-4">
                    <div className="flex flex-wrap justify-center gap-2 sm:gap-5" key={`${game.turn}-${game.relaunches}`}>
                      {group.center.map((c, i) => (
                          <MomoCard key={`${c.card.id}-${c.playerId}`} card={c.card} size={game.center.length > 3 ? 'fluid' : 'md'} delay={i * 0.12} caption={playerName(game.players, c.playerId)} captionColor={byId(c.playerId).color + '55'} />
                      ))}
                    </div>
                    <div className="order-first w-full sm:order-none short:order-first!">
                      <ConstraintsPanel cards={group.center.map((c) => c.card)} title={twoWords && groups.length > 1 ? `Mot ${gi + 1}` : undefined} />
                    </div>
                  </div>
                ))}
              </div>
              {twoWords && groups.length > 1 && <p className="text-center text-sm text-white/70">Il faut trouver 2 mots (un pour chaque groupe de cartes) pour gagner le tour.</p>}
            </motion.section>
          )}

          {game.phase === 'roundEnd' && game.lastRound && (
            <RoundEnd key={`end-${game.round}-${game.eliminated.length}`} game={game} />
          )}

          {game.phase === 'gameOver' && <ClassicGameOver key="over" {...props} />}
        </AnimatePresence>
      </main>

      {game.phase !== 'gameOver' && (
        <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-navy-deep/95 px-4 pt-3 backdrop-blur-md short:static short:border-0 short:bg-transparent short:px-0 short:backdrop-blur-none lg:static lg:col-start-2 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <div className="mx-auto flex max-w-3xl flex-col gap-2 short:max-w-none short:flex-row short:items-stretch [&>*]:short:flex-1">
            {game.phase === 'ready' && (
              <Button big onClick={startReveal} icon={<Eye className="h-6 w-6" />} kbd="Espace">
                Retourner les cartes
              </Button>
            )}
            {game.phase === 'play' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" onClick={() => onRelaunch()} disabled={!canRelaunch(game)} icon={<HelpCircle className="hidden h-5 w-5 sm:block" />}>
                    Personne ne trouve
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setStillIn([])
                      setSheet('partial')
                    }}
                    disabled={!canRelaunch(game) || game.inTurn.length < 3}
                    icon={<Users className="hidden h-5 w-5 sm:block" />}
                  >
                    Plusieurs sèchent
                  </Button>
                </div>
                <Button big variant={hasFlash ? 'primary' : 'danger'} onClick={primary} icon={hasFlash ? <Zap className="h-6 w-6 fill-navy" /> : undefined} kbd="Espace">
                  {hasFlash ? `Flash ! Donner les ${game.pot} cartes` : `Qui ramasse ${plural(game.pot, 'carte')} ?`}
                </Button>
              </>
            )}
            {game.phase === 'roundEnd' && (
              <Button big onClick={onNextRound} kbd="Espace">
                {game.lastRound?.suddenDeath ? 'Lancer la mort subite' : game.active.length === 2 && game.mode === 'survival' && !game.final ? 'Lancer la finale' : 'Manche suivante'}
              </Button>
            )}
          </div>
        </div>
      )}

      {counting && <RevealCountdown onDone={doneCounting} sound={sound} />}

      <Modal open={sheet === 'loser'} onClose={closeSheet} title={`Qui ramasse ${plural(game.pot, 'carte')} ?`}>
        <p className="mb-4 text-white/70">Le dernier à crier un mot, ou le premier qui se trompe.</p>
        <PlayerPicker players={candidates(game.inTurn)} onPick={pickLoser} detail={(p) => plural(game.collected[p.id] ?? 0, 'carte')} />
      </Modal>

      <Modal open={sheet === 'first'} onClose={closeSheet} title="Qui a répondu en premier ?">
        <p className="mb-4 text-white/70">Il donne en malus une de ses cartes ramassées à qui il veut.</p>
        <PlayerPicker
          players={candidates(game.active.filter((id) => id !== loser))}
          onPick={pickFirst}
          disabled={(p) => (game.collected[p.id] ?? 0) === 0}
          detail={(p) => ((game.collected[p.id] ?? 0) === 0 ? 'aucune carte à donner' : plural(game.collected[p.id], 'carte'))}
        />
        <Button variant="ghost" className="mt-4 w-full" onClick={() => loser && finishResolve({ loser })}>
          Pas de malus
        </Button>
      </Modal>

      <Modal open={sheet === 'malus'} onClose={closeSheet} title={`${first ? playerName(game.players, first) : ''} donne une carte à…`}>
        <PlayerPicker
          players={candidates(game.active.filter((id) => id !== first))}
          onPick={(target) => loser && first && finishResolve({ loser, firstResponder: first, malusTarget: target })}
        />
      </Modal>

      <Modal open={sheet === 'flash'} onClose={closeSheet} title="Flash !">
        <p className="mb-4 text-white/70">Le 1er qui a répondu arrête le tour et donne les {plural(game.pot, 'carte')} à…</p>
        <PlayerPicker
          players={candidates(game.inTurn)}
          onPick={(id) => {
            onFlash(id)
            play('flash', sound)
            closeSheet()
          }}
        />
      </Modal>

      <Modal open={sheet === 'partial'} onClose={closeSheet} title="Qui cherche encore ?">
        <p className="mb-4 text-white/70">Sélectionnez les joueurs qui n’ont pas trouvé. Tout le monde remet une carte, mais seuls eux jouent la suite du tour.</p>
        <div className="grid grid-cols-2 gap-3">
          {candidates(game.inTurn).map((p: Player) => {
            const on = stillIn.includes(p.id)
            return (
              <button
                key={p.id}
                aria-pressed={on}
                onClick={() => setStillIn((s) => (on ? s.filter((x) => x !== p.id) : [...s, p.id]))}
                className={`flex min-h-14 items-center gap-2 rounded-2xl px-4 text-left text-lg font-bold ring-2 transition ${on ? 'bg-momo-yellow text-navy ring-momo-yellow' : 'bg-white/10 ring-white/10'}`}
              >
                {on ? <Check className="h-5 w-5" /> : <span className="h-5 w-5 rounded-full" style={{ background: p.color }} />}
                <span className="truncate">{p.name}</span>
              </button>
            )
          })}
        </div>
        <Button
          big
          className="mt-4 w-full"
          disabled={stillIn.length < 2 || stillIn.length >= game.inTurn.length}
          onClick={() => {
            onRelaunch(stillIn)
            closeSheet()
          }}
        >
          Nouvelles cartes
        </Button>
        <p className="mt-2 text-center text-xs text-white/50">Au moins 2 joueurs qui cherchent encore, et au moins 1 qui a trouvé.</p>
      </Modal>
    </div>
  )
}

function RoundEnd({ game }: { game: ClassicGame }) {
  const last = game.lastRound!
  const ranked = [...game.players]
    .filter((p) => last.collected[p.id] !== undefined && (game.active.includes(p.id) || p.id === last.eliminated))
    .sort((a, b) => last.collected[a.id] - last.collected[b.id])
  let headline: string
  if (game.mode === 'survival') {
    if (last.suddenDeath) headline = `Égalité entre ${last.suddenDeath.map((id) => playerName(game.players, id)).join(' et ')} !`
    else if (last.eliminated) headline = `${playerName(game.players, last.eliminated)} est éliminé·e !`
    else headline = 'Fin de manche'
  } else if (last.winners.length === 0) headline = 'Égalité : personne ne marque'
  else if (game.mode === 'team') headline = `${TEAM_NAMES[last.winners[0] === 'team0' ? 0 : 1]} gagne la manche !`
  else headline = `${last.winners.map((id) => playerName(game.players, id)).join(' & ')} gagne${last.winners.length > 1 ? 'nt' : ''} la manche !`

  return (
    <motion.section initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="mx-auto flex w-full max-w-xl flex-col gap-4 text-center sm:gap-5" aria-label="Fin de manche">
      <p className="font-display text-xl text-white/60">{game.mode === 'survival' ? 'Fin de manche' : `Fin de la manche ${last.round}`}</p>
      <h2 className="font-display text-3xl leading-tight text-momo-yellow sm:text-5xl" data-testid="round-headline">
        {headline}
      </h2>
      {game.mode === 'team' && (
        <div className="grid grid-cols-2 gap-3">
          {([0, 1] as const).map((t) => (
            <div key={t} className="rounded-2xl p-3 text-navy" style={{ background: TEAM_COLORS[t] }}>
              <div className="font-display text-xl">{TEAM_NAMES[t]}</div>
              <div className="font-bold">{plural(teamScore(game, t), 'carte')}</div>
              <div className="text-sm font-semibold">{game.roundWins[`team${t}`]} / {ROUNDS_TO_WIN} manches</div>
            </div>
          ))}
        </div>
      )}
      <ol className="flex flex-col gap-2">
        {ranked.map((p) => (
          <li key={p.id} className={`flex items-center gap-3 rounded-2xl px-3 py-2 sm:px-4 sm:py-3 ${last.winners.includes(p.id) ? 'bg-momo-yellow text-navy' : p.id === last.eliminated ? 'bg-momo-red/80' : 'bg-white/8'}`}>
            <span className="h-5 w-5 shrink-0 rounded-full ring-2 ring-navy/40 sm:h-6 sm:w-6" style={{ background: p.color }} aria-hidden />
            <span className="min-w-0 flex-1 truncate text-left text-base font-bold sm:text-lg">{p.name}</span>
            <span className="shrink-0 text-sm font-semibold sm:text-base">{plural(last.collected[p.id], 'carte')}</span>
            {game.mode === 'classic' && <span className="w-10 shrink-0 text-right text-sm font-semibold sm:w-16">{game.roundWins[p.id]} / {ROUNDS_TO_WIN}</span>}
          </li>
        ))}
      </ol>
    </motion.section>
  )
}

function ClassicGameOver({ game, sound, onReplay, onHome }: Props) {
  let title: string
  let subtitle: string | undefined
  let rows: RankRow[]
  if (game.mode === 'team') {
    const team = game.winners[0] === 'team1' ? 1 : 0
    title = `${TEAM_NAMES[team]} gagne la partie !`
    subtitle = game.players.filter((p) => p.team === team).map((p) => p.name).join(', ') + ' : Rois du MOMO !'
    rows = ([0, 1] as const)
      .map((t) => ({ id: `team${t}`, name: TEAM_NAMES[t], color: TEAM_COLORS[t], value: `${game.roundWins[`team${t}`]} manches`, winner: t === team }))
      .sort((a, b) => Number(b.winner) - Number(a.winner))
  } else if (game.mode === 'survival') {
    const winner = game.winners[0]
    title = `${playerName(game.players, winner)} devient le Roi du MOMO !`
    subtitle = 'Dernier survivant !'
    const order = [winner, ...[...game.eliminated].reverse()]
    rows = order.map((id, i) => ({ id, name: playerName(game.players, id), color: game.players.find((p) => p.id === id)!.color, value: i === 0 ? 'Vainqueur' : `Éliminé·e ${i === 1 ? 'en finale' : ''}`.trim(), winner: i === 0 }))
  } else {
    const winner = game.winners[0]
    title = `${playerName(game.players, winner)} devient le Roi du MOMO !`
    rows = [...game.players]
      .sort((a, b) => (game.roundWins[b.id] ?? 0) - (game.roundWins[a.id] ?? 0))
      .map((p) => ({ id: p.id, name: p.name, color: p.color, value: plural(game.roundWins[p.id] ?? 0, 'manche'), winner: p.id === winner }))
  }
  return <GameOver title={title} subtitle={subtitle} rows={rows} sound={sound} onReplay={onReplay} onHome={onHome} />
}
