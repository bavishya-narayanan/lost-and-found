import { motion } from 'framer-motion'

const padding = { sm: 'p-4', md: 'p-6', lg: 'p-8', none: '' }

export default function Card({ children, className = '', hover = false, padding: p = 'md', ...props }) {
  return (
    <motion.div
      whileHover={hover ? { y: -2, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' } : {}}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={[
        'rounded-xl bg-[#111111]',
        'border border-white/8',
        'shadow-[0_4px_24px_rgba(0,0,0,0.3)]',
        padding[p] ?? padding.md,
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </motion.div>
  )
}
