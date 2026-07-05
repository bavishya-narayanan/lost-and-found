import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/layout/Navbar'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay },
})
const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.5, delay },
})

const features = [
  {
    title: 'Smart Matching',
    description: 'AI-powered semantic matching surfaces the most relevant lost and found items instantly — no manual browsing required.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-6 h-6"><circle cx="11" cy="11" r="7" /><path d="M16.5 16.5L21 21" strokeLinecap="round" /><path d="M8.5 11l2 2 3.5-3.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  },
  {
    title: 'Instant Notifications',
    description: 'Real-time alerts notify you the moment a potential match for your lost item is reported on campus.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-6 h-6"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" /></svg>,
  },
  {
    title: 'Secure Recovery',
    description: 'Verified campus workflows ensure belongings are returned safely through authenticated handover processes.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-6 h-6"><path d="M12 2L4 6v6c0 5.25 3.5 10.16 8 11.36C16.5 22.16 20 17.25 20 12V6l-8-4z" /><path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080808]">
      <Navbar />

      {/* ── HERO ────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6">
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-[600px] h-[600px] rounded-full bg-white/[0.025] blur-[120px]" />
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }} />

        <div className="relative z-10 text-center max-w-4xl mx-auto pt-24 pb-12">
          <motion.div {...fadeIn(0.1)} className="mb-8">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/4 text-xs font-medium text-zinc-400 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
              AI-Powered Campus Platform
            </span>
          </motion.div>

          <motion.h1 {...fadeUp(0.2)} className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-[1.05] mb-4">
            Lost Something?
          </motion.h1>
          <motion.h2
            {...fadeUp(0.3)}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-8"
            style={{ background: 'linear-gradient(135deg,#fff 0%,#52525b 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
          >
            Find It Faster with AI
          </motion.h2>

          <motion.p {...fadeUp(0.4)} className="text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed mb-12">
            An intelligent campus lost and found platform helping students recover their belongings through smart matching.
          </motion.p>

          <motion.div {...fadeUp(0.5)} className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/register" className="inline-block">
              <Button variant="primary" size="lg">
                Get Started
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Button>
            </Link>
            <Link to="/login" className="inline-block">
              <Button variant="ghost" size="lg">Login</Button>
            </Link>
          </motion.div>

          <motion.div {...fadeIn(0.7)} className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
            {[['2,400+','Items matched'],['78%','Recovery rate'],['100%','Campus verified']].map(([v,l]) => (
              <div key={l} className="flex flex-col items-center gap-1">
                <span className="text-2xl font-bold text-white tracking-tight">{v}</span>
                <span className="text-xs text-zinc-600 uppercase tracking-widest">{l}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────── */}
      <section className="w-full flex flex-col items-center py-32 px-6 border-t border-white/6">
        <div className="max-w-6xl w-full flex flex-col items-center">
          
          {/* Section Heading */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.5 }}
            className="flex flex-col items-center text-center mb-24 w-full"
          >
            <p className="text-sm font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">Platform Features</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-snug">
              Everything you need to<br />
              <span className="text-zinc-400">find what matters</span>
            </h2>
          </motion.div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex"
              >
                <Card hover padding="lg" className="w-full flex flex-col group border-white/8 hover:border-white/16 transition-colors duration-300">
                  <div className="w-12 h-12 rounded-xl bg-white/6 border border-white/8 flex items-center justify-center text-zinc-300 mb-6 group-hover:bg-white/10 transition-colors">
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                  <p className="text-base text-zinc-400 leading-relaxed flex-1">{f.description}</p>
                  <div className="mt-8 flex items-center gap-1.5 text-sm font-medium text-zinc-500 group-hover:text-zinc-300 transition-colors">
                    <span>Learn more</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 group-hover:translate-x-1 transition-transform">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section className="w-full flex flex-col items-center py-40 px-6 border-t border-white/6">
        <div className="max-w-2xl w-full flex flex-col items-center text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="flex flex-col items-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-6">Ready to get started?</h2>
            <p className="text-lg text-zinc-400 mb-10 max-w-xl text-center">Join your campus community and never lose track of your belongings again.</p>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <Link to="/register" className="inline-flex">
                <Button variant="primary" size="lg">Create Free Account</Button>
              </Link>
              <Link to="/login" className="inline-flex">
                <Button variant="ghost" size="lg">Sign in</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer className="w-full border-t border-white/6 py-10 px-6">
        <div className="max-w-6xl mx-auto flex justify-center items-center">
          <p className="text-sm text-zinc-600 font-medium text-center">© {new Date().getFullYear()} Findit. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
