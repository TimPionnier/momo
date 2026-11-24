import { describe, expect, it } from 'vitest'
import {
  canRelaunch,
  cardsLeft,
  centerGroups,
  createClassicGame,
  nextRound,
  pileConfig,
  relaunchTurn,
  resolveFlash,
  resolveTurn,
  revealTurn,
  standings,
  teamScore,
} from './classic'
import { makePlayers, setPiles } from './testUtils'
import type { ClassicGame } from './types'

/** Joue un tour complet : retournement puis `loser` ramasse. */
function playTurn(g: ClassicGame, loser: string, extra: Partial<Parameters<typeof resolveTurn>[1]> = {}): ClassicGame {
  return resolveTurn(revealTurn(g), { loser, ...extra })
}

/** Joue toute une manche où `loser` ramasse à chaque tour. */
function playRound(g: ClassicGame, loser: string): ClassicGame {
  let s = g
  while (s.phase === 'ready' && !s.suddenDeath) s = playTurn(s, loser)
  return s
}

describe('mise en place', () => {
  it('règle officielle : une pile de 12 cartes par joueur, toutes différentes', () => {
    const g = createClassicGame('classic', makePlayers(4), 1)
    expect(pileConfig(g)).toEqual({ piles: 1, size: 12 })
    for (const p of g.players) expect(cardsLeft(g, p.id)).toBe(12)
    const ids = Object.values(g.piles).flat(2).map((c) => c.id)
    expect(new Set(ids).size).toBe(48)
    expect(g.phase).toBe('ready')
    expect(g.round).toBe(1)
  })

  it('mode 2 joueurs : 2 piles de 11 cartes', () => {
    const g = createClassicGame('classic', makePlayers(2), 1)
    expect(g.piles.p1).toHaveLength(2)
    expect(g.piles.p1[0]).toHaveLength(11)
    expect(cardsLeft(g, 'p1')).toBe(22)
  })

  it('mode survie : 7 cartes par joueur', () => {
    const g = createClassicGame('survival', makePlayers(4), 1)
    expect(cardsLeft(g, 'p1')).toBe(7)
  })

  it('refuse un nombre de joueurs invalide', () => {
    expect(() => createClassicGame('classic', makePlayers(7), 1)).toThrow()
    expect(() => createClassicGame('survival', makePlayers(3), 1)).toThrow()
    expect(() => createClassicGame('team', makePlayers(5, true), 1)).toThrow()
  })
})

describe('déroulement d’un tour', () => {
  it('tous les joueurs retournent une carte en même temps', () => {
    const g = revealTurn(createClassicGame('classic', makePlayers(3), 2))
    expect(g.phase).toBe('play')
    expect(g.center).toHaveLength(3)
    expect(g.pot).toBe(3)
    expect(g.turn).toBe(1)
    expect(cardsLeft(g, 'p1')).toBe(11)
  })

  it('à 2 joueurs, 2 cartes chacun et 2 groupes de contraintes (2 mots)', () => {
    const g = revealTurn(createClassicGame('classic', makePlayers(2), 2))
    expect(g.center).toHaveLength(4)
    expect(centerGroups(g)).toHaveLength(2)
    expect(centerGroups(g)[0]).toHaveLength(2)
  })

  it('le perdant ramasse toutes les cartes du tour', () => {
    const g = playTurn(createClassicGame('classic', makePlayers(3), 3), 'p2')
    expect(g.collected).toEqual({ p1: 0, p2: 3, p3: 0 })
    expect(g.phase).toBe('ready')
    expect(g.pot).toBe(0)
    expect(g.center).toEqual([])
  })

  it('le premier à répondre donne une de ses cartes ramassées en malus', () => {
    let g = playTurn(createClassicGame('classic', makePlayers(3), 4), 'p1') // p1 : 3
    g = playTurn(g, 'p2', { firstResponder: 'p1', malusTarget: 'p3' })
    expect(g.collected).toEqual({ p1: 2, p2: 3, p3: 1 })
  })

  it('pas de malus si le premier à répondre n’a aucune carte', () => {
    const g = playTurn(createClassicGame('classic', makePlayers(3), 4), 'p2', { firstResponder: 'p1', malusTarget: 'p3' })
    expect(g.collected).toEqual({ p1: 0, p2: 3, p3: 0 })
  })

  it('carte Flash : les cartes en jeu sont données à qui le premier veut', () => {
    const g = resolveFlash(revealTurn(createClassicGame('classic', makePlayers(3), 5)), 'p3')
    expect(g.collected.p3).toBe(3)
  })

  it('personne ne trouve : chacun ajoute une carte, le perdant ramasse tout', () => {
    let g = revealTurn(createClassicGame('classic', makePlayers(3), 6))
    g = relaunchTurn(g)
    expect(g.pot).toBe(6)
    expect(g.center).toHaveLength(3)
    expect(g.relaunches).toBe(1)
    expect(cardsLeft(g, 'p1')).toBe(10)
    g = resolveTurn(g, { loser: 'p1' })
    expect(g.collected.p1).toBe(6)
  })

  it('plusieurs sèchent : tout le monde remet une carte, seuls ceux qui cherchent continuent', () => {
    let g = revealTurn(createClassicGame('classic', makePlayers(4), 7))
    g = relaunchTurn(g, ['p2', 'p4'])
    expect(g.pot).toBe(8)
    expect(g.inTurn).toEqual(['p2', 'p4'])
    // relance suivante : seuls les joueurs encore en lice retournent une carte
    g = relaunchTurn(g)
    expect(g.pot).toBe(10)
    expect(cardsLeft(g, 'p1')).toBe(10)
    expect(cardsLeft(g, 'p2')).toBe(9)
    g = resolveTurn(g, { loser: 'p4' })
    expect(g.collected.p4).toBe(10)
    expect(g.inTurn).toEqual(['p1', 'p2', 'p3', 'p4'])
  })

  it('ne peut plus relancer quand les piles sont vides', () => {
    let g = setPiles(createClassicGame('classic', makePlayers(3), 8), 1)
    g = revealTurn(g)
    expect(canRelaunch(g)).toBe(false)
    expect(relaunchTurn(g).pot).toBe(3)
  })

  it('ignore les actions hors phase et les joueurs invalides', () => {
    const g = createClassicGame('classic', makePlayers(3), 9)
    expect(resolveTurn(g, { loser: 'p1' })).toBe(g)
    expect(() => resolveTurn(revealTurn(g), { loser: 'zz' })).toThrow()
  })
})

describe('fin de manche et victoire', () => {
  it('quand les piles sont vides, le joueur avec le moins de cartes gagne la manche', () => {
    let g = setPiles(createClassicGame('classic', makePlayers(3), 10), 2)
    g = playTurn(g, 'p1')
    g = playTurn(g, 'p2')
    expect(g.phase).toBe('roundEnd')
    expect(g.lastRound?.winners).toEqual(['p3'])
    expect(g.roundWins).toEqual({ p1: 0, p2: 0, p3: 1 })
  })

  it('le premier à 3 manches devient le Roi du MOMO', () => {
    let g = createClassicGame('classic', makePlayers(2), 11)
    for (let r = 1; r <= 3; r++) {
      g = playRound(g, 'p1')
      if (r < 3) {
        expect(g.phase).toBe('roundEnd')
        g = nextRound(g)
        expect(g.round).toBe(r + 1)
        expect(cardsLeft(g, 'p1')).toBe(22)
        expect(g.collected).toEqual({ p1: 0, p2: 0 })
      }
    }
    expect(g.phase).toBe('gameOver')
    expect(g.winners).toEqual(['p2'])
    expect(standings(g)[0]).toMatchObject({ id: 'p2', wins: 3 })
  })

  it('en cas d’égalité à 3 manches, la partie continue', () => {
    let g = setPiles(createClassicGame('classic', makePlayers(3), 12), 1)
    g = { ...g, roundWins: { p1: 0, p2: 2, p3: 2 } }
    g = playTurn(g, 'p1')
    expect(g.roundWins).toEqual({ p1: 0, p2: 3, p3: 3 })
    expect(g.phase).toBe('roundEnd')
  })

  it('mode équipe : les cartes se comptent par équipe', () => {
    let g = setPiles(createClassicGame('team', makePlayers(4, true), 13), 2)
    g = playTurn(g, 'p1') // équipe 0
    g = playTurn(g, 'p3') // équipe 0
    expect(teamScore(g, 0)).toBe(8)
    expect(teamScore(g, 1)).toBe(0)
    expect(g.lastRound?.winners).toEqual(['team1'])
    expect(g.roundWins).toEqual({ team0: 0, team1: 1 })
  })

  it('mode équipe : 3 manches gagnées → victoire de l’équipe', () => {
    let g = createClassicGame('team', makePlayers(4, true), 14)
    g = { ...g, roundWins: { team0: 2, team1: 1 } }
    g = setPiles(g, 1)
    g = playTurn(g, 'p2')
    expect(g.phase).toBe('gameOver')
    expect(g.winners).toEqual(['team0'])
  })
})

describe('mode survie', () => {
  it('élimine le joueur avec le plus de cartes, puis finale à 2 piles de 5', () => {
    let g = setPiles(createClassicGame('survival', makePlayers(4), 15), 1)
    g = playTurn(g, 'p3')
    expect(g.phase).toBe('roundEnd')
    expect(g.lastRound?.eliminated).toBe('p3')
    expect(g.active).toEqual(['p1', 'p2', 'p4'])
    g = nextRound(g)
    expect(cardsLeft(g, 'p1')).toBe(7)
    g = setPiles(g, 1)
    g = playTurn(g, 'p1')
    expect(g.eliminated).toEqual(['p3', 'p1'])
    g = nextRound(g)
    expect(g.final).toBe(true)
    expect(pileConfig(g)).toEqual({ piles: 2, size: 5 })
    expect(cardsLeft(g, 'p2')).toBe(10)
    g = playRound(g, 'p4')
    expect(g.phase).toBe('gameOver')
    expect(g.winners).toEqual(['p2'])
  })

  it('égalité : mort subite à 1 carte, celui qui ramasse est éliminé', () => {
    let g = setPiles(createClassicGame('survival', makePlayers(4), 16), 2)
    g = playTurn(g, 'p1')
    g = playTurn(g, 'p2')
    expect(g.phase).toBe('roundEnd')
    expect(g.lastRound?.suddenDeath).toEqual(['p1', 'p2'])
    g = nextRound(g)
    expect(g.suddenDeath).toEqual(['p1', 'p2'])
    expect(cardsLeft(g, 'p1')).toBe(1)
    expect(cardsLeft(g, 'p3')).toBe(0)
    g = revealTurn(g)
    expect(g.center).toHaveLength(2)
    expect(() => resolveTurn(g, { loser: 'p3' })).toThrow()
    g = resolveTurn(g, { loser: 'p2' })
    expect(g.eliminated).toEqual(['p2'])
    expect(g.phase).toBe('roundEnd')
    expect(g.suddenDeath).toBeNull()
  })

  it('égalité en finale : la mort subite désigne le vainqueur', () => {
    let g = createClassicGame('survival', makePlayers(4), 17)
    g = { ...g, active: ['p1', 'p2'], eliminated: ['p3', 'p4'] }
    g = nextRound({ ...g, phase: 'roundEnd' })
    expect(g.final).toBe(true)
    g = { ...setPiles(g, 1, 2), collected: { ...g.collected, p2: 4 } }
    g = playTurn(g, 'p1') // 4 cartes chacun : égalité
    expect(g.lastRound?.suddenDeath).toEqual(['p1', 'p2'])
    g = nextRound(g)
    g = resolveFlash(revealTurn(g), 'p1')
    expect(g.phase).toBe('gameOver')
    expect(g.winners).toEqual(['p2'])
  })
})
