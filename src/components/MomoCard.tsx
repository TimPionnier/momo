import { motion } from 'framer-motion'
import { ArrowDownUp, Zap } from 'lucide-react'
import type { Card } from '../game/types'

type Size = 'sm' | 'md' | 'lg'

const SIZES: Record<Size, string> = {
  sm: 'w-16 h-24 rounded-xl text-4xl',
  md: 'w-24 h-36 sm:w-28 sm:h-40 rounded-2xl text-6xl sm:text-7xl',
  lg: 'w-32 h-48 sm:w-40 sm:h-56 rounded-3xl text-8xl sm:text-9xl',
}

export function cardLabel(card: Card): string {
  switch (card.kind) {
    case 'blue':
      return `Lettre obligatoire ${card.letter}`
    case 'red':
      return `Lettre interdite ${card.letter}`
    case 'theme':
      return `Thème : ${card.theme}`
    case 'english':
      return 'Accent anglais'
    case 'inversion':
      return 'Inversion'
    case 'flash':
      return 'Flash'
  }
}

function UnionJack() {
  return (
    <svg viewBox="0 0 60 30" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="60" height="30" fill="#1f3a8a" />
      <path d="M0 0 60 30M60 0 0 30" stroke="#fff" strokeWidth="6" />
      <path d="M0 0 60 30M60 0 0 30" stroke="#e5345f" strokeWidth="2.5" />
      <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10" />
      <path d="M30 0v30M0 15h60" stroke="#e5345f" strokeWidth="6" />
    </svg>
  )
}

function Face({ card }: { card: Card }) {
  const corner = 'absolute text-[0.22em] font-display leading-none'
  switch (card.kind) {
    case 'blue':
    case 'red': {
      const grad =
        card.kind === 'blue'
          ? 'from-momo-blue to-momo-blue-light'
          : 'from-momo-red to-momo-red-light'
      return (
        <div className={`relative flex h-full w-full items-center justify-center bg-gradient-to-b ${grad}`}>
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-white/10" />
          <span className={`${corner} left-[8%] top-[6%]`}>{card.letter}</span>
          <span className={`${corner} bottom-[6%] right-[8%] rotate-180`}>{card.letter}</span>
          <span className="relative font-display drop-shadow-[0_3px_0_rgba(0,0,0,0.2)]">{card.letter}</span>
        </div>
      )
    }
    case 'theme':
      return (
        <div className="relative flex h-full w-full flex-col items-center justify-center bg-momo-yellow">
          <span className="text-[0.4em] leading-none" aria-hidden>
            {card.emoji}
          </span>
          <div className="mt-[8%] w-full -rotate-6 bg-momo-brown px-1 py-[6%] text-center">
            <span className="block font-display text-[0.19em] uppercase leading-tight text-white break-words hyphens-auto">
              {card.theme}
            </span>
          </div>
        </div>
      )
    case 'english':
      return (
        <div className="relative flex h-full w-full items-center justify-center">
          <UnionJack />
          <Zap className="absolute h-[30%] w-[30%] fill-momo-yellow text-momo-yellow drop-shadow" />
        </div>
      )
    case 'inversion':
      return (
        <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-b from-momo-red from-50% to-momo-blue to-50%">
          <ArrowDownUp className="h-[55%] w-[55%] text-white drop-shadow-lg" strokeWidth={2.5} />
        </div>
      )
    case 'flash':
      return (
        <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-momo-blue-light to-momo-blue">
          <Zap className="h-[65%] w-[65%] fill-momo-yellow text-amber-500 drop-shadow-lg" />
        </div>
      )
  }
}

export function CardBack({ size = 'md', className = '' }: { size?: Size; className?: string }) {
  return (
    <div className={`${SIZES[size]} card-back relative flex items-center justify-center overflow-hidden border-4 border-white shadow-xl ${className}`}>
      <span className="rounded-lg bg-navy px-2 py-1 font-display text-[0.25em] tracking-wide text-white">MOMO</span>
    </div>
  )
}

interface Props {
  card: Card
  size?: Size
  /** Anime un retournement à l'apparition */
  flip?: boolean
  delay?: number
  caption?: string
  captionColor?: string
}

export function MomoCard({ card, size = 'md', flip = true, delay = 0, caption, captionColor }: Props) {
  return (
    <figure className="flex flex-col items-center gap-2" aria-label={cardLabel(card)} data-testid="momo-card" data-kind={card.kind}>
      <div className="perspective">
        <motion.div
          className={`relative ${SIZES[size]}`}
          style={{ transformStyle: 'preserve-3d' }}
          initial={flip ? { rotateY: 180, scale: 0.85 } : false}
          animate={{ rotateY: 0, scale: 1 }}
          transition={{ duration: 0.55, delay, type: 'spring', stiffness: 160, damping: 16 }}
        >
          <div className={`backface-hidden absolute inset-0 overflow-hidden border-4 border-white text-white shadow-xl ${SIZES[size]}`}>
            <Face card={card} />
          </div>
          <div className="backface-hidden absolute inset-0" style={{ transform: 'rotateY(180deg)' }}>
            <CardBack size={size} />
          </div>
        </motion.div>
      </div>
      {caption && (
        <figcaption className="max-w-[8rem] truncate rounded-full px-2 py-0.5 text-xs font-semibold sm:text-sm" style={{ background: captionColor ?? 'rgba(255,255,255,.12)' }}>
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
