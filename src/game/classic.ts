import { buildDeck, drawCards } from './deck'
import { createRng, type Rng } from './rng'
import type { Card, CenterCard, ClassicGame, Player, RoundSummary } from './types'

export const ROUNDS_TO_WIN = 3

export const PLAYER_LIMITS = {
  classic: { min: 2, max: 6 },
  team: { min: 4, max: 6 },
  survival: { min: 4, max: 6 },
  tranquille: { min: 2, max: 8 },
} as const

export const TEAM_IDS = ['team0', 'team1'] as const

/** Configuration des piles selon le mode et le nombre de joueurs en lice. */
export function pileConfig(game: Pick<ClassicGame, 'mode' | 'active'>): { piles: number; size: number } {
  const n = game.active.length
  if (game.mode === 'survival') return n === 2 ? { piles: 2, size: 5 } : { piles: 1, size: 7 }
  if (game.mode === 'classic' && n === 2) return { piles: 2, size: 11 }
  return { piles: 1, size: 12 }
}

/** Avance la graine aléatoire stockée dans l'état (l'état reste sérialisable). */
function withRng<T extends { seed: number }>(state: T, fn: (rng: Rng) => T): T {
  const rng = createRng(state.seed)
  const next = fn(rng)
  return { ...next, seed: Math.floor(rng() * 0xffffffff) }
}

function participants(game: ClassicGame): string[] {
  return game.suddenDeath ?? game.active
}

export function cardsLeft(game: ClassicGame, playerId: string): number {
  return (game.piles[playerId] ?? []).reduce((s, p) => s + p.length, 0)
}

export function createClassicGame(mode: ClassicGame['mode'], players: Player[], seed: number): ClassicGame {
  const limits = PLAYER_LIMITS[mode]
  if (players.length < limits.min || players.length > limits.max) {
    throw new Error(`Ce mode se joue de ${limits.min} à ${limits.max} joueurs`)
  }
  if (mode === 'team' && players.length % 2 !== 0) throw new Error('Le mode équipe se joue à 4 ou 6 joueurs')
  const ids = players.map((p) => p.id)
  const base: ClassicGame = {
    mode,
    players,
    active: ids,
    eliminated: [],
    piles: {},
    collected: Object.fromEntries(ids.map((id) => [id, 0])),
    roundWins: mode === 'team' ? { team0: 0, team1: 0 } : Object.fromEntries(ids.map((id) => [id, 0])),
    round: 0,
    turn: 0,
    center: [],
    pot: 0,
    inTurn: ids,
    relaunches: 0,
    phase: 'ready',
    final: false,
    suddenDeath: null,
    lastRound: null,
    winners: [],
    deck: { drawPile: [], usedThemes: [], decksBuilt: 0 },
    seed,
  }
  return withRng(base, (rng) => dealRound({ ...base, deck: buildDeck(rng) }, rng))
}

function dealRound(game: ClassicGame, rng: Rng): ClassicGame {
  const { piles: pileCount, size } = pileConfig(game)
  let deck = game.deck
  const piles: Record<string, Card[][]> = {}
  for (const id of game.active) {
    piles[id] = []
    for (let p = 0; p < pileCount; p++) {
      const res = drawCards(deck, size, rng)
      deck = res.deck
      piles[id].push(res.cards)
    }
  }
  return {
    ...game,
    deck,
    piles,
    collected: Object.fromEntries(game.players.map((p) => [p.id, 0])),
    round: game.round + 1,
    turn: 0,
    center: [],
    pot: 0,
    inTurn: [...game.active],
    relaunches: 0,
    phase: 'ready',
    final: game.mode === 'survival' && game.active.length === 2,
    suddenDeath: null,
  }
}

/** Chaque joueur listé retourne la carte du dessus de chacune de ses piles non vides. */
function flip(game: ClassicGame, playerIds: string[]): { game: ClassicGame; flipped: CenterCard[] } {
  const piles = { ...game.piles }
  const flipped: CenterCard[] = []
  for (const id of playerIds) {
    const own = (piles[id] ?? []).map((pile, index) => {
      if (pile.length === 0) return pile
      flipped.push({ playerId: id, pile: index, card: pile[0] })
      return pile.slice(1)
    })
    piles[id] = own
  }
  return { game: { ...game, piles }, flipped }
}

/** Étape 1 : tous les joueurs retournent une carte en même temps. */
export function revealTurn(game: ClassicGame): ClassicGame {
  if (game.phase !== 'ready') return game
  const { game: g, flipped } = flip(game, participants(game))
  if (flipped.length === 0) return game
  return { ...g, center: flipped, pot: game.pot + flipped.length, phase: 'play', turn: game.turn + 1, inTurn: participants(game), relaunches: 0 }
}

/**
 * Personne ne trouve (stillIn = tous) ou plusieurs sèchent (stillIn = ceux qui cherchent encore) :
 * chacun ajoute une carte sur la sienne, on joue avec les nouvelles cartes, et seuls les joueurs
 * `stillIn` continuent de chercher. Retourne l'état inchangé (hormis inTurn) si plus personne n'a de carte.
 */
export function relaunchTurn(game: ClassicGame, stillIn?: string[]): ClassicGame {
  if (game.phase !== 'play') return game
  const remaining = stillIn && stillIn.length > 0 ? game.inTurn.filter((id) => stillIn.includes(id)) : game.inTurn
  const { game: g, flipped } = flip(game, game.inTurn)
  if (flipped.length === 0) return { ...game, inTurn: remaining }
  return { ...g, center: flipped, pot: game.pot + flipped.length, inTurn: remaining, relaunches: game.relaunches + 1 }
}

export function canRelaunch(game: ClassicGame): boolean {
  return game.phase === 'play' && game.inTurn.some((id) => cardsLeft(game, id) > 0)
}

export interface Resolution {
  /** Joueur qui ramasse les cartes du tour (le dernier à crier ou le premier qui se trompe) */
  loser: string
  /** Premier à avoir répondu : il donne en malus une de ses cartes ramassées */
  firstResponder?: string
  malusTarget?: string
}

/** Étape 3 : le perdant ramasse toutes les cartes du tour ; le premier à répondre peut donner un malus. */
export function resolveTurn(game: ClassicGame, r: Resolution): ClassicGame {
  if (game.phase !== 'play') return game
  if (!participants(game).includes(r.loser)) throw new Error('Joueur invalide')
  const collected = { ...game.collected }
  collected[r.loser] = (collected[r.loser] ?? 0) + game.pot
  if (
    !game.suddenDeath &&
    r.firstResponder &&
    r.malusTarget &&
    r.firstResponder !== r.malusTarget &&
    (collected[r.firstResponder] ?? 0) > 0
  ) {
    collected[r.firstResponder] -= 1
    collected[r.malusTarget] = (collected[r.malusTarget] ?? 0) + 1
  }
  return endTurn({ ...game, collected }, r.loser)
}

/** Carte Flash : le premier qui répond arrête le tour et donne les cartes en jeu à qui il veut. */
export function resolveFlash(game: ClassicGame, target: string): ClassicGame {
  if (game.phase !== 'play') return game
  if (!participants(game).includes(target)) throw new Error('Joueur invalide')
  const collected = { ...game.collected, [target]: (game.collected[target] ?? 0) + game.pot }
  return endTurn({ ...game, collected }, target)
}

function endTurn(game: ClassicGame, collector: string): ClassicGame {
  const cleared: ClassicGame = { ...game, pot: 0, center: [], relaunches: 0, phase: 'ready' }
  if (game.suddenDeath) return eliminate({ ...cleared, suddenDeath: null }, collector)
  const everyoneEmpty = cleared.active.every((id) => cardsLeft(cleared, id) === 0)
  if (everyoneEmpty) return endRound(cleared)
  return { ...cleared, inTurn: [...cleared.active] }
}

function eliminate(game: ClassicGame, loser: string): ClassicGame {
  const active = game.active.filter((id) => id !== loser)
  const eliminated = [...game.eliminated, loser]
  const lastRound: RoundSummary = {
    ...(game.lastRound ?? { round: game.round, collected: { ...game.collected }, winners: [] }),
    eliminated: loser,
    suddenDeath: undefined,
  }
  if (active.length === 1) {
    return { ...game, active, eliminated, inTurn: active, lastRound, winners: active, phase: 'gameOver' }
  }
  return { ...game, active, eliminated, inTurn: active, lastRound, phase: 'roundEnd' }
}

function minIds(ids: string[], score: (id: string) => number): string[] {
  const min = Math.min(...ids.map(score))
  return ids.filter((id) => score(id) === min)
}

function maxIds(ids: string[], score: (id: string) => number): string[] {
  const max = Math.max(...ids.map(score))
  return ids.filter((id) => score(id) === max)
}

export function teamScore(game: ClassicGame, team: 0 | 1): number {
  return game.players.filter((p) => p.team === team).reduce((s, p) => s + (game.collected[p.id] ?? 0), 0)
}

/** Fin de manche : toutes les piles sont vides. */
function endRound(game: ClassicGame): ClassicGame {
  const summary: RoundSummary = { round: game.round, collected: { ...game.collected }, winners: [] }
  const score = (id: string) => game.collected[id] ?? 0

  if (game.mode === 'survival') {
    if (game.final) {
      const best = minIds(game.active, score)
      if (best.length === 1) {
        return { ...game, lastRound: { ...summary, winners: best }, winners: best, phase: 'gameOver' }
      }
      return { ...game, lastRound: { ...summary, suddenDeath: best }, suddenDeath: null, phase: 'roundEnd' }
    }
    const worst = maxIds(game.active, score)
    if (worst.length === 1) return eliminate({ ...game, lastRound: summary }, worst[0])
    return { ...game, lastRound: { ...summary, suddenDeath: worst }, phase: 'roundEnd' }
  }

  let winners: string[]
  if (game.mode === 'team') {
    const s0 = teamScore(game, 0)
    const s1 = teamScore(game, 1)
    winners = s0 === s1 ? [] : [s0 < s1 ? 'team0' : 'team1']
  } else {
    winners = minIds(game.active, score)
  }
  const roundWins = { ...game.roundWins }
  for (const w of winners) roundWins[w] = (roundWins[w] ?? 0) + 1
  const leaders = maxIds(Object.keys(roundWins), (k) => roundWins[k])
  const gameOver = leaders.length === 1 && roundWins[leaders[0]] >= ROUNDS_TO_WIN
  return {
    ...game,
    roundWins,
    lastRound: { ...summary, winners },
    winners: gameOver ? leaders : [],
    phase: gameOver ? 'gameOver' : 'roundEnd',
  }
}

/** Passe à la manche suivante (ou lance la mort subite à 1 carte en cas d'égalité en mode survie). */
export function nextRound(game: ClassicGame): ClassicGame {
  if (game.phase !== 'roundEnd') return game
  const tied = game.lastRound?.suddenDeath
  if (tied && tied.length > 1) {
    return withRng(game, (rng) => {
      let deck = game.deck
      const piles: Record<string, Card[][]> = {}
      for (const id of game.active) piles[id] = [[]]
      for (const id of tied) {
        const res = drawCards(deck, 1, rng)
        deck = res.deck
        piles[id] = [res.cards]
      }
      return {
        ...game,
        deck,
        piles,
        suddenDeath: tied,
        inTurn: tied,
        center: [],
        pot: 0,
        phase: 'ready',
        lastRound: { ...game.lastRound!, suddenDeath: undefined },
      }
    })
  }
  return withRng(game, (rng) => dealRound(game, rng))
}

/** Regroupe les cartes du centre par "mot à trouver" (2 mots en mode 2 piles). */
export function centerGroups(game: ClassicGame): Card[][] {
  const pileCount = Math.max(1, ...game.center.map((c) => c.pile + 1))
  const groups: Card[][] = Array.from({ length: pileCount }, () => [])
  for (const c of game.center) groups[c.pile].push(c.card)
  return groups.filter((g) => g.length > 0)
}

/** Classement d'une partie classique : manches gagnées puis cartes ramassées. */
export function standings(game: ClassicGame): { id: string; wins: number; collected: number }[] {
  return game.players
    .map((p) => ({ id: p.id, wins: game.roundWins[p.id] ?? 0, collected: game.collected[p.id] ?? 0 }))
    .sort((a, b) => b.wins - a.wins || a.collected - b.collected)
}
