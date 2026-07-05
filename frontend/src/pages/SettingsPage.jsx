import { useState } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../components/layout/DashboardLayout'
import Card from '../components/ui/Card'
import useAuth from '../hooks/useAuth'

export default function SettingsPage() {
  const { user } = useAuth()
  
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    showContactInfo: false,
    darkMode: true
  })

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
    setSaved(false)
  }

  const handleSave = () => {
    setSaving(true)
    // Simulate API call
    setTimeout(() => {
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }, 800)
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage your account preferences and application settings.</p>
        </div>

        <div className="space-y-6">
          {/* Notifications Section */}
          <Card padding="lg" className="border-white/8">
            <h2 className="text-lg font-semibold text-white mb-4">Notifications</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-200">Email Notifications</p>
                  <p className="text-xs text-zinc-500">Receive match alerts and messages via email.</p>
                </div>
                <button
                  onClick={() => handleToggle('emailNotifications')}
                  className={`w-11 h-6 rounded-full transition-colors relative ${settings.emailNotifications ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div>
                  <p className="text-sm font-medium text-zinc-200">Push Notifications</p>
                  <p className="text-xs text-zinc-500">Get instant alerts on your device.</p>
                </div>
                <button
                  onClick={() => handleToggle('pushNotifications')}
                  className={`w-11 h-6 rounded-full transition-colors relative ${settings.pushNotifications ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </Card>

          {/* Privacy Section */}
          <Card padding="lg" className="border-white/8">
            <h2 className="text-lg font-semibold text-white mb-4">Privacy & Security</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-200">Show Contact Info</p>
                  <p className="text-xs text-zinc-500">Allow others to see your phone number before a match is verified.</p>
                </div>
                <button
                  onClick={() => handleToggle('showContactInfo')}
                  className={`w-11 h-6 rounded-full transition-colors relative ${settings.showContactInfo ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${settings.showContactInfo ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </Card>

          {/* Appearance Section */}
          <Card padding="lg" className="border-white/8">
            <h2 className="text-lg font-semibold text-white mb-4">Appearance</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-200">Dark Mode</p>
                  <p className="text-xs text-zinc-500">Toggle between light and dark themes (currently fixed to dark).</p>
                </div>
                <button
                  disabled
                  className="w-11 h-6 rounded-full bg-emerald-500 opacity-50 cursor-not-allowed relative"
                >
                  <div className="w-4 h-4 bg-white rounded-full absolute top-1 translate-x-6" />
                </button>
              </div>
            </div>
          </Card>

          <div className="flex items-center justify-end gap-4 pt-2">
            {saved && <span className="text-emerald-400 text-sm font-medium">Settings saved!</span>}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
