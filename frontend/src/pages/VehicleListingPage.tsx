import React, { useEffect, useState } from 'react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Alert } from '../components/Alert'
import { Loader } from '../components/Loader'
import { VehicleService } from '../services/vehicleService'
import type { Vehicle } from '../types/api'
import './VehicleListingPage.css'

export const VehicleListingPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'available'>('available')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        setLoading(true)
        setError(null)

        const [allVehicles, available] = await Promise.all([
          VehicleService.getAllVehicles(),
          VehicleService.getAvailableVehicles()
        ])

        setVehicles(allVehicles)
        setAvailableVehicles(available)
      } catch (err: any) {
        setError(err.message || 'Failed to load vehicles')
      } finally {
        setLoading(false)
      }
    }

    loadVehicles()
  }, [])

  const handleSearch = async () => {
    if (!searchTerm.trim()) return

    try {
      setLoading(true)
      const searchResults = await VehicleService.searchVehiclesByModel(searchTerm)
      setVehicles(searchResults)
    } catch (err: any) {
      setError(err.message || 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (newFilter: 'all' | 'available') => {
    setFilter(newFilter)
  }

  const displayedVehicles = filter === 'available' ? availableVehicles : vehicles

  const VehicleCard: React.FC<{ vehicle: Vehicle }> = ({ vehicle }) => (
    <Card className={`vehicle-card ${!vehicle.availability ? 'unavailable' : ''}`} hover>
      <div className="vehicle-header">
        <h3 className="vehicle-model">{vehicle.model}</h3>
        <span className={`availability-badge ${vehicle.availability ? 'available' : 'unavailable'}`}>
          {vehicle.availability ? 'Available' : 'Unavailable'}
        </span>
      </div>
      
      <div className="vehicle-details">
        <div className="vehicle-info">
          <span className="info-label">License:</span>
          <span className="info-value">{vehicle.license}</span>
        </div>
        
        <div className="vehicle-info">
          <span className="info-label">Type:</span>
          <span className="info-value">{vehicle.type}</span>
        </div>
        
        <div className="vehicle-info">
          <span className="info-label">Category:</span>
          <span className="info-value">{vehicle.category}</span>
        </div>
        
        <div className="vehicle-info">
          <span className="info-label">Capacity:</span>
          <span className="info-value">{vehicle.capacity} passengers</span>
        </div>
      </div>

      <div className="vehicle-actions">
        <Button 
          variant={vehicle.availability ? 'primary' : 'secondary'}
          size="sm"
          disabled={!vehicle.availability}
        >
          {vehicle.availability ? 'Book Now' : 'Not Available'}
        </Button>
      </div>
    </Card>
  )

  if (loading) {
    return (
      <div className="vehicle-listing-page">
        <div className="loading-container">
          <Loader size="lg" message="Loading vehicles..." />
        </div>
      </div>
    )
  }

  return (
    <div className="vehicle-listing-page">
      <div className="page-header">
        <h1>Available Vehicles</h1>
        <p>Browse and book vehicles for your transportation needs</p>
      </div>

      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      <div className="vehicle-filters">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'available' ? 'active' : ''}`}
            onClick={() => handleFilterChange('available')}
          >
            Available ({availableVehicles.length})
          </button>
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => handleFilterChange('all')}
          >
            All Vehicles ({vehicles.length})
          </button>
        </div>

        <div className="search-container">
          <input
            type="text"
            placeholder="Search by model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <Button variant="secondary" onClick={handleSearch}>
            Search
          </Button>
        </div>
      </div>

      <div className="vehicles-grid">
        {displayedVehicles.length > 0 ? (
          displayedVehicles.map(vehicle => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))
        ) : (
          <div className="no-vehicles">
            <Card>
              <div className="no-vehicles-content">
                <h3>No vehicles found</h3>
                <p>
                  {filter === 'available' 
                    ? 'No vehicles are currently available for booking.'
                    : 'No vehicles match your search criteria.'
                  }
                </p>
                {filter === 'available' && (
                  <Button variant="secondary" onClick={() => handleFilterChange('all')}>
                    View All Vehicles
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
