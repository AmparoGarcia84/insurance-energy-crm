/**
 * Login/Login.tsx — Login screen
 *
 * The only page visible to unauthenticated users. Collects email and password,
 * calls the backend via loginApi, and on success writes the returned token and
 * user profile into AuthContext. App.tsx then renders Dashboard in its place.
 *
 * Error handling is intentionally generic — we show a single "invalid credentials"
 * message regardless of whether the email or password was wrong, to avoid giving
 * hints to potential attackers.
 *
 * All visible text goes through i18next so the UI stays in Spanish (the default
 * locale) without hardcoded strings in the component.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import logo from '../../assets/logo.jpeg'
import { login as loginApi } from '../../api/auth'
import { useAuth } from '../../auth/AuthContext'
import InputField from '../FormField/InputField'
import './Login.css'

export default function Login() {
  const { t } = useTranslation()
  const { setUser } = useAuth()

  // Controlled inputs for the form fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // error holds the translated message shown below the form on failure
  const [error, setError] = useState('')
  // loading prevents double-submission and swaps the button label
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')      // clear any previous error before each attempt
    setLoading(true)
    try {
      const user = await loginApi(email, password)
      // Writing to auth context triggers App.tsx to render Dashboard
      setUser(user)
    } catch {
      setError(t('login.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <img src={logo} alt="Logo" />
        </div>

        <div className="login-header">
          <h1>{t('login.title')}</h1>
          <p>{t('login.subtitle')}</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <InputField
            id="email"
            name="email"
            label={t('login.email')}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('login.emailPlaceholder')}
            required
          />

          <InputField
            id="password"
            name="password"
            label={t('login.password')}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('login.passwordPlaceholder')}
            required
          />

          {/* Only rendered when there is an error to display */}
          {error && <p className="login-error">{error}</p>}

          {/* Button is disabled during the API call to prevent double-submit */}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? t('login.submitting') : t('login.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}
