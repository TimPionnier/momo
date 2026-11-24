import type { Card, ClassicGame, Player } from './types'

export function makePlayers(n: number, teams = false): Player[] {
  const names = ['Alice', 'Bob', 'Carl', 'Dina', 'Eve', 'Fred', 'Gus', 'Hana']
  return names.slice(0, n).map((name, i) => ({ id: `p${i + 1}`, name, color: '#fff', team: teams ? ((i % 2) as 0 | 1) : undefined }))
}

let n = 0
export const blue = (l: string): Card => ({ id: `t-blue-${l}-${++n}`, kind: 'blue', letter: l })
export const red = (l: string): Card => ({ id: `t-red-${l}-${++n}`, kind: 'red', letter: l })
export const flash = (): Card => ({ id: `t-flash-${++n}`, kind: 'flash' })

/** Remplace les piles de chaque joueur par `size` cartes bleues (contrôle total du scénario). */
export function setPiles(game: ClassicGame, size: number, piles = 1): ClassicGame {
  return {
    ...game,
    piles: Object.fromEntries(game.active.map((id) => [id, Array.from({ length: piles }, () => Array.from({ length: size }, () => blue('A')))])),
  }
}
