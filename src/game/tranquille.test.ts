import { describe, expect, it } from 'vitest'
import { chronoTranquille, createTranquilleGame, drawTranquille, failTranquille, succeedTranquille } from './tranquille'
import { blue, flash, makePlayers } from './testUtils'
import type { TranquilleGame } from './types'

function withNext(g: TranquilleGame, ...ids: string[]): TranquilleGame {
  return { ...g, deck: { ...g.deck, drawPile: [...ids, ...g.deck.drawPile] } }
}

describe('variante tranquille', () => {
  it('le joueur pioche une carte qui s’ajoute à la pile commune', () => {
    const g = drawTranquille(createTranquilleGame(makePlayers(3), 1))
    expect(g.stack).toHaveLength(1)
    expect(g.phase).toBe('answer')
  })

  it('réussite : le tour passe au voisin de gauche, les cartes s’accumulent', () => {
    let g = createTranquilleGame(makePlayers(3), 2)
    g = withNext(g, 'blue-F-1', 'red-D')
    g = succeedTranquille(drawTranquille(g))
    expect(g.current).toBe(1)
    expect(g.phase).toBe('draw')
    g = drawTranquille(g)
    expect(g.stack.map((c) => c.id)).toEqual(['blue-F-1', 'red-D'])
  })

  it('échec : le joueur ramasse la pile et son voisin repart de zéro', () => {
    let g = createTranquilleGame(makePlayers(3), 3)
    g = succeedTranquille(drawTranquille(g))
    g = failTranquille(drawTranquille(g))
    expect(g.collected).toEqual({ p1: 0, p2: 2, p3: 0 })
    expect(g.stack).toEqual([])
    expect(g.current).toBe(2)
  })

  it('le tour revient au premier joueur après le dernier', () => {
    let g = createTranquilleGame(makePlayers(2), 4)
    g = succeedTranquille(drawTranquille(g))
    g = succeedTranquille(drawTranquille(g))
    expect(g.current).toBe(0)
  })

  it('chrono : si le joueur trouve, le lanceur ramasse ; sinon le joueur ramasse', () => {
    let g = drawTranquille(createTranquilleGame(makePlayers(3), 5))
    g = chronoTranquille(g, 'p3', true)
    expect(g.collected.p3).toBe(1)
    g = drawTranquille(g) // p2
    g = chronoTranquille(g, 'p1', false)
    expect(g.collected.p2).toBe(1)
    expect(() => chronoTranquille(drawTranquille(g), 'zz', true)).toThrow()
  })

  it('la partie s’arrête après le tour où la 2ᵉ carte Flash est piochée', () => {
    let g = createTranquilleGame(makePlayers(3), 6)
    g = withNext(g, 'flash-1', 'blue-A-1', 'flash-2')
    g = succeedTranquille(drawTranquille(g))
    expect(g.flashCount).toBe(1)
    g = failTranquille(drawTranquille(g)) // p2 ramasse 2
    g = drawTranquille(g)
    expect(g.flashCount).toBe(2)
    expect(g.lastTurn).toBe(true)
    expect(g.phase).toBe('answer')
    g = failTranquille(g) // p3 ramasse 1
    expect(g.phase).toBe('gameOver')
    expect(g.winners).toEqual(['p1'])
  })

  it('égalité finale : plusieurs gagnants', () => {
    let g = createTranquilleGame(makePlayers(2), 7)
    g = { ...g, stack: [blue('A'), flash()], flashCount: 2, lastTurn: true, phase: 'answer' }
    g = succeedTranquille(g)
    expect(g.winners).toEqual(['p1', 'p2'])
  })

  it('refuse un nombre de joueurs invalide et ignore les actions hors phase', () => {
    expect(() => createTranquilleGame(makePlayers(1), 1)).toThrow()
    const g = createTranquilleGame(makePlayers(2), 1)
    expect(succeedTranquille(g)).toBe(g)
    expect(failTranquille(g)).toBe(g)
  })
})
