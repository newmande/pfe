import React, { useEffect, useState } from 'react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Alert } from '../components/Alert'
import { Loader } from '../components/Loader'
import { useAuth } from '../contexts/AuthContext'
import { ReservationService } from '../services/reservationService'
import type { Reservation } from '../types/api'

import './DriverDashboard.css'

export const DriverDashboard: React.FC = () => {
  const { user } = useAuth()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDriverReservations()
  }, [])

  const loadDriverReservations = async () => {
    try {
      setLoading(true)
      setError(null)
      const driverReservations = await ReservationService.getDriverReservations()
      setReservations(driverReservations)
    } catch (err: any) {
      setError(err.message || 'Failed to load reservations')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      setLoading(true)
      await ReservationService.updateReservationStatus(id, newStatus)
      await loadDriverReservations()
    } catch (err: any) {
      setError(err.message || 'Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'success'
      case 'in_progress': return 'warning'
      case 'completed': return 'success'
      case 'cancelled': return 'error'
      default: return 'secondary'
    }
  }

  if (!user) {
    return <Alert type="error" message="Please log in to access driver dashboard" />
  }

  return (
    <div className="driver-dashboard">
      <div className="dashboard-header">
        <h1>Driver Dashboard</h1>
        <p>Welcome back, {user.name}! Here are your assigned rides.</p>
      </div>

      {error && <Alert type="error" message={error} />}

      <div className="dashboard-stats">
        <Card className="stat-card">
          <h3>Total Rides</h3>
          <span className="stat-number">{reservations.length}</span>
        </Card>
        <Card className="stat-card">
          <h3>Pending</h3>
          <span className="stat-number">
            {reservations.filter(r => r.status === 'confirmed').length}
          </span>
        </Card>
        <Card className="stat-card">
          <h3>Completed</h3>
          <span className="stat-number">
            {reservations.filter(r => r.status === 'completed').length}
          </span>
        </Card>
      </div>

      <Card title="My Rides" className="rides-list">
        {loading ? (
          <Loader message="Loading your rides..." />
        ) : reservations.length === 0 ? (
          <p className="no-rides">No rides assigned yet.</p>
        ) : (
          <div className="rides-grid">
            {reservations.map((reservation) => (
              <Card key={reservation.id} className="ride-card" hover>
                <div className="ride-header">
                  <div className="ride-info">
                    <h3>Ride #{reservation.id}</h3>
                    <span className={`status-badge ${getStatusColor(reservation.status)}`}>
                      {reservation.status}
                    </span>
                  </div>
                  <div className="ride-price">
                    <strong>{reservation.price}</strong>
                  </div>
                </div>

                <div className="ride-details">
                  <div className="detail-row">
                    <span className="detail-label">Date & Time:</span>
                    <span className="detail-value">{reservation.datetime}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Route:</span>
                    <span className="detail-value">
                      {reservation.pickupLocation} → {reservation.dropoffLocation}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Distance:</span>
                    <span className="detail-value">{reservation.distance}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Passengers:</span>
                    <span className="detail-value">{reservation.passengers}</span>
                  </div>
                </div>

                <div className="ride-actions">
                  {reservation.status === 'confirmed' && (
                    <Button
                      onClick={() => handleStatusUpdate(reservation.id, 'in_progress')}
                      variant="primary"
                    >
                      Start Ride
                    </Button>
                  )}
                  {reservation.status === 'in_progress' && (
                    <Button
                      onClick={() => handleStatusUpdate(reservation.id, 'completed')}
                      variant="success"
                    >
                      Complete Ride
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}