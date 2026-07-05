import { useState } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../components/layout/DashboardLayout'
import Card from '../components/ui/Card'
import useAuth from '../hooks/useAuth'
import { updateProfile } from '../services/authService'
import { useRef } from 'react'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const fileInputRef = useRef(null)
  
  // Basic states for editing
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    department: user?.department || '',
    year: user?.year || ''
  })
  const [profilePicFile, setProfilePicFile] = useState(null)
  const [profilePicPreview, setProfilePicPreview] = useState(user?.profilePic ? `http://localhost:5000${user.profilePic}` : null)
  const [saving, setSaving] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = new FormData()
      data.append('name', formData.name)
      data.append('phone', formData.phone)
      data.append('department', formData.department)
      data.append('year', formData.year)
      if (profilePicFile) {
        data.append('profilePic', profilePicFile)
      }

      const response = await updateProfile(data)
      if (response.success) {
        updateUser(response.user)
        setIsEditing(false)
        setProfilePicFile(null)
      }
    } catch (error) {
      console.error('Error updating profile', error)
      alert('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setProfilePicFile(file)
      setProfilePicPreview(URL.createObjectURL(file))
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Your Profile</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage your personal information and preferences.</p>
        </div>

        <Card padding="lg" className="border-white/8">
          <form onSubmit={handleSave} className="space-y-5">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div className="flex items-center gap-4">
                <div 
                  className={`w-16 h-16 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-xl font-bold text-zinc-200 overflow-hidden shrink-0 ${isEditing ? 'cursor-pointer hover:opacity-80' : ''}`}
                  onClick={() => isEditing && fileInputRef.current?.click()}
                  title={isEditing ? "Click to change picture" : ""}
                >
                  {profilePicPreview ? (
                    <img src={profilePicPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??'
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/jpeg,image/png,image/webp" 
                  onChange={handleImageChange} 
                />
                <div>
                  <p className="text-lg font-semibold text-white">{user?.name}</p>
                  <p className="text-sm text-zinc-400">{user?.email}</p>
                </div>
              </div>
              {!isEditing && (
                <button 
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Edit Profile
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Full Name</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-white/30 transition-colors disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Phone Number</label>
                <input
                  type="tel"
                  disabled={!isEditing}
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-white/30 transition-colors disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Department</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-white/30 transition-colors disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Year of Study</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.year}
                  onChange={(e) => setFormData({...formData, year: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-white/30 transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false)
                    setFormData({
                      name: user?.name || '',
                      phone: user?.phone || '',
                      department: user?.department || '',
                      year: user?.year || ''
                    })
                    setProfilePicFile(null)
                    setProfilePicPreview(user?.profilePic ? `http://localhost:5000${user.profilePic}` : null)
                  }}
                  className="px-5 py-2.5 rounded-xl bg-transparent hover:bg-white/5 text-zinc-300 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}

          </form>
        </Card>
      </div>
    </DashboardLayout>
  )
}
