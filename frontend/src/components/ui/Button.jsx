import { motion } from 'framer-motion'


export default function Button({
  children, variant = 'primary', size = 'md',
  className = '', fullWidth = false, disabled = false,
  type = 'button', loading = false, onClick, ...props
}) {
  let variantClass = ''
  switch (variant) {
    case 'primary': variantClass = 'bg-white text-black hover:bg-zinc-100 border border-white'; break;
    case 'ghost':   variantClass = 'bg-transparent text-zinc-300 hover:text-white hover:bg-white/5 border border-white/10 hover:border-white/20'; break;
    case 'outline': variantClass = 'bg-transparent text-white hover:bg-white/5 border border-white/20 hover:border-white/40'; break;
    default:        variantClass = 'bg-white text-black hover:bg-zinc-100 border border-white';
  }

  let sizeClass = ''
  switch (size) {
    case 'sm': sizeClass = 'px-5 py-2.5 text-sm'; break;
    case 'md': sizeClass = 'px-6 py-3 text-base'; break;
    case 'lg': sizeClass = 'px-8 py-4 text-lg'; break;
    case 'xl': sizeClass = 'px-10 py-5 text-xl tracking-tight'; break;
    default:   sizeClass = 'px-6 py-3 text-base';
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={disabled || loading ? {} : { scale: 1.02 }}
      whileTap={disabled || loading ? {} : { scale: 0.98 }}
      className={[
        'inline-flex items-center justify-center gap-2.5 rounded-xl font-semibold',
        'transition-all duration-200 ease-out cursor-pointer select-none',
        variantClass,
        sizeClass,
        fullWidth ? 'w-full' : '',
        disabled || loading ? 'opacity-40 cursor-not-allowed pointer-events-none' : '',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {loading && (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </motion.button>
  )
}
