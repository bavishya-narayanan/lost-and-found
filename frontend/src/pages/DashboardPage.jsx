import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import DashboardLayout from '../components/layout/DashboardLayout'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import useAuth from '../hooks/useAuth'
import { getMyLostItems, getMyFoundItems } from '../services/itemService'
import { getMyMatches } from '../services/matchService'
import { getNotifications } from '../services/notificationService'
import api from '../services/api'

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } },
  item: { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } },
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const firstName = user?.name?.split(' ')[0] ?? 'there'

  const [lostItems, setLostItems] = useState([])
  const [foundItems, setFoundItems] = useState([])
  const [matches, setMatches] = useState([])
  const [notifications, setNotifications] = useState([])
  const [recoveredCount, setRecoveredCount] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lostRes, foundRes, matchRes, notifRes] = await Promise.all([
          getMyLostItems(),
          getMyFoundItems(),
          getMyMatches(),
          getNotifications()
        ])
        setLostItems(lostRes)
        setFoundItems(foundRes)
        setMatches(matchRes)
        setNotifications(notifRes)
        // Count recovered items via notifications
        const recovered = notifRes.filter(n => n.type === 'RECOVERY_COMPLETED').length
        setRecoveredCount(recovered)
      } catch (err) {
        console.error('Failed to load dashboard data')
      }
    }
    fetchData()
  }, [])

  const statCards = [
    {
      label: 'Total Lost Reports',
      value: lostItems.length.toString(),
      sub: 'Items you reported lost',
      badge: { label: 'Active', variant: 'warning' },
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-5 h-5"><circle cx="11" cy="11" r="7" /><path d="M16.5 16.5L21 21" strokeLinecap="round" /><path d="M11 8v3M11 14h.01" strokeLinecap="round" /></svg>,
      path: '/my-reports'
    },
    {
      label: 'Total Found Reports',
      value: foundItems.length.toString(),
      sub: 'Items you reported found',
      badge: { label: 'Pending', variant: 'info' },
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-5 h-5"><circle cx="11" cy="11" r="7" /><path d="M16.5 16.5L21 21" strokeLinecap="round" /><path d="M8.5 11l2 2 3.5-3.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
      path: '/my-reports'
    },
    {
      label: 'Active Matches',
      value: matches.length.toString(),
      sub: 'Potential item matches',
      badge: { label: 'Ongoing', variant: 'success' },
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-5 h-5"><circle cx="12" cy="12" r="10" /><path d="M8 12l2.5 2.5L16 9" strokeLinecap="round" strokeLinejoin="round" /></svg>,
      path: '/dashboard/matches'
    },
    {
      label: 'Items Recovered',
      value: recoveredCount.toString(),
      sub: 'Successfully reclaimed items',
      badge: { label: 'Success', variant: 'success' },
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-5 h-5"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"/><path d="M8 12l2.5 2.5L16 9" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      path: '/dashboard/matches'
    },
    {
      label: 'Recent Notifications',
      value: notifications.filter(n => !n.readStatus).length.toString(),
      sub: 'Unread alerts',
      badge: { label: 'Updates', variant: 'default' },
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-5 h-5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" /></svg>,
      path: '#'
    },
  ]

  // Combine and sort recent activity
  const allReports = [...lostItems.map(i => ({...i, feedType: 'Report', badgeLabel: 'Lost', variant: 'warning'})), ...foundItems.map(i => ({...i, feedType: 'Report', badgeLabel: 'Found', variant: 'info'}))]
  const allNotifs = notifications.map(n => ({...n, feedType: 'Notification', badgeLabel: 'Alert', variant: 'success', createdAt: n.createdAt, title: n.title, category: 'System', status: n.readStatus ? 'Read' : 'Unread'}))
  const combined = [...allReports, ...allNotifs]
  
  combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  
  const recentActivity = combined.slice(0, 4).map(item => ({
    title: item.feedType === 'Report' ? `You reported an item: ${item.title}` : item.title,
    sub: item.feedType === 'Report' ? `Category: ${item.category} · Status: ${item.status}` : item.message || 'Check your notifications',
    time: new Date(item.createdAt).toLocaleDateString(),
    badge: { label: item.badgeLabel, variant: item.variant }
  }))

  return (
    <DashboardLayout>
      <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-8">

        {/* ── Welcome ── */}
        <motion.div variants={stagger.item} className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-2">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
              Welcome back, {firstName} 👋
            </h1>
            <p className="text-sm text-zinc-500">
              You have {notifications.filter(n => !n.readStatus).length} unread notifications and {matches.length} active matches.
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            {[
              { label: 'Report Lost', path: '/report-lost', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg> },
              { label: 'Report Found', path: '/report-found', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21" strokeLinecap="round"/></svg> },
            ].map(a => (
              <motion.button
                key={a.label}
                onClick={() => navigate(a.path)}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/4 border border-white/8 hover:bg-white/8 hover:border-white/16 transition-all text-sm text-zinc-300 hover:text-white cursor-pointer"
              >
                <span className="text-zinc-500">{a.icon}</span>
                <span className="font-medium hidden sm:block">{a.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ── Stat Cards ── */}
        <motion.div variants={stagger.item}>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {statCards.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.06, ease: 'easeOut' }}
                onClick={() => s.path && s.path !== '#' && navigate(s.path)}
                className={s.path !== '#' ? "cursor-pointer" : ""}
              >
                <Card hover padding="lg" className={`flex flex-col h-full border-white/8 hover:border-white/16 transition-colors duration-300 ${s.path !== '#' ? 'hover:bg-white/5' : ''}`}>
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-10 h-10 rounded-xl bg-white/6 border border-white/8 flex items-center justify-center text-zinc-400">{s.icon}</div>
                    <Badge variant={s.badge.variant}>{s.badge.label}</Badge>
                  </div>
                  <span className="text-4xl font-bold text-white tracking-tight">{s.value}</span>
                  <p className="text-sm font-medium text-zinc-300 mt-1 mb-1">{s.label}</p>
                  <p className="text-xs text-zinc-600 flex-1">{s.sub}</p>
                  <div className="mt-4 pt-4 border-t border-white/6">
                    <span className="text-xs text-zinc-600">{s.trend}</span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Recent Activity ── */}
        <motion.div variants={stagger.item}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">Recent Activity</h2>
              <p className="text-xs text-zinc-600 mt-0.5">Your latest reports, matches, and notifications</p>
            </div>
            <button className="text-xs text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer">View all →</button>
          </div>

          <Card padding="none" className="border-white/8 overflow-hidden">
            {recentActivity.length === 0 ? (
              <div className="p-8 text-center text-sm text-zinc-500">No recent activity found.</div>
            ) : recentActivity.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.06 }}
                className={[
                  'flex items-start gap-4 px-6 py-5',
                  'hover:bg-white/3 transition-colors cursor-pointer',
                  i < recentActivity.length - 1 ? 'border-b border-white/6' : '',
                ].join(' ')}
              >
                <div className="w-2 h-2 rounded-full bg-zinc-700 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm font-medium text-zinc-200 leading-snug">{item.title}</p>
                    <Badge variant={item.badge.variant}>{item.badge.label}</Badge>
                  </div>
                  <p className="text-xs text-zinc-600 mt-1">{item.sub}</p>
                </div>
                <span className="text-xs text-zinc-700 flex-shrink-0">{item.time}</span>
              </motion.div>
            ))}
          </Card>
        </motion.div>

        {/* ── Recovery Stats ── */}
        <motion.div variants={stagger.item}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">Recovery Overview</h2>
              <p className="text-xs text-zinc-600 mt-0.5">Track your active recovery sessions</p>
            </div>
            <button onClick={() => navigate('/dashboard/matches')} className="text-xs text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer">View Matches →</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Matches', value: matches.length, icon: '🔍', color: 'from-blue-950/40 to-indigo-950/40 border-blue-500/15' },
              { label: 'Items Recovered', value: recoveredCount, icon: '✅', color: 'from-emerald-950/40 to-teal-950/40 border-emerald-500/15' },
              { label: 'Success Rate', value: matches.length > 0 ? `${Math.round((recoveredCount / matches.length) * 100)}%` : '0%', icon: '📊', color: 'from-purple-950/40 to-violet-950/40 border-purple-500/15' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.07 }}>
                <div className={`bg-gradient-to-br ${s.color} border rounded-2xl p-5 flex items-center gap-4`}>
                  <div className="text-2xl">{s.icon}</div>
                  <div>
                    <p className="text-2xl font-bold text-white">{s.value}</p>
                    <p className="text-xs text-zinc-400">{s.label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </motion.div>
    </DashboardLayout>
  )
}
