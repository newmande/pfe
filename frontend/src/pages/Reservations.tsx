import React from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Alert } from '../components/Alert'
import { Loader } from '../components/Loader'
import { ReservationService } from '../services/reservationService'
import type { Reservation } from '../types/api'
import './Reservations.css'

export const Reservations: React.FC = () => {
  const [reservations, setReservations] = React.useState<Reservation[]>([])
  const [adminReservations, setAdminReservations] = React.useState<Reservation[]>([])
  const [datetime, setDatetime] = React.useState('')
  const [pickupLocation, setPickupLocation] = React.useState('')
  const [dropoffLocation, setDropoffLocation] = React.useState('')
  const [type, setType] = React.useState('sedan')
  const [passengers, setPassengers] = React.useState('1')
  const [status, setStatus] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [confirmId, setConfirmId] = React.useState('')

  React.useEffect(() => {
    loadMyReservations()
  }, [])

  const loadMyReservations = async () => {
    setLoading(true)
    const reservations = await ReservationService.getMyReservations()
    setReservations(reservations)
    setLoading(false)
  }

  const loadAdminReservations = async () => {
    setLoading(true)
    const response = await ReservationService.getAllReservations()
    if (response) {
      setAdminReservations(response.data)
      setStatus('Loaded admin reservations list')
    } else {
      setError('Unable to load admin reservations')
    }
    setLoading(false)
  }

  const handleCreate = async () => {
    setLoading(true)
    const result = await ReservationService.createReservation({
      datetime,
      pickupLocation,
      dropoffLocation,
      type,
      numberOfPassengers: Number(passengers),
    })

    if (result) {
      setStatus(result.message)
      await loadMyReservations()
    } else {
      setError('Reservation failed')
    }
    setLoading(false)
  }

  const handleDelete = async (id: number) => {
    setLoading(true)
    const result = await ReservationService.deleteReservation(id)
    if (result) {
      setStatus(result.message)
      await loadMyReservations()
    } else {
      setError('Unable to cancel reservation')
    }
    setLoading(false)
  }

  const handleConfirm = async () => {
    setLoading(true)
    const result = await ReservationService.confirmReservation(Number(confirmId))
    if (result) {
      setStatus(result.message)
    } else {
      setError('Confirmation failed')
    }
    setLoading(false)
  }

  return (
    <div className="page-container">
      <div className="reservations-grid">
        <Card title="Book a Reservation" hover>
          {loading && <Loader message="Working on reservations..." />}
          {status && <Alert type="success" message={status} onClose={() => setStatus(null)} />}
          {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

          <div className="form-group">
            <label>Date / Time</label>
            <input type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Pickup</label>
            <input value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} placeholder="Pickup address" />
          </div>
          <div className="form-group">
            <label>Dropoff</label>
            <input value={dropoffLocation} onChange={(e) => setDropoffLocation(e.target.value)} placeholder="Dropoff address" />
          </div>
          <div className="form-group">
            <label>Type</label>
            <input value={type} onChange={(e) => setType(e.target.value)} placeholder="sedan" />
          </div>
          <div className="form-group">
            <label>Passengers</label>
            <input type="number" min="1" value={passengers} onChange={(e) => setPassengers(e.target.value)} />
          </div>
          <Button variant="primary" onClick={handleCreate}>Create reservation</Button>
        </Card>

        <Card title="My Reservations" hover>
          <Button variant="secondary" onClick={loadMyReservations}>Refresh my reservations</Button>
          <ul className="list-section">
            {reservations.map((reservation) => (
              <li key={reservation.id}>
                <div>
                  <strong>{reservation.datetime}</strong>
                  <div>{reservation.pickupLocation} → {reservation.dropoffLocation}</div>
                  <div>{reservation.price} / {reservation.status}</div>
                </div>
                <Button variant="secondary" onClick={() => handleDelete(reservation.id)}>Cancel</Button>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Admin Reservations" hover>
          <Button variant="secondary" onClick={loadAdminReservations}>Load admin reservations</Button>
          <ul className="list-section">
            {adminReservations.map((reservation) => (
              <li key={reservation.id}>
                <div>
                  <strong>{reservation.datetime}</strong>
                  <div>{reservation.pickupLocation} → {reservation.dropoffLocation}</div>
                  <div>{reservation.price} / {reservation.status}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Confirm Reservation" hover>
          <div className="form-group">
            <label>Reservation ID</label>
            <input value={confirmId} onChange={(e) => setConfirmId(e.target.value)} placeholder="Reservation id" />
          </div>
          <Button variant="primary" onClick={handleConfirm}>Confirm</Button>
        </Card>
      </div>
    </div>
  )
}
