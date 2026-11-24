import { motion } from 'framer-motion'
import { ArrowDownUp, Ban, CheckCircle2, Sparkles, Tags, Zap } from 'lucide-react'
import { isFree, resolveConstraints } from '../game/constraints'
import type { ReactNode } from 'react'
import type { Card } from '../game/types'

interface Props {
  cards: Card[]
  title?: string
  /** Texte du bandeau Flash (la carte n'a pas le même effet selon le mode) */
  flashText?: string
}

function Chip({ children, className }: { children: ReactNode; className: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-display text-xl leading-none shadow sm:rounded-xl sm:px-3 sm:text-3xl ${className}`}>
      {children}
    </span>
  )
}

/** Résumé lisible à distance des contraintes actives du tour. */
export function ConstraintsPanel({ cards, title, flashText = 'FLASH ! Le 1er qui répond arrête le tour et donne les cartes à qui il veut.' }: Props) {
  const c = resolveConstraints(cards)
  const required = Object.entries(c.required)
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="w-full rounded-2xl bg-white/8 p-3 ring-1 ring-white/10 backdrop-blur sm:rounded-3xl sm:p-5"
      aria-label={title ?? 'Contraintes du tour'}
      data-testid="constraints"
    >
      {title && <h3 className="mb-2 font-display text-lg tracking-wide text-momo-yellow sm:mb-3 sm:text-xl">{title}</h3>}
      {c.flash && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-momo-yellow px-3 py-2 text-sm font-bold text-navy sm:rounded-2xl sm:text-base">
          <Zap className="h-5 w-5 shrink-0 fill-navy" />
          <span>{flashText}</span>
        </div>
      )}
      <ul className="flex flex-col gap-2.5 text-[15px] sm:gap-3 sm:text-lg">
        {required.length > 0 && (
          <li className="flex flex-wrap items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-momo-blue-light" aria-hidden />
            <span className="mr-1 font-semibold">Doit contenir</span>
            {required.map(([l, n]) => (
              <Chip key={l} className="bg-momo-blue">
                {l}
                {n > 1 && <span className="text-base">×{n}</span>}
              </Chip>
            ))}
          </li>
        )}
        {c.forbidden.length > 0 && (
          <li className="flex flex-wrap items-center gap-2">
            <Ban className="h-5 w-5 text-momo-red-light" aria-hidden />
            <span className="mr-1 font-semibold">Interdit</span>
            {c.forbidden.map((l) => (
              <Chip key={l} className="bg-momo-red">
                {l}
              </Chip>
            ))}
          </li>
        )}
        {c.themes.length > 0 && (
          <li className="flex flex-wrap items-center gap-2">
            <Tags className="h-5 w-5 text-momo-yellow" aria-hidden />
            <span className="mr-1 font-semibold">{c.themes.length > 1 ? 'Un des thèmes' : 'Thème'}</span>
            {c.themes.map((t, i) => (
              <span key={t.theme} className="flex items-center gap-2">
                {i > 0 && <span className="text-sm font-bold uppercase text-white/60">ou</span>}
                <span className="rounded-lg bg-momo-yellow px-2.5 py-1 text-base font-bold leading-tight text-momo-brown shadow sm:rounded-xl sm:px-3 sm:text-xl">
                  {t.emoji} {t.theme}
                </span>
              </span>
            ))}
          </li>
        )}
        {c.english && (
          <li className="flex items-center gap-2 font-semibold">
            <span aria-hidden>🇬🇧</span> Dites votre mot avec l’accent anglais !
          </li>
        )}
        {c.inversionCount > 0 && (
          <li className="flex items-center gap-2 text-sm text-white/80 sm:text-base">
            <ArrowDownUp className="h-4 w-4" aria-hidden />
            {c.inverted
              ? 'Inversion : les bleues deviennent interdites, les rouges obligatoires.'
              : `${c.inversionCount} inversions = pas d’inversion.`}
          </li>
        )}
        {c.cancelled.length > 0 && (
          <li className="text-sm text-white/80 sm:text-base">
            Rouge + bleu sur la même lettre ({c.cancelled.join(', ')}) : les cartes s’annulent.
          </li>
        )}
        {isFree(c) && (
          <li className="flex items-center gap-2 font-semibold text-momo-yellow">
            <Sparkles className="h-5 w-5" aria-hidden /> Aucune contrainte de lettre ni de thème : n’importe quel mot !
          </li>
        )}
      </ul>
    </motion.section>
  )
}
