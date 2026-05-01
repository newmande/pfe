import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../Button'
import './Header.css'

export const Header: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-brand">
          <h1 className="brand-title">TransportHub</h1>
          <span className="brand-subtitle">Professional Transport Management</span>
        </div>
        
        <nav className="header-nav">
          {isAuthenticated ? (
            <div className="nav-user">
              <div className="user-info">
                <span className="user-name">{user?.name}</span>
                <span className="user-role">
                  {isAdmin ? 'Administrator' : 'User'}
                </span>
              </div>
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          ) : (
            <div className="nav-auth">
              <Button variant="primary" size="sm">
                Login
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
