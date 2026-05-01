import React from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Alert } from '../components/Alert'
import { Loader } from '../components/Loader'
import { VehicleService } from '../services/vehicleService'
import type { Vehicle } from '../types/api'
import './Vehicles.css'

export const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([])
  const [searchTerm, setSearchTerm] = React.useState('')
  const [typeTerm, setTypeTerm] = React.useState('')
  const [selected, setSelected] = React.useState<Vehicle | null>(null)
  const [status, setStatus] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    loadVehicles()
  }, [])

  const loadVehicles = async () => {
    setLoading(true)
    const vehicles = await VehicleService.getAllVehicles()
    setVehicles(vehicles)
    setLoading(false)
  }

  const handleAvailable = async () => {
    setLoading(true)
    const vehicles = await VehicleService.getAvailableVehicles()
    setVehicles(vehicles)
    setStatus('Showing available vehicles')
    setLoading(false)
  }

  const handleSearchModel = async () => {
    setLoading(true)
    const vehicles = await VehicleService.searchVehiclesByModel(searchTerm)
    setVehicles(vehicles)
    setStatus(`Found ${vehicles.length} matching vehicle(s)`)
    setLoading(false)
  }

  const handleGetByType = async () => {
    setLoading(true)
    const vehicles = await VehicleService.getVehiclesByType(typeTerm)
    setVehicles(vehicles)
    setStatus(`Found ${vehicles.length} vehicle(s) of type ${typeTerm}`)
    setLoading(false)
  }

  return (
    <div className="page-container">
      <div className="vehicles-grid">
        <Card title="Vehicle Actions" hover>
          {loading && <Loader message="Loading vehicles..." />}
          {status && <Alert type="success" message={status} onClose={() => setStatus(null)} />}
          {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

          <div className="button-group">
            <Button variant="secondary" onClick={loadVehicles}>Reload all</Button>
            <Button variant="secondary" onClick={handleAvailable}>Available</Button>
          </div>

          <div className="form-group">
            <label>Search model</label>
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="e.g. sedan" />
            <Button variant="primary" onClick={handleSearchModel}>Search model</Button>
          </div>

          <div className="form-group">
            <label>Search type</label>
            <input value={typeTerm} onChange={(e) => setTypeTerm(e.target.value)} placeholder="e.g. sedan" />
            <Button variant="primary" onClick={handleGetByType}>Search type</Button>
          </div>
        </Card>

        <Card title="Vehicle List" hover>
          <ul className="list-section">
            {vehicles.map((vehicle) => (
              <li key={vehicle.id}>
                <div>
                  <strong>{vehicle.model}</strong> ({vehicle.license})
                  <div>{vehicle.type} / {vehicle.category}</div>
                  <div>Capacity: {vehicle.capacity}, {vehicle.availability ? 'Available' : 'Unavailable'}</div>
                </div>
                <Button variant="secondary" onClick={async () => {
                  const selectedVehicle = await VehicleService.getVehicle(vehicle.id)
                  setSelected(selectedVehicle)
                }}>Details</Button>
              </li>
            ))}
          </ul>
        </Card>

        {selected && (
          <Card title="Vehicle Details" hover>
            <p><strong>Model:</strong> {selected.model}</p>
            <p><strong>License:</strong> {selected.license}</p>
            <p><strong>Type:</strong> {selected.type}</p>
            <p><strong>Category:</strong> {selected.category}</p>
            <p><strong>Capacity:</strong> {selected.capacity}</p>
            <p><strong>Availability:</strong> {selected.availability ? 'Yes' : 'No'}</p>
          </Card>
        )}
      </div>
    </div>
  )
}
