import React from 'react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Loader } from '../components/Loader'
import { Alert } from '../components/Alert'
import { useApi } from '../hooks/useApi'
import './Home.css'

export const Home: React.FC = () => {
  const { data, loading, error, execute } = useApi<{ message: string }>()
  const [showAlert, setShowAlert] = React.useState(false)

  const handleTestConnection = async () => {
    setShowAlert(false)
    await execute('/test', 'GET')
    setShowAlert(true)
  }

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1 className="hero-title">Welcome to Your Frontend</h1>
        <p className="hero-subtitle">A modern React + Vite application connected to your Symfony backend</p>
      </div>

      <div className="features-grid">
        <Card title="⚡ Fast Development" hover>
          <p>Vite provides instant server start and lightning-fast HMR for a smooth development experience.</p>
        </Card>

        <Card title="🎨 Modern UI" hover>
          <p>Built with React 19 and TypeScript for type-safe, maintainable code with beautiful components.</p>
        </Card>

        <Card title="🔗 Backend Integration" hover>
          <p>Ready-to-use API service with hooks, error handling, and authentication support.</p>
        </Card>

        <Card title="📦 Production Ready" hover>
          <p>Optimized build configuration, proper error boundaries, and reusable component library.</p>
        </Card>
      </div>

      <div className="test-section">
        <Card title="Test Your Backend Connection" hover>
          {error && (
            <Alert
              type="error"
              message={`Connection Error: ${error}`}
              onClose={() => setShowAlert(false)}
            />
          )}
          
          {!loading && data && showAlert && (
            <Alert
              type="success"
              message={`✓ Backend connection successful! ${data.message ?? ''}`}
              onClose={() => setShowAlert(false)}
            />
          )}

          {loading ? (
            <Loader message="Connecting to backend..." />
          ) : (
            <div className="test-content">
              <p>Click the button below to test your backend API connection:</p>
              <Button
                onClick={handleTestConnection}
                variant="primary"
                size="lg"
                fullWidth
              >
                Test Backend API
              </Button>
            </div>
          )}
        </Card>
      </div>

      <div className="quick-start">
        <h2>Quick Start Guide</h2>
        <div className="guide-grid">
          <div className="guide-card">
            <h3>1. Update API Config</h3>
            <code>.env</code>
            <p>Set your backend URL in the environment file</p>
          </div>
          <div className="guide-card">
            <h3>2. Create Components</h3>
            <code>src/components/</code>
            <p>Build reusable UI components with the provided library</p>
          </div>
          <div className="guide-card">
            <h3>3. Use API Hooks</h3>
            <code>useApi()</code>
            <p>Fetch data with built-in loading and error handling</p>
          </div>
          <div className="guide-card">
            <h3>4. Deploy</h3>
            <code>npm run build</code>
            <p>Build and deploy your production app</p>
          </div>
        </div>
      </div>
    </div>
  )
}
