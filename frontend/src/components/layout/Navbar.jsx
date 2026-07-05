import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Logo from '../ui/Logo'
import Button from '../ui/Button'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setMobileOpen(false), [location])

  return (
    <>
      <motion.header
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={[
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-black/80 backdrop-blur-xl border-b border-white/8 shadow-[0_4px_32px_rgba(0,0,0,0.5)]'
            : 'bg-transparent',
        ].join(' ')}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
          <Logo size="md" />
          <div className="hidden sm:flex items-center gap-4">
            <Link to="/login" className="inline-block"><Button variant="ghost" size="md">Login</Button></Link>
            <Link to="/register" className="inline-block"><Button variant="primary" size="md">Get Started</Button></Link>
          </div>
          <button
            className="sm:hidden flex flex-col gap-1 p-2 rounded-lg hover:bg-white/5 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {[0,1,2].map(i => (
              <span key={i} className="block w-5 h-0.5 bg-zinc-300 rounded-full" />
            ))}
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden fixed top-16 inset-x-0 z-40 bg-black/95 backdrop-blur-xl border-b border-white/8 px-6 py-4 flex flex-col gap-3"
          >
            <Link to="/login" className="w-full"><Button variant="ghost" size="md" fullWidth>Login</Button></Link>
            <Link to="/register" className="w-full"><Button variant="primary" size="md" fullWidth>Get Started</Button></Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
