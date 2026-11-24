import { describe, expect, it } from 'vitest'
import { isFree, resolveConstraints, wordMatchesLetters } from './constraints'
import type { Card } from './types'

const blue = (l: string, n = 1): Card => ({ id: `b${l}${n}`, kind: 'blue', letter: l })
const red = (l: string): Card => ({ id: `r${l}`, kind: 'red', letter: l })
const theme = (t: string): Card => ({ id: `t${t}`, kind: 'theme', theme: t })
const inv = (n = 1): Card => ({ id: `inv${n}`, kind: 'inversion' })
const english: Card = { id: 'en', kind: 'english' }
const flash: Card = { id: 'fl', kind: 'flash' }

describe('resolveConstraints', () => {
  it('lettre bleue obligatoire et lettre rouge interdite', () => {
    const c = resolveConstraints([blue('F'), red('D')])
    expect(c.required).toEqual({ F: 1 })
    expect(c.forbidden).toEqual(['D'])
    expect(wordMatchesLetters('Fromage', c)).toBe(true)
    expect(wordMatchesLetters('Fondue', c)).toBe(false)
    expect(wordMatchesLetters('Tomate', c)).toBe(false)
  })

  it('les mêmes lettres bleues se cumulent (falafel)', () => {
    const c = resolveConstraints([blue('F', 1), blue('F', 2)])
    expect(c.required).toEqual({ F: 2 })
    expect(wordMatchesLetters('falafel', c)).toBe(true)
    expect(wordMatchesLetters('fromage', c)).toBe(false)
  })

  it('une lettre en rouge et en bleu : les deux cartes s’annulent', () => {
    const c = resolveConstraints([blue('D'), red('D')])
    expect(c.required).toEqual({})
    expect(c.forbidden).toEqual([])
    expect(c.cancelled).toEqual(['D'])
    expect(isFree(c)).toBe(true)
  })

  it('l’annulation se fait carte par carte', () => {
    const c = resolveConstraints([blue('E', 1), blue('E', 2), red('E')])
    expect(c.required).toEqual({ E: 1 })
  })

  it('inversion : les bleues deviennent interdites, les rouges obligatoires', () => {
    const c = resolveConstraints([blue('F'), red('D'), inv()])
    expect(c.inverted).toBe(true)
    expect(c.required).toEqual({ D: 1 })
    expect(c.forbidden).toEqual(['F'])
  })

  it('deux inversions = pas d’inversion', () => {
    const c = resolveConstraints([blue('F'), red('D'), inv(1), inv(2)])
    expect(c.inverted).toBe(false)
    expect(c.inversionCount).toBe(2)
    expect(c.required).toEqual({ F: 1 })
  })

  it('thèmes : liste des thèmes (en respecter un seul) sans doublon', () => {
    const c = resolveConstraints([theme('Métier'), theme('Animal'), theme('Métier')])
    expect(c.themes.map((t) => t.theme)).toEqual(['Métier', 'Animal'])
  })

  it('accent anglais et flash', () => {
    const c = resolveConstraints([english, flash])
    expect(c.english).toBe(true)
    expect(c.flash).toBe(true)
    expect(isFree(c)).toBe(true)
  })

  it('ignore les accents et ligatures pour vérifier les lettres', () => {
    const c = resolveConstraints([blue('E'), blue('O')])
    expect(wordMatchesLetters('Œuf', resolveConstraints([blue('O')]))).toBe(true)
    expect(wordMatchesLetters('Hérisson', c)).toBe(true)
  })
})
