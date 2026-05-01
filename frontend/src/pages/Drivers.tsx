import React from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Alert } from '../components/Alert'
import { Loader } from '../components/Loader'
import { DriverService } from '../services/driverService'
import type { Driver } from '../types/api'
import './Drivers.css'

export const Drivers: React.FC = () => {
  const [drivers, setDrivers] = React.useState<Driver[]>([])
  const [selectedDriver, setSelectedDriver] = React.useState<Driver | null>(null)
  const [status, setStatus] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [lat, setLat] = React.useState('')
  const [lng, setLng] = React.useState('')
  const [radius, setRadius] = React.useState('5000')

  React.useEffect(() => {
    loadDrivers()
  }, [])

  const loadDrivers = async () => {
    setLoading(true)
    const drivers = await DriverService.getAllDrivers()
    setDrivers(drivers)
    setLoading(false)
  }

  const handleSelectDriver = async (id: number) => {
    setLoading(true)
    const driver = await DriverService.getDriver(id)
    setSelectedDriver(driver)
    setLoading(false)
  }

  const handleNearby = async () => {
    setLoading(true)
    const response = await DriverService.getAvailableDrivers()
    setDrivers(response)
    setStatus(`Found ${response.length} available driver(s)`)
    setLoading(false)
  }

  return (
    <div className="page-container">
      <div className="drivers-grid">
        <Card title="Drivers" hover>
          {loading && <Loader message="Fetching drivers..." />}
          {status && <Alert type="success" message={status} onClose={() => setStatus(null)} />}
          {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

          <div className="wide-section">
            <div className="form-group">
              <label>Latitude</label>
              <input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="34.7" />
            </div>
            <div className="form-group">
              <label>Longitude</label>
              <input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="10.7" />
            </div>
            <div className="form-group">
              <label>Radius (meters)</label>
              <input value={radius} onChange={(e) => setRadius(e.target.value)} />
            </div>
            <Button variant="primary" onClick={handleNearby}>Find nearby drivers</Button>
          </div>
        </Card>

        <Card title="Driver List" hover>
          <Button variant="secondary" onClick={loadDrivers}>Reload drivers</Button>
          <ul className="list-section">
            {drivers.map((driver) => (
              <li key={driver.id}>
                <span>{driver.name} — {driver.phone || 'no phone'} — {driver.availability ? 'Available' : 'Unavailable'}</span>
                <Button variant="secondary" onClick={() => handleSelectDriver(driver.id)}>View</Button>
              </li>
            ))}
          </ul>
        </Card>

        {selectedDriver && (
          <Card title="Selected Driver" hover>
            <p><strong>Name:</strong> {selectedDriver.name}</p>
            <p><strong>Phone:</strong> {selectedDriver.phone || 'n/a'}</p>
            <p><strong>Availability:</strong> {selectedDriver.availability ? 'Yes' : 'No'}</p>
            {selectedDriver.location && (
              <p><strong>Location:</strong> {selectedDriver.location.latitude}, {selectedDriver.location.longitude}</p>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
