import React, { useEffect, useState } from 'react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Alert } from '../components/Alert'
import { Loader } from '../components/Loader'
import { MapPicker } from '../components/MapPicker'
import { useAuth } from '../contexts/AuthContext'
import { ReservationService } from '../services/reservationService'
import type { Reservation } from '../types/api'
import type { ReservationData } from '../services/reservationService'
import './ReservationsPage.css'

interface ReservationsPageProps {
  myReservationsOnly?: boolean
  showFormInitially?: boolean
}

export const ReservationsPage: React.FC<ReservationsPageProps> = ({ myReservationsOnly = false, showFormInitially = false }) => {
  const { isAdmin } = useAuth()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showBookingForm, setShowBookingForm] = useState(showFormInitially)
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null)
  const [editData, setEditData] = useState<ReservationData>({
    datetime: '',
    pickupLocation: '',
    dropoffLocation: '',
    numberOfPassengers: 1,
    type: 'sedan'
  })
  const [bookingData, setBookingData] = useState<ReservationData>({
    datetime: '',
    pickupLocation: '',
    dropoffLocation: '',
    numberOfPassengers: 1,
    type: 'sedan',
    category: 'standard'
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load reservations
        if (isAdmin && !myReservationsOnly) {
          const allReservations = await ReservationService.getAllReservations(1, 50)
          if (allReservations) {
            setReservations(allReservations.data)
          }
        } else {
          const myReservations = await ReservationService.getMyReservations()
          setReservations(myReservations)
        }

              } catch (err: any) {
        setError(err.message || 'Failed to load reservations')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isAdmin, myReservationsOnly])

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      const result = await ReservationService.createReservation(bookingData)
      
      if (result) {
        // Reload reservations
        if (isAdmin && !myReservationsOnly) {
          const allReservations = await ReservationService.getAllReservations(1, 50)
          if (allReservations) {
            setReservations(allReservations.data)
          }
        } else {
          const myReservations = await ReservationService.getMyReservations()
          setReservations(myReservations)
        }
        
        setShowBookingForm(false)
        setBookingData({
          datetime: '',
          pickupLocation: '',
          dropoffLocation: '',
          numberOfPassengers: 1,
          type: 'sedan'
        })
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create reservation')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelReservation = async (id: number) => {
    try {
      setLoading(true)
      await ReservationService.deleteReservation(id)
      
      // Reload reservations
      if (isAdmin) {
        const allReservations = await ReservationService.getAllReservations(1, 50)
        if (allReservations) {
          setReservations(allReservations.data)
        }
      } else {
        const myReservations = await ReservationService.getMyReservations()
        setReservations(myReservations)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to cancel reservation')
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (reservation: Reservation) => {
    setEditingReservation(reservation)
    setEditData({
      datetime: reservation.datetime.slice(0, 16), // Format for datetime-local input
      pickupLocation: reservation.pickupLocation,
      dropoffLocation: reservation.dropoffLocation,
      numberOfPassengers: reservation.passengers,
      type: 'sedan'
    })
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingReservation) return

    try {
      setLoading(true)
      const result = await ReservationService.updateReservation(editingReservation.id, editData)
      
      if (result) {
        setEditingReservation(null)
        // Reload reservations
        if (isAdmin && !myReservationsOnly) {
          const allReservations = await ReservationService.getAllReservations(1, 50)
          if (allReservations) {
            setReservations(allReservations.data)
          }
        } else {
          const myReservations = await ReservationService.getMyReservations()
          setReservations(myReservations)
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update reservation')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReservation = async (id: number) => {
    if (!confirm('Are you sure you want to delete this reservation? This action cannot be undone.')) {
      return
    }

    try {
      setLoading(true)
      await ReservationService.deleteReservation(id)
      
      // Remove from local state
      setReservations(prev => prev.filter(r => r.id !== id))
    } catch (err: any) {
      setError(err.message || 'Failed to delete reservation')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'success'
      case 'pending': return 'warning'
      case 'cancelled': return 'error'
      default: return 'secondary'
    }
  }

  const ReservationCard: React.FC<{ reservation: Reservation }> = ({ reservation }) => (
    <Card className="reservation-card" hover>
      <div className="reservation-header">
        <div className="reservation-info">
          <h3>Reservation #{reservation.id}</h3>
          <span className={`status-badge ${getStatusColor(reservation.status)}`}>
            {reservation.status}
          </span>
        </div>
        <div className="reservation-price">
          <strong>{reservation.price}</strong>
        </div>
      </div>

      <div className="reservation-details">
        {isAdmin && reservation.user && (
          <div className="detail-row">
            <span className="detail-label">Booked By:</span>
            <span className="detail-value">
              {reservation.user.name} ({reservation.user.email})
            </span>
          </div>
        )}
        <div className="detail-row">
          <span className="detail-label">Date & Time:</span>
          <span className="detail-value">{reservation.datetime}</span>
        </div>
        
        {reservation.category && (
          <div className="detail-row">
            <span className="detail-label">Category:</span>
            <span className="detail-value">{reservation.category.charAt(0).toUpperCase() + reservation.category.slice(1)}</span>
          </div>
        )}
        
        <div className="detail-row">
          <span className="detail-label">Route:</span>
          <span className="detail-value">
            {reservation.pickupLocation} to {reservation.dropoffLocation}
          </span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">Distance:</span>
          <span className="detail-value">{reservation.distance}</span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">Duration:</span>
          <span className="detail-value">{reservation.duration}</span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">Passengers:</span>
          <span className="detail-value">{reservation.passengers}</span>
        </div>

        {reservation.driver && (
          <div className="detail-row">
            <span className="detail-label">Driver:</span>
            <span className="detail-value">{reservation.driver.name}</span>
          </div>
        )}

        {reservation.vehicle && (
          <div className="detail-row">
            <span className="detail-label">Vehicle:</span>
            <span className="detail-value">
              {reservation.vehicle.model} ({reservation.vehicle.license})
            </span>
          </div>
        )}
      </div>

      <div className="reservation-actions">
        {reservation.status === 'pending' && (
          <Button 
            variant="danger" 
            size="sm"
            onClick={() => handleCancelReservation(reservation.id)}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
        {isAdmin && (
          <>
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => handleEditClick(reservation)}
              disabled={loading}
            >
              Edit
            </Button>
            <Button 
              variant="danger" 
              size="sm"
              onClick={() => handleDeleteReservation(reservation.id)}
              disabled={loading}
            >
              Delete
            </Button>
          </>
        )}
      </div>
    </Card>
  )

  if (loading && reservations.length === 0) {
    return (
      <div className="reservations-page">
        <div className="loading-container">
          <Loader size="lg" message="Loading reservations..." />
        </div>
      </div>
    )
  }

  return (
    <div className="reservations-page">
      <div className="page-header">
        <h1>
          {showFormInitially 
            ? 'New Reservation'
            : isAdmin 
              ? 'All Reservations' 
              : 'My Reservations'
          }
        </h1>
        <p>
          {showFormInitially
            ? 'Create a new transportation booking'
            : isAdmin 
              ? 'Manage all system reservations' 
              : 'View and manage your transportation bookings'
          }
        </p>
        
        {!showFormInitially && (
          <Button 
            variant="primary"
            onClick={() => setShowBookingForm(!showBookingForm)}
          >
            {showBookingForm ? 'Cancel' : 'New Reservation'}
          </Button>
        )}
      </div>

      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      {showBookingForm && (
        <Card className="booking-form">
          <h3>Create New Reservation</h3>
          <form onSubmit={handleBookingSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Date & Time</label>
                <input
                  type="datetime-local"
                  value={bookingData.datetime}
                  onChange={(e) => setBookingData({...bookingData, datetime: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group form-group-full">
                <MapPicker
                  label="Pickup Location (Click on map or search)"
                  selectedLocation={bookingData.pickupLocation}
                  onLocationSelect={(location, lat, lng) => 
                    setBookingData(prev => ({
                      ...prev,
                      pickupLocation: location
                    }))
                  }
                />
                <div className="airport-options">
                  <label>Quick Airport Pickup:</label>
                  <div className="airport-buttons">
                    <button type="button" className="airport-btn" onClick={() => setBookingData({...bookingData, pickupLocation: 'John F. Kennedy International Airport, New York'})}>
                      JFK Airport
                    </button>
                    <button type="button" className="airport-btn" onClick={() => setBookingData({...bookingData, pickupLocation: 'LaGuardia Airport, New York'})}>
                      LaGuardia
                    </button>
                    <button type="button" className="airport-btn" onClick={() => setBookingData({...bookingData, pickupLocation: 'Newark Liberty International Airport, Newark'})}>
                      Newark Airport
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="form-group form-group-full">
                <MapPicker
                  label="Dropoff Location (Click on map or search)"
                  selectedLocation={bookingData.dropoffLocation}
                  onLocationSelect={(location, lat, lng) => 
                    setBookingData(prev => ({
                      ...prev,
                      dropoffLocation: location
                    }))
                  }
                />
              </div>
              
              <div className="form-group">
                <label>Number of Passengers</label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={bookingData.numberOfPassengers}
                  onChange={(e) => setBookingData({...bookingData, numberOfPassengers: parseInt(e.target.value)})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Vehicle Type</label>
                <select
                  value={bookingData.type}
                  onChange={(e) => setBookingData({...bookingData, type: e.target.value})}
                >
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="van">Van</option>
                  <option value="luxury">Luxury</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Category</label>
                <select
                  value={bookingData.category}
                  onChange={(e) => setBookingData({...bookingData, category: e.target.value})}
                >
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="business">Business</option>
                </select>
              </div>
            </div>
            
            <div className="form-actions">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? <Loader size="sm" /> : 'Book Now'}
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => setShowBookingForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Edit Reservation Modal */}
      {editingReservation && (
        <Card className="edit-reservation-form">
          <h2>Edit Reservation #{editingReservation.id}</h2>
          <form onSubmit={handleEditSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Date & Time</label>
                <input
                  type="datetime-local"
                  value={editData.datetime}
                  onChange={(e) => setEditData({...editData, datetime: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Passengers</label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={editData.numberOfPassengers}
                  onChange={(e) => setEditData({...editData, numberOfPassengers: parseInt(e.target.value) || 1})}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Pickup Location</label>
                <input
                  type="text"
                  value={editData.pickupLocation}
                  onChange={(e) => setEditData({...editData, pickupLocation: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Dropoff Location</label>
                <input
                  type="text"
                  value={editData.dropoffLocation}
                  onChange={(e) => setEditData({...editData, dropoffLocation: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div className="form-actions">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? <Loader size="sm" /> : 'Update Reservation'}
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => setEditingReservation(null)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Show reservations list only if not in new-reservation mode */}
      {!showFormInitially && (
        <div className="reservations-list">
          {reservations.length > 0 ? (
            reservations.map(reservation => (
              <ReservationCard key={reservation.id} reservation={reservation} />
            ))
          ) : (
            <Card>
              <div className="no-reservations">
                <h3>No reservations found</h3>
                <p>
                  {isAdmin 
                    ? 'No reservations have been made yet.'
                    : 'You haven\'t made any reservations yet.'
                  }
                </p>
                {!isAdmin && (
                  <Button 
                    variant="primary" 
                    onClick={() => setShowBookingForm(true)}
                  >
                    Make Your First Reservation
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
