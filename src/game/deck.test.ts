import { describe, expect, it } from 'vitest'
import { ALL_CARDS } from './cards'
import { buildDeck, drawCards, THEMES_PER_DECK } from './deck'
import { createRng, shuffle } from './rng'

describe('rng', () => {
  it('est déterministe pour une même graine', () => {
    const a = createRng(42)
    const b = createRng(42)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it('mélange sans perdre ni dupliquer d’éléments', () => {
    const items = Array.from({ length: 50 }, (_, i) => i)
    const s = shuffle(items, createRng(1))
    expect(s).not.toEqual(items)
    expect([...s].sort((x, y) => x - y)).toEqual(items)
  })
})

describe('paquet', () => {
  it('ne contient aucun doublon', () => {
    const deck = buildDeck(createRng(7))
    expect(new Set(deck.drawPile).size).toBe(deck.drawPile.length)
    const themes = deck.drawPile.filter((id) => id.startsWith('theme-'))
    expect(themes).toHaveLength(THEMES_PER_DECK)
  })

  it('tire sans remise : jamais deux fois la même carte tant que le paquet n’est pas épuisé', () => {
    const rng = createRng(3)
    let deck = buildDeck(rng)
    const size = deck.drawPile.length
    const seen: string[] = []
    while (seen.length < size) {
      const res = drawCards(deck, 5, rng)
      deck = res.deck
      seen.push(...res.cards.map((c) => c.id))
    }
    expect(new Set(seen.slice(0, size)).size).toBe(size)
  })

  it('reconstitue un paquet avec de nouveaux thèmes quand il est épuisé', () => {
    const rng = createRng(9)
    const deck = buildDeck(rng)
    const firstThemes = deck.drawPile.filter((id) => id.startsWith('theme-'))
    const { deck: after } = drawCards(deck, deck.drawPile.length + 1, rng)
    expect(after.decksBuilt).toBe(2)
    const newThemes = after.drawPile.filter((id) => id.startsWith('theme-'))
    expect(newThemes.some((id) => firstThemes.includes(id))).toBe(false)
  })

  it('recycle les thèmes une fois qu’ils ont tous été joués', () => {
    const rng = createRng(11)
    const allThemes = ALL_CARDS.filter((c) => c.kind === 'theme').map((c) => c.id)
    const deck = buildDeck(rng, allThemes.slice(0, allThemes.length - 10), 3)
    expect(deck.drawPile.filter((id) => id.startsWith('theme-'))).toHaveLength(THEMES_PER_DECK)
    expect(deck.decksBuilt).toBe(4)
  })
})
