import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useAuth from '../../hooks/useAuth'

export default function DashboardTopBar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??'

  return (
    <motion.header
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
      className="h-16 flex items-center justify-between px-6 lg:px-8 border-b border-white/8 bg-[#0d0d0d] sticky top-0 z-30"
    >
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
              <circle cx="11" cy="11" r="7" /><path d="M16.5 16.5L21 21" strokeLinecap="round" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search reports, items..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/4 border border-white/8 rounded-lg text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-white/20 focus:bg-white/6 transition-all duration-200"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3 ml-6">
        <motion.button
          onClick={() => navigate('/dashboard/notifications')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-9 h-9 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/5 border border-transparent hover:border-white/8 transition-all duration-200 cursor-pointer"
          aria-label="Notifications"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4.5 h-4.5">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-white rounded-full" />
        </motion.button>

        <div className="w-px h-6 bg-white/8" />

        <div 
          onClick={() => navigate('/dashboard/profile')}
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-bold text-zinc-200 flex-shrink-0 overflow-hidden">
            {user?.profilePic ? (
              <img src={user.profilePic.startsWith('http') ? user.profilePic : `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${user.profilePic}`} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-zinc-200 leading-none">{user?.name ?? 'User'}</p>
            <p className="text-xs text-zinc-600 mt-0.5">{user?.department} · {user?.year}</p>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
