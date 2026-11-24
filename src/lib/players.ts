import type { Player } from '../game/types'

export const PLAYER_COLORS = ['#ffc533', '#3eb0ee', '#f25a7d', '#5ee0a0', '#c79bff', '#ff9f43', '#7ee8fa', '#f8a5c2']
export const TEAM_COLORS = ['#3eb0ee', '#f25a7d'] as const
export const TEAM_NAMES = ['Équipe Bleue', 'Équipe Rouge'] as const

export function playerName(players: Player[], id: string): string {
  return players.find((p) => p.id === id)?.name ?? '?'
}

export function plural(n: number, word: string): string {
  return `${n} ${word}${n > 1 ? 's' : ''}`
}
