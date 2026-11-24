import { ALL_CARDS, getCard } from './cards'
import { shuffle, type Rng } from './rng'
import type { Card, DeckState } from './types'

/** Nombre de cartes thème glissées dans chaque paquet, pour garder un bon équilibre lettres / thèmes. */
export const THEMES_PER_DECK = 45

const NON_THEME_IDS = ALL_CARDS.filter((c) => c.kind !== 'theme').map((c) => c.id)
const THEME_IDS = ALL_CARDS.filter((c) => c.kind === 'theme').map((c) => c.id)

/**
 * Constitue un paquet mélangé : toutes les cartes lettres / spéciales + une sélection de thèmes
 * pas encore utilisés dans la partie (on recycle seulement quand tous les thèmes sont passés).
 */
export function buildDeck(rng: Rng, usedThemes: readonly string[] = [], decksBuilt = 0): DeckState {
  let freshThemes = THEME_IDS.filter((id) => !usedThemes.includes(id))
  let used = [...usedThemes]
  if (freshThemes.length < THEMES_PER_DECK) {
    // Tous les thèmes (ou presque) ont été joués : on remet le compteur à zéro
    const keep = freshThemes
    used = []
    freshThemes = [...keep, ...shuffle(THEME_IDS.filter((id) => !keep.includes(id)), rng)]
  }
  const themes = shuffle(freshThemes, rng).slice(0, THEMES_PER_DECK)
  return {
    drawPile: shuffle([...NON_THEME_IDS, ...themes], rng),
    usedThemes: [...used, ...themes],
    decksBuilt: decksBuilt + 1,
  }
}

/**
 * Tire `count` cartes sans remise. Si le paquet est épuisé, un nouveau paquet est constitué.
 * Retourne les cartes et le nouvel état du paquet (fonction pure).
 */
export function drawCards(deck: DeckState, count: number, rng: Rng): { cards: Card[]; deck: DeckState } {
  let current = deck
  const cards: Card[] = []
  for (let i = 0; i < count; i++) {
    if (current.drawPile.length === 0) current = buildDeck(rng, current.usedThemes, current.decksBuilt)
    const [id, ...rest] = current.drawPile
    cards.push(getCard(id))
    current = { ...current, drawPile: rest }
  }
  return { cards, deck: current }
}
