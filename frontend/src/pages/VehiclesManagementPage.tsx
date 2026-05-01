import React, { useEffect, useState } from 'react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Alert } from '../components/Alert'
import { Loader } from '../components/Loader'
import { VehicleService } from '../services/vehicleService'
import type { Vehicle } from '../types/api'
import './VehiclesManagementPage.css'

export const VehiclesManagementPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [formData, setFormData] = useState({
    model: '',
    license: '',
    type: 'sedan',
    category: 'economy',
    capacity: 4,
    availability: true
  })

  useEffect(() => {
    loadVehicles()
  }, [])

  const loadVehicles = async () => {
    try {
      setLoading(true)
      setError(null)
      const allVehicles = await VehicleService.getAllVehicles()
      setVehicles(allVehicles)
    } catch (err: any) {
      setError(err.message || 'Failed to load vehicles')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteVehicle = async (vehicleId: number) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return

    try {
      setLoading(true)
      await VehicleService.deleteVehicle(vehicleId)
      setVehicles(vehicles.filter(v => v.id !== vehicleId))
    } catch (err: any) {
      setError(err.message || 'Failed to delete vehicle')
    } finally {
      setLoading(false)
    }
  }

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setFormData({
      model: vehicle.model || '',
      license: vehicle.license || '',
      type: (vehicle.type || 'sedan').toLowerCase(),
      category: (vehicle.category || 'economy').toLowerCase(),
      capacity: vehicle.capacity || 4,
      availability: vehicle.availability ?? true
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      model: '',
      license: '',
      type: 'sedan',
      category: 'economy',
      capacity: 4,
      availability: true
    })
    setEditingVehicle(null)
    setShowForm(false)
  }

  const handleAddNew = () => {
    resetForm()
    setShowForm(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
              type === 'number' ? parseInt(value) || 0 :
              value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)
      setError(null)

      const vehicleData = {
        model: formData.model,
        license: formData.license,
        type: formData.type,
        category: formData.category,
        capacity: formData.capacity,
        availability: formData.availability
      }

      if (editingVehicle) {
        console.log('Updating vehicle:', editingVehicle.id, vehicleData)
        const updated = await VehicleService.updateVehicle(editingVehicle.id, vehicleData)
        if (updated) {
          await loadVehicles()
          resetForm()
        } else {
          throw new Error('Failed to update vehicle')
        }
      } else {
        console.log('Creating vehicle:', vehicleData)
        const created = await VehicleService.createVehicle(vehicleData)
        if (created) {
          setVehicles([...vehicles, created])
          resetForm()
        } else {
          throw new Error('Failed to create vehicle')
        }
      }
    } catch (err: any) {
      console.error('Save vehicle error:', err)
      setError(err.message || err.error || 'Failed to save vehicle')
    } finally {
      setLoading(false)
    }
  }

  const getTypeBadge = (type?: string) => {
    return type || 'Unknown'
  }

  const getAvailabilityBadge = (availability?: boolean) => {
    return availability ? 'Available' : 'Unavailable'
  }

  const getAvailabilityColor = (availability?: boolean) => {
    return availability ? 'success' : 'secondary'
  }

  const VehicleCard: React.FC<{ vehicle: Vehicle }> = ({ vehicle }) => (
    <Card className="vehicle-card" hover>
      <div className="vehicle-header">
        <div className="vehicle-info">
          <h3>{vehicle.model}</h3>
          <span className={`availability-badge ${getAvailabilityColor(vehicle.availability)}`}>
            {getAvailabilityBadge(vehicle.availability)}
          </span>
        </div>
        <div className="vehicle-id">ID: #{vehicle.id}</div>
      </div>

      <div className="vehicle-details">
        <div className="detail-row">
          <span className="detail-label">License:</span>
          <span className="detail-value">{vehicle.license || 'Not set'}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Type:</span>
          <span className="detail-value">{getTypeBadge(vehicle.type)}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Category:</span>
          <span className="detail-value">{vehicle.category || 'Not set'}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Capacity:</span>
          <span className="detail-value">{vehicle.capacity} passengers</span>
        </div>
      </div>

      <div className="vehicle-actions">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleEditVehicle(vehicle)}
        >
          Edit
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => handleDeleteVehicle(vehicle.id)}
          disabled={loading}
        >
          Delete
        </Button>
      </div>
    </Card>
  )

  if (loading && vehicles.length === 0) {
    return (
      <div className="vehicles-management-page">
        <div className="loading-container">
          <Loader size="lg" message="Loading vehicles..." />
        </div>
      </div>
    )
  }

  return (
    <div className="vehicles-management-page">
      <div className="page-header">
        <div>
          <h1>Vehicle Management</h1>
          <p>Manage fleet vehicles and their details</p>
        </div>
        <Button
          variant="primary"
          onClick={showForm ? resetForm : handleAddNew}
        >
          {showForm ? 'Cancel' : 'Add New Vehicle'}
        </Button>
      </div>

      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      {showForm && (
        <Card className="vehicle-form">
          <h3>{editingVehicle ? `Edit Vehicle #${editingVehicle.id}` : 'Create New Vehicle'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="model">Model *</label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  placeholder="e.g. Toyota Camry"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="license">License Plate *</label>
                <input
                  type="text"
                  id="license"
                  name="license"
                  value={formData.license}
                  onChange={handleInputChange}
                  placeholder="e.g. ABC-1234"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="type">Vehicle Type *</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="van">Van</option>
                  <option value="luxury">Luxury</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="economy">Economy</option>
                  <option value="business">Business</option>
                  <option value="first">First Class</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="capacity">Capacity (passengers) *</label>
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  min="1"
                  max="20"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="availability">Availability</label>
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
            </div>

            <div className="form-actions">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? <Loader size="sm" /> : (editingVehicle ? 'Update Vehicle' : 'Create Vehicle')}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="vehicles-stats">
        <Card>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">{vehicles.length}</div>
              <div className="stat-label">Total Vehicles</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">
                {vehicles.filter(v => v.availability).length}
              </div>
              <div className="stat-label">Available</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">
                {vehicles.filter(v => !v.availability).length}
              </div>
              <div className="stat-label">Unavailable</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="vehicles-list">
        {vehicles.length > 0 ? (
          vehicles.map(vehicle => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))
        ) : (
          <Card>
            <div className="no-vehicles">
              <h3>No vehicles found</h3>
              <p>No vehicles have been registered in the system yet.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
