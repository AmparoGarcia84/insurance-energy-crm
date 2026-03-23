/**
 * App.tsx — Application root
 *
 * Sets up the authentication context and acts as the top-level router:
 * if the user has an active session they see the Dashboard, otherwise
 * they are shown the Login screen. There is no URL-based routing at this
 * level — navigation between CRM sections is handled inside Dashboard.
 */
import './App.css'
import { AuthProvider, useAuth } from './auth/AuthContext'
import Login from './components/Login/Login'
import Dashboard from './components/Dashboard/Dashboard'

/**
 * AppContent reads the current auth state and renders either the protected
 * dashboard or the login form. It must live inside AuthProvider so it can
 * access the context via useAuth().
 */
function AppContent() {
  const { user, loading } = useAuth()

  // Wait for the initial /auth/me check before rendering anything,
  // so the login screen never flashes for users with an active session.
  if (loading) return null

  return user ? <Dashboard /> : <Login />
}

/**
 * App wraps AppContent in AuthProvider so that the auth state is available
 * anywhere in the tree. Keeping the provider here (at the root) means all
 * future feature pages will automatically have access to the current user
 * and their role without additional wiring.
 */
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
