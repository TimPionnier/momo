export type CardKind = 'blue' | 'red' | 'theme' | 'english' | 'inversion' | 'flash'

export interface Card {
  id: string
  kind: CardKind
  /** Lettre (cartes bleues / rouges) */
  letter?: string
  /** Libellé du thème (cartes thème) */
  theme?: string
  emoji?: string
}

export type Mode = 'classic' | 'team' | 'survival' | 'tranquille'

export interface Player {
  id: string
  name: string
  color: string
  team?: 0 | 1
}

export interface DeckState {
  drawPile: string[]
  /** Thèmes déjà mis en jeu, pour les faire tourner d'un paquet à l'autre */
  usedThemes: string[]
  /** Nombre de paquets constitués (> 1 si le paquet a été épuisé et reconstitué) */
  decksBuilt: number
}

/** Une carte posée au centre, avec son propriétaire et sa pile d'origine */
export interface CenterCard {
  playerId: string
  pile: number
  card: Card
}

export type ClassicPhase = 'ready' | 'play' | 'roundEnd' | 'gameOver'

export interface RoundSummary {
  round: number
  collected: Record<string, number>
  /** Gagnant(s) de la manche (ids joueurs, ou 'team0'/'team1') */
  winners: string[]
  eliminated?: string
  /** Joueurs ex æquo devant passer en mort subite (mode survie) */
  suddenDeath?: string[]
}

export interface ClassicGame {
  mode: 'classic' | 'team' | 'survival'
  players: Player[]
  /** Joueurs encore en lice (mode survie) */
  active: string[]
  eliminated: string[]
  piles: Record<string, Card[][]>
  collected: Record<string, number>
  /** Manches gagnées par joueur (classique) ou par équipe ('team0'/'team1') */
  roundWins: Record<string, number>
  round: number
  turn: number
  center: CenterCard[]
  pot: number
  /** Joueurs qui cherchent encore pendant ce tour */
  inTurn: string[]
  /** Nombre de "relances" (personne n'a trouvé / plusieurs sèchent) dans le tour */
  relaunches: number
  phase: ClassicPhase
  final: boolean
  suddenDeath: string[] | null
  lastRound: RoundSummary | null
  winners: string[]
  deck: DeckState
  seed: number
}

export type TranquillePhase = 'draw' | 'answer' | 'gameOver'

export interface TranquilleGame {
  mode: 'tranquille'
  players: Player[]
  current: number
  stack: Card[]
  collected: Record<string, number>
  flashCount: number
  lastTurn: boolean
  phase: TranquillePhase
  turn: number
  winners: string[]
  deck: DeckState
  seed: number
  lastEvent: string | null
}

export type Game = ClassicGame | TranquilleGame

export interface Settings {
  sound: boolean
}
