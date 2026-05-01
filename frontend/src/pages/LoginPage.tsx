import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Alert } from '../components/Alert'
import { Loader } from '../components/Loader'
import type { LoginCredentials } from '../types/auth'
import './LoginPage.css'

interface LoginPageProps {
  onNavigateToRegister?: () => void
  onNavigateToForgotPassword?: () => void
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigateToRegister, onNavigateToForgotPassword }) => {
  const { login } = useAuth()
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!credentials.email || !credentials.password) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await login(credentials)
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <Card className="login-card">
          <div className="login-header">
            <h1>Welcome Back</h1>
            <p>Sign in to your TransportHub account</p>
          </div>

          {error && (
            <Alert type="error" message={error} onClose={() => setError(null)} />
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={credentials.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={credentials.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="login-button"
            >
              {loading ? <Loader size="sm" /> : 'Sign In'}
            </Button>
          </form>

          <div className="login-footer">
            <p>
              Don't have an account? 
              <span 
                className="footer-link" 
                onClick={onNavigateToRegister}
                style={{ cursor: 'pointer', color: '#667eea', textDecoration: 'underline' }}
              >
                Register here
              </span>
            </p>
            <p>
              <span 
                className="footer-link" 
                onClick={onNavigateToForgotPassword}
                style={{ cursor: 'pointer', color: '#667eea', textDecoration: 'underline' }}
              >
                Forgot your password?
              </span>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
