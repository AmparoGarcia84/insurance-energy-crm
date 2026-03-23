/**
 * auth/AuthContext.tsx — Global authentication state
 *
 * Stores the authenticated user profile in React context. The JWT lives in an
 * httpOnly cookie managed by the browser — JavaScript never touches the token,
 * which prevents XSS-based theft.
 *
 * On mount, AuthProvider calls GET /auth/me to check whether the browser already
 * has a valid cookie from a previous session. This is what allows the session to
 * survive a page refresh without storing anything in localStorage.
 *
 * Public exports:
 *  - AuthProvider: wraps the app so any component can access auth state.
 *  - useAuth: hook to read the current user or trigger logout.
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AuthUser, getMe } from '../api/auth'

/** What the context exposes to consumers. */
interface AuthContextValue {
  user: AuthUser | null   // null = not logged in or still loading
  loading: boolean        // true while the initial /auth/me check is in flight
  setUser: (user: AuthUser | null) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** Provides auth state to the component tree. Place this at the application root. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  // Start as loading so the app doesn't flash the login screen before the
  // /auth/me response arrives
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // On mount, check if the browser already has a valid session cookie.
    // getMe() returns null (not throws) on 401, so no error handling needed here.
    getMe()
      .then(setUser)
      .finally(() => setLoading(false))
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to access the current auth state from any component.
 * Setting user to null acts as a logout — App.tsx will render Login.
 * Throws if called outside an AuthProvider to surface wiring mistakes early.
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
