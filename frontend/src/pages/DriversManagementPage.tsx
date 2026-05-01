import React, { useEffect, useState } from 'react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Alert } from '../components/Alert'
import { Loader } from '../components/Loader'
import { DriverService } from '../services/driverService'
import type { Driver } from '../types/api'
import './DriversManagementPage.css'

export const DriversManagementPage: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    availability: true,
    latitude: '',
    longitude: ''
  })

  useEffect(() => {
    const loadDrivers = async () => {
      try {
        setLoading(true)
        setError(null)
        const allDrivers = await DriverService.getAllDrivers()
        setDrivers(allDrivers)
      } catch (err: any) {
        setError(err.message || 'Failed to load drivers')
      } finally {
        setLoading(false)
      }
    }

    loadDrivers()
  }, [])

  const handleDeleteDriver = async (driverId: number) => {
    if (!confirm('Are you sure you want to delete this driver?')) return

    try {
      setLoading(true)
      await DriverService.deleteDriver(driverId)
      setDrivers(drivers.filter(driver => driver.id !== driverId))
    } catch (err: any) {
      setError(err.message || 'Failed to delete driver')
    } finally {
      setLoading(false)
    }
  }

  const handleEditDriver = (driver: Driver) => {
    console.log('Editing driver:', driver)
    setEditingDriver(driver)
    setFormData({
      name: driver.name || '',
      phone: driver.phone || '',
      availability: driver.availability ?? true,
      latitude: driver.location?.latitude?.toString() || '',
      longitude: driver.location?.longitude?.toString() || ''
    })
    setShowCreateForm(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      availability: true,
      latitude: '',
      longitude: ''
    })
    setEditingDriver(null)
    setShowCreateForm(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      setError(null)

      const driverData: any = {
        name: formData.name,
        phone: formData.phone,
        availability: formData.availability
      }

      // Add location if provided
      if (formData.latitude && formData.longitude) {
        driverData.latitude = parseFloat(formData.latitude)
        driverData.longitude = parseFloat(formData.longitude)
      }

      if (editingDriver) {
        // Update existing driver
        console.log('Updating driver:', editingDriver.id, driverData)
        const updated = await DriverService.updateDriver(editingDriver.id, driverData)
        console.log('Update response:', updated)
        if (updated) {
          // Refresh the full list to ensure we have latest data
          const refreshedDrivers = await DriverService.getAllDrivers()
          setDrivers(refreshedDrivers)
        } else {
          throw new Error('Failed to update driver - no response from server')
        }
      } else {
        // Create new driver
        const created = await DriverService.createDriver(driverData)
        if (created) {
          setDrivers([...drivers, created])
        }
      }

      resetForm()
    } catch (err: any) {
      console.error('Save driver error:', err)
      setError(err.message || err.error || 'Failed to save driver')
    } finally {
      setLoading(false)
    }
  }

  const getAvailabilityBadge = (availability?: boolean) => {
    return availability ? 'Available' : 'Unavailable'
  }

  const getAvailabilityColor = (availability?: boolean) => {
    return availability ? 'success' : 'secondary'
  }

  const DriverCard: React.FC<{ driver: Driver }> = ({ driver }) => (
    <Card className="driver-card" hover>
      <div className="driver-header">
        <div className="driver-info">
          <h3>{driver.name}</h3>
          <span className={`availability-badge ${getAvailabilityColor(driver.availability)}`}>
            {getAvailabilityBadge(driver.availability)}
          </span>
        </div>
        <div className="driver-id">ID: #{driver.id}</div>
      </div>

      <div className="driver-details">
        <div className="detail-row">
          <span className="detail-label">Phone:</span>
          <span className="detail-value">{driver.phone || 'Not provided'}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Location:</span>
          <span className="detail-value">
            {driver.location?.latitude 
              ? `${driver.location.latitude.toFixed(4)}, ${driver.location.longitude?.toFixed(4) || 'N/A'}` 
              : 'Not set'}
          </span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Status:</span>
          <span className="detail-value">
            {driver.availability ? 'Ready for assignments' : 'Currently unavailable'}
          </span>
        </div>
      </div>

      <div className="driver-actions">
        <Button 
          variant="secondary" 
          size="sm"
          onClick={() => handleEditDriver(driver)}
        >
          Edit
        </Button>
        <Button 
          variant="danger" 
          size="sm"
          onClick={() => handleDeleteDriver(driver.id)}
          disabled={loading}
        >
          Delete
        </Button>
      </div>
    </Card>
  )

  if (loading && drivers.length === 0) {
    return (
      <div className="drivers-management-page">
        <div className="loading-container">
          <Loader size="lg" message="Loading drivers..." />
        </div>
      </div>
    )
  }

  return (
    <div className="drivers-management-page">
      <div className="page-header">
        <h1>Driver Management</h1>
        <p>Manage drivers and their availability for transportation services</p>
        <Button 
          variant="primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : 'Add New Driver'}
        </Button>
      </div>

      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      {showCreateForm && (
        <Card className="driver-form">
          <h3>{editingDriver ? `Edit Driver #${editingDriver.id}` : 'Create New Driver'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name">Driver Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter driver name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1234567890"
                />
              </div>

              <div className="form-group">
                <label htmlFor="availability">Availability Status</label>
                <select
                  id="availability"
                  name="availability"
                  value={formData.availability.toString()}
                  onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value === 'true' }))}
                >
                  <option value="true">Available</option>
                  <option value="false">Unavailable</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="latitude">Latitude</label>
                <input
                  type="number"
                  id="latitude"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  placeholder="36.8065"
                  step="any"
                />
              </div>

              <div className="form-group">
                <label htmlFor="longitude">Longitude</label>
                <input
                  type="number"
                  id="longitude"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  placeholder="10.1815"
                  step="any"
                />
              </div>
            </div>

            <div className="form-actions">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? <Loader size="sm" /> : (editingDriver ? 'Update Driver' : 'Create Driver')}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="drivers-stats">
        <Card>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">{drivers.length}</div>
              <div className="stat-label">Total Drivers</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">
                {drivers.filter(d => d.availability).length}
              </div>
              <div className="stat-label">Available</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">
                {drivers.filter(d => !d.availability).length}
              </div>
              <div className="stat-label">Unavailable</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="drivers-list">
        {drivers.length > 0 ? (
          drivers.map(driver => (
            <DriverCard key={driver.id} driver={driver} />
          ))
        ) : (
          <Card>
            <div className="no-drivers">
              <h3>No drivers found</h3>
              <p>No drivers have been registered in the system yet.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
