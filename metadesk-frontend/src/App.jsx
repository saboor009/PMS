import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Tasks from './pages/Tasks'
import TaskDetail from './pages/TaskDetail'
import Messages from './pages/Messages'
import Notifications from './pages/Notifications'
import Team from './pages/Team'
import Todos from './pages/Todos'
import EmployeeSummary from './pages/EmployeeSummary'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import { can, hasRoleAtLeast } from './utils/accessControl'

const Loader = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0D1B36, #1A4A8A)' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#5BB8E8', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 500 }}>Loading Metadesk...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  </div>
)

function ProtectedRoute({ children, roles, permission }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <Loader />
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.some(role => user.role === role || hasRoleAtLeast(user, role))) return <Navigate to="/dashboard" replace />
  if (permission && !can(user, permission)) return <Navigate to="/dashboard" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <Loader />
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/tasks/:id" element={<TaskDetail />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/team" element={<Team />} />
        <Route path="/todos" element={<Todos />} />
        <Route path="/employee-summary" element={
          <ProtectedRoute permission="viewEmployeeSummary">
            <EmployeeSummary />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { borderRadius: '12px', fontSize: '13px', fontWeight: '500' },
            success: { style: { background: '#0F1E3D', color: '#fff', border: '1px solid #2F85C8' } },
            error: { style: { background: '#fff', color: '#EF4444', border: '1px solid #FCA5A5' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}
