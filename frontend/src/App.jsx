import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'

import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ReportLostItem from './pages/ReportLostItem'
import ReportFoundItem from './pages/ReportFoundItem'
import MyReports from './pages/MyReports'
import BrowseReports from './pages/BrowseReports'
import MyMatches from './pages/MyMatches'
import MatchDetails from './pages/MatchDetails'
import RecoveryDetails from './pages/RecoveryDetails'
import Notifications from './pages/Notifications'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/browse" 
            element={
              <ProtectedRoute>
                <BrowseReports />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/matches" 
            element={
              <ProtectedRoute>
                <MyMatches />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/matches/:id" 
            element={
              <ProtectedRoute>
                <MatchDetails />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/recovery/:matchId" 
            element={
              <ProtectedRoute>
                <RecoveryDetails />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/notifications" 
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/settings" 
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/report-lost" 
            element={
              <ProtectedRoute>
                <ReportLostItem />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/report-found" 
            element={
              <ProtectedRoute>
                <ReportFoundItem />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-reports" 
            element={
              <ProtectedRoute>
                <MyReports />
              </ProtectedRoute>
            } 
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
