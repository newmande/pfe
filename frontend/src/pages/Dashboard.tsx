import React, { useEffect, useState } from 'react'
import { Button } from '../components/Button'
import { Alert } from '../components/Alert'
import { Loader } from '../components/Loader'
import { useAuth } from '../contexts/AuthContext'
import { UserService } from '../services/userService'
import { VehicleService } from '../services/vehicleService'
import { ReservationService } from '../services/reservationService'
import { DriverService } from '../services/driverService'
import { PricingService } from '../services/pricingService'
import type { Reservation } from '../types/api'
import './Dashboard.css'

// Simple icon components using emoji
const Icons = {
  users: '👥',
  vehicles: '🚗',
  drivers: '👤',
  available: '✅',
  reservations: '📅',
  pending: '⏳',
  pricing: '💰',
  account: '👤',
  activity: '📊',
  add: '➕',
  view: '👁️',
  trendUp: '📈',
  empty: '📭',
  welcome: '👋'
}

interface DashboardStats {
  totalUsers: number
  totalVehicles: number
  availableVehicles: number
  totalDrivers: number
  availableDrivers: number
  totalReservations: number
  pendingReservations: number
  totalPricingRules: number
  myReservations: number
}

interface DashboardProps {
  onNavigate?: (page: string) => void
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, isAdmin } = useAuth()
  const isDriver = user?.roles.includes('ROLE_DRIVER') || false
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentReservations, setRecentReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const dashboardStats: DashboardStats = {
        totalUsers: 0,
        totalVehicles: 0,
        availableVehicles: 0,
        totalDrivers: 0,
        availableDrivers: 0,
        totalReservations: 0,
        pendingReservations: 0,
        totalPricingRules: 0,
        myReservations: 0
      }

      // Load vehicles (admin only)
      if (isAdmin) {
        try {
          const allVehicles = await VehicleService.getAllVehicles()
          const availableVehicles = await VehicleService.getAvailableVehicles()
          dashboardStats.totalVehicles = allVehicles.length
          dashboardStats.availableVehicles = availableVehicles.length
        } catch (e) {
          console.log('Vehicle data load failed')
        }

        // Load reservations (admin)
        const allReservations = await ReservationService.getAllReservations(1, 10)
        if (allReservations) {
          dashboardStats.totalReservations = allReservations.pagination.total
          dashboardStats.pendingReservations = allReservations.data.filter(r => r.status === 'pending').length
          setRecentReservations(allReservations.data.slice(0, 5))
        }

        // Load users (admin only)
        const allUsers = await UserService.getAllUsers()
        dashboardStats.totalUsers = allUsers.length

        // Load drivers (admin only)
        try {
          const allDrivers = await DriverService.getAllDrivers()
          const availableDrivers = await DriverService.getAvailableDrivers()
          dashboardStats.totalDrivers = allDrivers.length
          dashboardStats.availableDrivers = availableDrivers.length
        } catch (e) {
          console.log('Driver data load failed')
        }

        // Load pricing rules (admin only)
        try {
          const allPricingRules = await PricingService.getAllPricing()
          dashboardStats.totalPricingRules = allPricingRules.length
        } catch (e) {
          console.log('Pricing data load failed')
        }
      } else {
        // User-specific data only
        const myReservations = await ReservationService.getMyReservations()
        dashboardStats.myReservations = myReservations.length
        dashboardStats.pendingReservations = myReservations.filter(r => r.status === 'pending').length
        setRecentReservations(myReservations.slice(0, 5))
      }

      setStats(dashboardStats)
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [isAdmin, isDriver])

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <Loader size="lg" message="Loading dashboard..." />
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-content">
          <div className="user-avatar">{Icons.welcome}</div>
          <h1>Welcome back, {user?.name}! 👋</h1>
          <p>
            {isAdmin 
              ? 'Admin Dashboard - System Overview & Management' 
              : 'Your Personal Transport Dashboard - Track Your Journey'
            }
          </p>
        </div>
      </div>

      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        {/* New Reservation - for all users */}
        <button 
          className="action-button primary"
          onClick={() => onNavigate?.('new-reservation')}
        >
          <span className="action-icon">{Icons.add}</span>
          <span>New Reservation</span>
        </button>
        
        {!isAdmin && !isDriver && (
          <button 
            className="action-button"
            onClick={() => onNavigate?.('my-reservations')}
          >
            <span className="action-icon">🚗</span>
            <span>My Rides</span>
          </button>
        )}
        {isAdmin && (
          <button 
            className="action-button"
            onClick={() => onNavigate?.('my-reservations')}
          >
            <span className="action-icon">{Icons.view}</span>
            <span>My History</span>
          </button>
        )}
        {isDriver && (
          <button 
            className="action-button"
            onClick={() => onNavigate?.('driver-dashboard')}
          >
            <span className="action-icon">🚗</span>
            <span>My Rides</span>
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {isAdmin ? (
          <>
            <div 
              className="stat-card"
              onClick={() => onNavigate?.('users')}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-header">
                <div className="stat-icon blue">{Icons.users}</div>
                <span className="stat-trend">{Icons.trendUp} +12%</span>
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats?.totalUsers || '0'}</div>
                <p className="stat-label">Registered Users</p>
              </div>
            </div>

            <div 
              className="stat-card"
              onClick={() => onNavigate?.('drivers')}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-header">
                <div className="stat-icon orange">{Icons.drivers}</div>
                <span className="stat-trend">{Icons.trendUp} +8%</span>
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats?.totalDrivers || '0'}</div>
                <p className="stat-label">Total Drivers</p>
              </div>
            </div>

            <div 
              className="stat-card"
              onClick={() => onNavigate?.('drivers')}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-header">
                <div className="stat-icon green">{Icons.available}</div>
                <span className="stat-trend">Active</span>
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats?.availableDrivers || '0'}</div>
                <p className="stat-label">Available Drivers</p>
              </div>
            </div>

            <div 
              className="stat-card"
              onClick={() => onNavigate?.('vehicles')}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-header">
                <div className="stat-icon orange">{Icons.vehicles}</div>
                <span className="stat-trend">{Icons.trendUp} +5%</span>
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats?.totalVehicles || '0'}</div>
                <p className="stat-label">Total Vehicles</p>
              </div>
            </div>

            <div 
              className="stat-card"
              onClick={() => onNavigate?.('vehicles')}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-header">
                <div className="stat-icon green">{Icons.available}</div>
                <span className="stat-trend">Active</span>
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats?.availableVehicles || '0'}</div>
                <p className="stat-label">Available Vehicles</p>
              </div>
            </div>

            <div 
              className="stat-card"
              onClick={() => onNavigate?.('reservations')}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-header">
                <div className="stat-icon purple">{Icons.reservations}</div>
                <span className="stat-trend">This Week</span>
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats?.totalReservations || '0'}</div>
                <p className="stat-label">Total Bookings</p>
              </div>
            </div>

            <div 
              className="stat-card"
              onClick={() => onNavigate?.('pricing-admin')}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-header">
                <div className="stat-icon green">{Icons.pricing}</div>
                <span className="stat-trend">Active</span>
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats?.totalPricingRules || '0'}</div>
                <p className="stat-label">Pricing Rules</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div 
              className="stat-card"
              onClick={() => onNavigate?.('reservations')}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-header">
                <div className="stat-icon blue">{Icons.reservations}</div>
                <span className="stat-trend">All Time</span>
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats?.myReservations || '0'}</div>
                <p className="stat-label">My Reservations</p>
              </div>
            </div>

            <div 
              className="stat-card"
              onClick={() => onNavigate?.('reservations')}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-header">
                <div className="stat-icon orange">{Icons.pending}</div>
                <span className="stat-trend">Awaiting</span>
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats?.pendingReservations || '0'}</div>
                <p className="stat-label">Pending</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon green">✅</div>
                <span className="stat-trend">Good</span>
              </div>
              <div className="stat-content">
                <span className="status-badge active">Active</span>
                <p className="stat-label">Account Status</p>
              </div>
            </div>

            <div 
              className="stat-card"
              onClick={() => onNavigate?.('reservations')}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-header">
                <div className="stat-icon purple">📅</div>
                <span className="stat-trend">This Month</span>
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats?.myReservations || '0'}</div>
                <p className="stat-label">Total Trips</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Content Area */}
      <div className="dashboard-content">
        {/* Recent Activity */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="card-icon">{Icons.activity}</span>
              Recent {isAdmin ? 'System' : 'Your'} Activity
            </h3>
          </div>
          
          {recentReservations.length > 0 ? (
            <div className="activity-list">
              {recentReservations.map(reservation => (
                <div 
                  key={reservation.id} 
                  className="activity-item"
                  onClick={() => onNavigate?.('reservations')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="activity-avatar">🚗</div>
                  <div className="activity-details">
                    <div className="activity-title">
                      {isAdmin ? `Reservation #${reservation.id}` : 'Your Trip'}
                    </div>
                    <div className="activity-subtitle">
                      {reservation.pickupLocation} → {reservation.dropoffLocation}
                    </div>
                  </div>
                  <div className="activity-meta">
                    <span className={`status-badge ${reservation.status}`}>
                      {reservation.status}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                      {new Date(reservation.datetime).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">{Icons.empty}</div>
              <p className="empty-text">No recent activity to display</p>
              <Button 
                variant="secondary"
                onClick={() => onNavigate?.('reservations')}
              >
                {isAdmin ? 'View All Reservations' : 'Make a Reservation'}
              </Button>
            </div>
          )}
        </div>

        {/* Quick Info Card */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="card-icon">📢</span>
              Quick Info
            </h3>
          </div>
          <div style={{ padding: '1rem 0' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>💡 Tip of the Day</h4>
              <p style={{ margin: 0, color: '#6b7280', lineHeight: 1.6 }}>
                {isAdmin 
                  ? 'Regular vehicle maintenance ensures better service and customer satisfaction.'
                  : 'Book your rides in advance to ensure availability during peak hours.'
                }
              </p>
            </div>
            <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '12px' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>📞 Support</h4>
              <p style={{ margin: 0, color: '#6b7280' }}>
                Need help? Contact our support team 24/7.<br />
                <strong>support@transporthub.com</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
