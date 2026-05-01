import React, { useState, useEffect } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Alert } from '../components/Alert'
import { Loader } from '../components/Loader'
import { useErrorHandler } from '../hooks/useErrorHandler'
import './ResetPasswordPage.css'

export const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [resetData, setResetData] = useState<{ email: string } | null>(null)
  const [validatingLink, setValidatingLink] = useState(true)
  const { error, setError, handleError } = useErrorHandler()

  useEffect(() => {
    const validateResetLink = async () => {
      // Get the complete current URL including all query parameters
      const currentUrl = window.location.href
      const urlParams = new URLSearchParams(window.location.search)
      const email = urlParams.get('email')
      
      if (!email) {
        setError('Invalid reset link: missing email parameter')
        setValidatingLink(false)
        return
      }

      try {
        // Use the complete URL to validate the signature
        const response = await fetch(currentUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        })

        const data = await response.json()

        if (response.ok) {
          setResetData({ email })
          setValidatingLink(false)
        } else {
          setError(data.error || 'Invalid or expired reset link')
          setValidatingLink(false)
        }
      } catch (err: any) {
        handleError(err, 'Failed to validate reset link')
        setValidatingLink(false)
      }
    }

    validateResetLink()
  }, [handleError, setError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!resetData) return

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Use the complete current URL to maintain signature validation
      const currentUrl = window.location.href
      const response = await fetch(currentUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ password })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message || 'Password has been successfully reset!')
        setTimeout(() => {
          window.location.href = '/login'
        }, 3000)
      } else {
        setError(data.error || 'Failed to reset password')
      }
    } catch (err: any) {
      handleError(err, 'Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (validatingLink) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <Card className="reset-password-card">
            <div className="loading-content">
              <Loader size="lg" message="Validating reset link..." />
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (!resetData) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <Card className="reset-password-card">
            <div className="error-content">
              <h1>Invalid Reset Link</h1>
              <p>{error || 'This password reset link is invalid or has expired.'}</p>
              <Button variant="primary" onClick={() => window.location.href = '/login'}>
                Back to Login
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <Card className="reset-password-card">
          <div className="reset-password-header">
            <h1>Reset Password</h1>
            <p>Enter your new password for {resetData.email}</p>
          </div>

          {error && (
            <Alert type="error" message={error} onClose={() => setError(null)} />
          )}

          {success && (
            <Alert type="success" message={success} onClose={() => setSuccess(null)} />
          )}

          {!success ? (
            <form onSubmit={handleSubmit} className="reset-password-form">
              <div className="form-group">
                <label htmlFor="password">New Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your new password"
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                className="reset-password-button"
              >
                {loading ? <Loader size="sm" /> : 'Reset Password'}
              </Button>
            </form>
          ) : (
            <div className="success-content">
              <div className="success-icon">Password Reset!</div>
              <p>Your password has been successfully reset.</p>
              <p>You will be redirected to the login page shortly.</p>
            </div>
          )}

          <div className="reset-password-footer">
            <Button variant="secondary" onClick={() => window.location.href = '/login'}>
              Back to Login
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
