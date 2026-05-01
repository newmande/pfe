import React, { useState } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Alert } from '../components/Alert'
import { Loader } from '../components/Loader'
import { useErrorHandler } from '../hooks/useErrorHandler'
import './PasswordResetDemo.css'

export const PasswordResetDemo: React.FC = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [resetLink, setResetLink] = useState<string>('')
  const { error, setError, handleError } = useErrorHandler()

  const handleForgotPassword = async (e: React.FormEvent) => {
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
    setResetLink('')

    try {
      const response = await fetch('http://localhost:8000/auth/forgot_password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message || 'Password reset link has been sent to your email.')
        // Simulate getting the reset link for demo purposes
        const demoLink = `http://localhost:8000/auth/verify-forgot_password?email=${encodeURIComponent(email)}&expires=${Date.now() + 3600000}&signature=demo_signature_${Date.now()}&timestamp=${Date.now()}&token=demo_token`
        setResetLink(demoLink)
      } else {
        setError(data.error || 'Failed to send password reset email')
      }
    } catch (err: any) {
      handleError(err, 'Failed to send password reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleTestResetLink = () => {
    if (resetLink) {
      window.location.href = resetLink
    }
  }

  return (
    <div className="password-reset-demo">
      <div className="demo-container">
        <Card className="demo-card">
          <div className="demo-header">
            <h1>Password Reset Demo</h1>
            <p>Test the complete password reset flow</p>
          </div>

          {error && (
            <Alert type="error" message={error} onClose={() => setError(null)} />
          )}

          {success && (
            <Alert type="success" message={success} onClose={() => setSuccess(null)} />
          )}

          <div className="demo-sections">
            <div className="demo-section">
              <h2>1. Request Password Reset</h2>
              <form onSubmit={handleForgotPassword} className="demo-form">
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
                  className="demo-button"
                >
                  {loading ? <Loader size="sm" /> : 'Send Reset Link'}
                </Button>
              </form>
            </div>

            {resetLink && (
              <div className="demo-section">
                <h2>2. Test Reset Link</h2>
                <div className="reset-link-section">
                  <p><strong>Generated Reset Link:</strong></p>
                  <div className="reset-link">
                    <code>{resetLink}</code>
                  </div>
                  <div className="link-actions">
                    <Button 
                      variant="primary" 
                      onClick={handleTestResetLink}
                      className="test-link-btn"
                    >
                      Test Reset Link
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={() => navigator.clipboard.writeText(resetLink)}
                    >
                      Copy Link
                    </Button>
                  </div>
                  <div className="instructions">
                    <p><strong>Instructions:</strong></p>
                    <ol>
                      <li>Click "Test Reset Link" to simulate clicking the email link</li>
                      <li>This will take you to the password reset page</li>
                      <li>Enter a new password to complete the reset</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
