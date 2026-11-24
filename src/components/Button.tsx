import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-momo-yellow text-navy shadow-[0_5px_0_#c98f00] hover:brightness-105 active:translate-y-1 active:shadow-[0_1px_0_#c98f00]',
  secondary: 'bg-white/12 text-white ring-1 ring-white/20 hover:bg-white/20 active:translate-y-0.5',
  danger: 'bg-momo-red text-white shadow-[0_5px_0_#a3173a] hover:brightness-110 active:translate-y-1 active:shadow-[0_1px_0_#a3173a]',
  success: 'bg-emerald-500 text-white shadow-[0_5px_0_#047857] hover:brightness-110 active:translate-y-1 active:shadow-[0_1px_0_#047857]',
  ghost: 'text-white/80 hover:bg-white/10 hover:text-white',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  icon?: ReactNode
  kbd?: string
  big?: boolean
}

export function Button({ variant = 'primary', icon, kbd, big, className = '', children, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={`inline-flex select-none items-center justify-center gap-2 rounded-2xl font-bold transition disabled:opacity-40 disabled:shadow-none ${
        big ? 'min-h-16 px-6 text-lg sm:text-xl' : 'min-h-12 px-3 text-sm sm:px-4 sm:text-base'
      } ${VARIANTS[variant]} ${className}`}
    >
      {icon}
      <span>{children}</span>
      {kbd && (
        <kbd className="ml-1 hidden rounded-md bg-black/15 px-1.5 py-0.5 font-sans text-xs font-semibold lg:inline">{kbd}</kbd>
      )}
    </button>
  )
}
