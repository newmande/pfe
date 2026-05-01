import React from 'react'
import { Button } from '../Button'
import './MobileNavigation.css'

interface MobileNavigationProps {
  currentPage: string
  onPageChange: (page: string) => void
  isOpen: boolean
  onClose: () => void
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentPage,
  onPageChange,
  isOpen,
  onClose
}) => {

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'reservations', label: 'Reservations', icon: '📅' },
    { id: 'pricing', label: 'Pricing', icon: '💰' },
    { id: 'users', label: 'Users', icon: '👥', adminOnly: true },
    { id: 'drivers', label: 'Drivers', icon: '👤', adminOnly: true },
    { id: 'vehicles', label: 'Vehicles', icon: '🚗', adminOnly: true }
  ]

  const handlePageChange = (page: string) => {
    onPageChange(page)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      <div className="mobile-nav-overlay" onClick={onClose} />
      <div className="mobile-navigation">
        <div className="mobile-nav-header">
          <h2>Menu</h2>
          <Button variant="secondary" onClick={onClose} className="close-btn">
            ×
          </Button>
        </div>

        <div className="mobile-nav-content">
          <div className="mobile-nav-section">
            <h3>Main</h3>
            <div className="mobile-nav-items">
              {menuItems
                .filter(item => !item.adminOnly)
                .map(item => (
                  <button
                    key={item.id}
                    className={`mobile-nav-item ${currentPage === item.id ? 'active' : ''}`}
                    onClick={() => handlePageChange(item.id)}
                  >
                    <span className="mobile-nav-icon">{item.icon}</span>
                    <span className="mobile-nav-label">{item.label}</span>
                  </button>
                ))}
            </div>
          </div>

          <div className="mobile-nav-section">
            <h3>Administration</h3>
            <div className="mobile-nav-items">
              {menuItems
                .filter(item => item.adminOnly)
                .map(item => (
                  <button
                    key={item.id}
                    className={`mobile-nav-item ${currentPage === item.id ? 'active' : ''}`}
                    onClick={() => handlePageChange(item.id)}
                  >
                    <span className="mobile-nav-icon">{item.icon}</span>
                    <span className="mobile-nav-label">{item.label}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

interface MobileNavToggleProps {
  onToggle: () => void
  isOpen: boolean
}

export const MobileNavToggle: React.FC<MobileNavToggleProps> = ({ onToggle, isOpen }) => {
  return (
    <Button
      variant="secondary"
      onClick={onToggle}
      className={`mobile-nav-toggle ${isOpen ? 'open' : ''}`}
    >
      <div className="hamburger">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </Button>
  )
}
