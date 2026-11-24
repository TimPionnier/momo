import { describe, expect, it } from 'vitest'
import { ALL_CARDS, getCard, THEMES } from './cards'

describe('base de cartes', () => {
  it('contient au moins 150 cartes', () => {
    expect(ALL_CARDS.length).toBeGreaterThanOrEqual(150)
  })

  it('a des identifiants uniques', () => {
    const ids = ALL_CARDS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('a des thèmes sans doublon (insensible à la casse)', () => {
    const names = THEMES.map(([t]) => t.toLowerCase())
    expect(new Set(names).size).toBe(names.length)
    expect(names.length).toBeGreaterThanOrEqual(120)
  })

  it('contient tous les types de cartes du jeu', () => {
    const kinds = new Set(ALL_CARDS.map((c) => c.kind))
    expect([...kinds].sort()).toEqual(['blue', 'english', 'flash', 'inversion', 'red', 'theme'])
  })

  it('a des lettres valides et des doublons de lettres bleues pour le cumul', () => {
    for (const c of ALL_CARDS.filter((c) => c.kind === 'blue' || c.kind === 'red')) {
      expect(c.letter).toMatch(/^[A-Z]$/)
    }
    expect(ALL_CARDS.filter((c) => c.kind === 'blue' && c.letter === 'E')).toHaveLength(2)
  })

  it('retrouve une carte par id et rejette un id inconnu', () => {
    expect(getCard('red-D').letter).toBe('D')
    expect(() => getCard('nope')).toThrow()
  })
})
