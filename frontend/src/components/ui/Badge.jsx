const variants = {
  default: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
  success: 'bg-emerald-950 text-emerald-400 border border-emerald-800/50',
  warning: 'bg-amber-950  text-amber-400  border border-amber-800/50',
  danger:  'bg-red-950    text-red-400    border border-red-800/50',
  info:    'bg-zinc-800   text-zinc-300   border border-zinc-700',
}

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={[
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium leading-none',
      variants[variant] ?? variants.default,
      className,
    ].join(' ')}>
      {children}
    </span>
  )
}
