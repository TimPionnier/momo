import { PLAYER_LIMITS } from './classic'
import { buildDeck, drawCards } from './deck'
import { createRng } from './rng'
import type { Player, TranquilleGame } from './types'

/** Nombre de cartes Flash qui déclenchent la fin de la variante tranquille. */
export const FLASHES_TO_END = 2
export const CHRONO_SECONDS = 15

export function createTranquilleGame(players: Player[], seed: number): TranquilleGame {
  const { min, max } = PLAYER_LIMITS.tranquille
  if (players.length < min || players.length > max) throw new Error(`Ce mode se joue de ${min} à ${max} joueurs`)
  const rng = createRng(seed)
  return {
    mode: 'tranquille',
    players,
    current: 0,
    stack: [],
    collected: Object.fromEntries(players.map((p) => [p.id, 0])),
    flashCount: 0,
    lastTurn: false,
    phase: 'draw',
    turn: 1,
    winners: [],
    deck: buildDeck(rng),
    seed: Math.floor(rng() * 0xffffffff),
    lastEvent: null,
  }
}

export function currentPlayer(game: TranquilleGame): Player {
  return game.players[game.current]
}

/** Le joueur actif pioche une carte et l'ajoute à la pile commune. */
export function drawTranquille(game: TranquilleGame): TranquilleGame {
  if (game.phase !== 'draw') return game
  const rng = createRng(game.seed)
  const { cards, deck } = drawCards(game.deck, 1, rng)
  const card = cards[0]
  const flashCount = game.flashCount + (card.kind === 'flash' ? 1 : 0)
  return {
    ...game,
    deck,
    seed: Math.floor(rng() * 0xffffffff),
    stack: [...game.stack, card],
    flashCount,
    lastTurn: game.lastTurn || flashCount >= FLASHES_TO_END,
    phase: 'answer',
    lastEvent: null,
  }
}

function passTurn(game: TranquilleGame, event: string): TranquilleGame {
  const next = { ...game, current: (game.current + 1) % game.players.length, turn: game.turn + 1, lastEvent: event }
  if (game.lastTurn) {
    const min = Math.min(...game.players.map((p) => game.collected[p.id]))
    return { ...next, phase: 'gameOver', winners: game.players.filter((p) => game.collected[p.id] === min).map((p) => p.id) }
  }
  return { ...next, phase: 'draw' }
}

/** Le joueur a trouvé un mot : le tour passe au voisin de gauche, les cartes restent. */
export function succeedTranquille(game: TranquilleGame): TranquilleGame {
  if (game.phase !== 'answer') return game
  return passTurn(game, `${currentPlayer(game).name} a trouvé !`)
}

/** Le joueur faute ou sèche : il ramasse toute la pile, son voisin recommence de zéro. */
export function failTranquille(game: TranquilleGame): TranquilleGame {
  if (game.phase !== 'answer') return game
  return collect(game, currentPlayer(game).id)
}

/**
 * Chrono 15 s lancé par `launcherId` : si le joueur actif trouve à temps, c'est le lanceur qui ramasse,
 * sinon c'est le joueur actif.
 */
export function chronoTranquille(game: TranquilleGame, launcherId: string, found: boolean): TranquilleGame {
  if (game.phase !== 'answer') return game
  if (!game.players.some((p) => p.id === launcherId)) throw new Error('Joueur invalide')
  return collect(game, found ? launcherId : currentPlayer(game).id)
}

function collect(game: TranquilleGame, collectorId: string): TranquilleGame {
  const n = game.stack.length
  const collected = { ...game.collected, [collectorId]: game.collected[collectorId] + n }
  const name = game.players.find((p) => p.id === collectorId)!.name
  return passTurn({ ...game, collected, stack: [] }, `${name} ramasse ${n} carte${n > 1 ? 's' : ''}`)
}
