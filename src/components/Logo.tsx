import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

export function Logo({ small }: { small?: boolean }) {
  return (
    <motion.div
      className={`flex items-center font-display leading-none text-white ${small ? 'text-3xl' : 'text-8xl sm:text-9xl'}`}
      initial={small ? false : { scale: 0.6, rotate: -6, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 12 }}
      aria-label="MOMO"
    >
      <span>m</span>
      <span className="relative inline-flex items-center justify-center">
        o
        <Zap className="absolute h-[0.38em] w-[0.38em] fill-momo-yellow text-momo-yellow" aria-hidden />
      </span>
      <span>m</span>
      <span className="relative inline-flex items-center justify-center">
        o
        <Zap className="absolute h-[0.38em] w-[0.38em] fill-momo-yellow text-momo-yellow" aria-hidden />
      </span>
    </motion.div>
  )
}
