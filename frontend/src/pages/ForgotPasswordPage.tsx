import React, { useState } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Alert } from '../components/Alert'
import { Loader } from '../components/Loader'
import { useErrorHandler } from '../hooks/useErrorHandler'
import { AuthService } from '../services/authService'
import './ForgotPasswordPage.css'

interface ForgotPasswordPageProps {
  onNavigateToLogin?: () => void
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigateToLogin }) => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [resetUrl, setResetUrl] = useState<string | null>(null)
  const { error, setError, handleError } = useErrorHandler()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await AuthService.forgotPassword(email)
      setSuccess(result?.message || 'Password reset link has been sent to your email.')
      setResetUrl(result?.resetUrl || null)
      setEmail('')
    } catch (err: any) {
      handleError(err, 'Failed to send password reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <Card className="forgot-password-card">
          <div className="forgot-password-header">
            <h1>Forgot Password</h1>
            <p>Enter your email address and we'll send you a link to reset your password</p>
          </div>

          {error && (
            <Alert type="error" message={error} onClose={() => setError(null)} />
          )}

          {success && (
            <Alert type="success" message={success} onClose={() => setSuccess(null)} />
          )}

          
          {!success ? (
            <form onSubmit={handleSubmit} className="forgot-password-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                className="forgot-password-button"
              >
                {loading ? <Loader size="sm" /> : 'Send Reset Link'}
              </Button>
            </form>
          ) : (
            <div className="success-content">
              <div className="success-icon">Check your email</div>
              <p>We've sent a password reset link to your email address.</p>
              <p>Please check your inbox and follow the instructions to reset your password.</p>
            </div>
          )}

          <div className="forgot-password-footer">
            <p>
              Remember your password? 
              <span 
                className="footer-link" 
                onClick={onNavigateToLogin}
                style={{ cursor: 'pointer', color: '#667eea', textDecoration: 'underline' }}
              >
                Back to Login
              </span>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
