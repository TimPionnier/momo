import type { Card } from './types'

export interface Constraints {
  /** Lettres obligatoires avec leur nombre d'occurrences minimum (les bleues identiques se cumulent) */
  required: Record<string, number>
  /** Lettres interdites */
  forbidden: string[]
  /** Lettres neutralisées (présentes en rouge ET en bleu) */
  cancelled: string[]
  /** Thèmes : s'il y en a plusieurs, il suffit d'en respecter un */
  themes: { theme: string; emoji?: string }[]
  english: boolean
  flash: boolean
  inversionCount: number
  /** Vrai si un nombre impair d'inversions est en jeu (2 inversions = pas d'inversion) */
  inverted: boolean
}

/**
 * Calcule les contraintes effectives d'un ensemble de cartes posées, selon les règles MOMO :
 * - Inversion : bleues interdites, rouges obligatoires ; deux inversions s'annulent.
 * - Une même lettre en rouge et en bleu : les deux cartes s'annulent (paire par paire).
 * - Les mêmes lettres bleues se cumulent (ex : F + F → « falafel »).
 */
export function resolveConstraints(cards: readonly Card[]): Constraints {
  const inversionCount = cards.filter((c) => c.kind === 'inversion').length
  const inverted = inversionCount % 2 === 1

  const mustCount: Record<string, number> = {}
  const mustNotCount: Record<string, number> = {}
  for (const c of cards) {
    if ((c.kind === 'blue' || c.kind === 'red') && c.letter) {
      const isRequired = (c.kind === 'blue') !== inverted
      const target = isRequired ? mustCount : mustNotCount
      target[c.letter] = (target[c.letter] ?? 0) + 1
    }
  }

  const required: Record<string, number> = {}
  const forbidden: string[] = []
  const cancelled: string[] = []
  const letters = new Set([...Object.keys(mustCount), ...Object.keys(mustNotCount)])
  for (const l of [...letters].sort()) {
    const plus = mustCount[l] ?? 0
    const minus = mustNotCount[l] ?? 0
    if (plus > 0 && minus > 0) cancelled.push(l)
    const net = plus - minus
    if (net > 0) required[l] = net
    else if (net < 0) forbidden.push(l)
  }

  const themes: Constraints['themes'] = []
  for (const c of cards) {
    if (c.kind === 'theme' && c.theme && !themes.some((t) => t.theme === c.theme)) {
      themes.push({ theme: c.theme, emoji: c.emoji })
    }
  }

  return {
    required,
    forbidden,
    cancelled,
    themes,
    english: cards.some((c) => c.kind === 'english'),
    flash: cards.some((c) => c.kind === 'flash'),
    inversionCount,
    inverted,
  }
}

export function isFree(c: Constraints): boolean {
  return Object.keys(c.required).length === 0 && c.forbidden.length === 0 && c.themes.length === 0
}

function normalize(word: string): string {
  return word
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/Œ/g, 'OE')
    .replace(/Æ/g, 'AE')
}

/**
 * Vérifie les contraintes de lettres d'un mot (le thème et l'accent restent jugés à l'oral).
 * Utile pour les tests et pour un éventuel arbitrage ; l'app ne demande jamais de saisie.
 */
export function wordMatchesLetters(word: string, c: Constraints): boolean {
  const w = normalize(word)
  for (const [letter, count] of Object.entries(c.required)) {
    const n = w.split('').filter((ch) => ch === letter).length
    if (n < count) return false
  }
  return c.forbidden.every((l) => !w.includes(l))
}
