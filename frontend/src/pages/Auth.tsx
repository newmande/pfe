import React from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Alert } from '../components/Alert'
import { Loader } from '../components/Loader'
import { AuthService } from '../services/authService'
import type { User } from '../types/api'
import './Auth.css'

export const Auth: React.FC = () => {
  const [mode, setMode] = React.useState<'login' | 'register'>('login')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [name, setName] = React.useState('')
  const [message, setMessage] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [user, setUser] = React.useState<User | null>(null)

  React.useEffect(() => {
    if (AuthService.isAuthenticated()) {
      AuthService.getCurrentUser().then((currentUser) => {
        if (currentUser) setUser(currentUser)
      })
    }
  }, [])

  const clearStatus = () => {
    setMessage(null)
    setError(null)
  }

  const handleLogin = async () => {
    clearStatus()
    setLoading(true)
    try {
      const token = await AuthService.login(email, password)
      if (token) {
        const currentUser = await AuthService.getCurrentUser()
        setUser(currentUser)
        setMessage('Login successful')
      } else {
        setError('Login failed')
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    clearStatus()
    setLoading(true)
    try {
      const response = await AuthService.register(email, password, name)
      if (response) {
        setMessage(response)
      } else {
        setError('Registration did not complete')
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setLoading(true)
    await AuthService.logout()
    setUser(null)
    setMessage('Logged out successfully')
    setLoading(false)
  }

  return (
    <div className="page-container">
      <div className="auth-grid">
        <Card title="Authentication" hover>
          {loading && <Loader message="Processing..." />}
          {message && <Alert type="success" message={message} onClose={() => setMessage(null)} />}
          {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

          {user ? (
            <div className="auth-user-card">
              <h2>Authenticated as</h2>
              <p><strong>{user.name}</strong></p>
              <p>{user.email}</p>
              <p>Roles: {user.roles?.join(', ') || 'n/a'}</p>
              <Button variant="secondary" onClick={handleLogout}>Logout</Button>
            </div>
          ) : (
            <>
              <div className="auth-toggle">
                <Button
                  variant={mode === 'login' ? 'primary' : 'secondary'}
                  onClick={() => setMode('login')}
                >
                  Login
                </Button>
                <Button
                  variant={mode === 'register' ? 'primary' : 'secondary'}
                  onClick={() => setMode('register')}
                >
                  Register
                </Button>
              </div>

              {mode === 'register' && (
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <Button variant="primary" onClick={mode === 'login' ? handleLogin : handleRegister}>
                {mode === 'login' ? 'Login' : 'Register'}
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
