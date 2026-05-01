import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import './Sidebar.css'

interface SidebarItem {
  id: string
  label: string
  icon: string
  requiredRole?: 'user' | 'admin'
  path: string
}

export const Sidebar: React.FC<{ currentPage: string; onPageChange: (page: string) => void }> = ({ 
  currentPage, 
  onPageChange 
}) => {
  const { isAuthenticated, isAdmin } = useAuth()

  const menuItems: SidebarItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
      requiredRole: 'user',
      path: 'dashboard'
    }
  ]

  const adminMenuItems: SidebarItem[] = [
    {
      id: 'admin-users',
      label: 'User Management',
      icon: '👥',
      requiredRole: 'admin',
      path: 'users'
    },
    {
      id: 'admin-drivers',
      label: 'Driver Management',
      icon: '👤',
      requiredRole: 'admin',
      path: 'drivers'
    },
    {
      id: 'admin-vehicles',
      label: 'Vehicle Management',
      icon: '🚗',
      requiredRole: 'admin',
      path: 'vehicles'
    },
    {
      id: 'admin-reservations',
      label: 'All Reservations',
      icon: '📋',
      requiredRole: 'admin',
      path: 'reservations-admin'
    },
    {
      id: 'admin-pricing',
      label: 'Pricing Management',
      icon: '💵',
      requiredRole: 'admin',
      path: 'pricing-admin'
    }
  ]

  const visibleItems = menuItems.filter(item => 
    isAuthenticated && (!item.requiredRole || item.requiredRole === 'user')
  )

  const visibleAdminItems = adminMenuItems.filter(_item => isAdmin)

  const handleNavClick = (item: SidebarItem) => {
    onPageChange(item.path)
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        <div className="sidebar-section">
          <h3 className="sidebar-section-title">Main Menu</h3>
          <nav className="sidebar-nav">
            {visibleItems.map(item => (
              <button
                key={item.id}
                className={`sidebar-item ${currentPage === item.path ? 'active' : ''}`}
                onClick={() => handleNavClick(item)}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {isAdmin && visibleAdminItems.length > 0 && (
          <div className="sidebar-section">
            <h3 className="sidebar-section-title">Administration</h3>
            <nav className="sidebar-nav">
              {visibleAdminItems.map(item => (
                <button
                  key={item.id}
                  className={`sidebar-item ${currentPage === item.path ? 'active' : ''}`}
                  onClick={() => handleNavClick(item)}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  <span className="sidebar-label">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </aside>
  )
}
