import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Logo from '../ui/Logo'
import useAuth from '../../hooks/useAuth'

const navItems = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
  },
  {
    label: 'Lost Reports',
    to: '/my-reports',
    icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><circle cx="11" cy="11" r="7" /><path d="M16.5 16.5L21 21" strokeLinecap="round" /><path d="M11 8v3M11 14h.01" strokeLinecap="round" /></svg>,
  },
  {
    label: 'Found Reports',
    to: '/my-reports#found',
    icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><circle cx="11" cy="11" r="7" /><path d="M16.5 16.5L21 21" strokeLinecap="round" /><path d="M8.5 11l2 2 3.5-3.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  },
  {
    label: 'Browse Items',
    to: '/dashboard/browse',
    icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" /></svg>,
  },
  {
    label: 'Matches',
    to: '/dashboard/matches',
    icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><circle cx="12" cy="12" r="10" /><path d="M8 12l2.5 2.5L16 9" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  },
  {
    label: 'Notifications',
    to: '/dashboard/notifications',
    icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" /></svg>,
  },
  {
    label: 'Settings',
    to: '/dashboard/settings',
    icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><circle cx="12" cy="12" r="3" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" /></svg>,
  },
]

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } } },
  item: { initial: { x: -12, opacity: 0 }, animate: { x: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } } },
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const isItemActive = (to) => {
    if (to === '/dashboard') return location.pathname === '/dashboard'
    
    const [path, hash] = to.split('#')
    if (hash) {
      return location.pathname === path && location.hash === `#${hash}`
    }
    
    if (path === '/my-reports') {
      return location.pathname === path && !location.hash
    }
    
    return location.pathname.startsWith(path)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??'

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-60 flex-shrink-0 h-screen sticky top-0 flex flex-col bg-[#0d0d0d] border-r border-white/8"
    >
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/8">
        <Logo size="md" linkTo="/dashboard" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto">
        <p className="px-3 mb-3 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Menu</p>
        <motion.ul variants={stagger.container} initial="initial" animate="animate" className="flex flex-col gap-0.5 list-none">
          {navItems.map((item) => {
            const isActive = isItemActive(item.to)
            return (
              <motion.li key={item.to} variants={stagger.item}>
                <Link
                  to={item.to}
                  className={[
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-white text-black'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5',
                  ].join(' ')}
                >
                  <span className={isActive ? 'text-black' : 'text-zinc-500'}>{item.icon}</span>{item.label}
                </Link>
              </motion.li>
            )
          })}
        </motion.ul>
      </nav>

      {/* User + Logout */}
      <div className="px-4 py-4 border-t border-white/8 space-y-3">
        <div 
          onClick={() => navigate('/dashboard/profile')}
          className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-bold text-zinc-200 flex-shrink-0 overflow-hidden">
            {user?.profilePic ? (
              <img src={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${user.profilePic}`} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-200 truncate">{user?.name ?? 'User'}</p>
            <p className="text-xs text-zinc-600 truncate">{user?.department} · {user?.year}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-all duration-150 cursor-pointer"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Logout
        </button>
      </div>
    </motion.aside>
  )
}
