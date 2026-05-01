import React, { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  timestamp: Date
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearAllNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const id = Date.now().toString()
    const timestamp = new Date()
    const duration = notification.duration || 5000

    const newNotification: Notification = {
      ...notification,
      id,
      timestamp
    }

    setNotifications(prev => [...prev, newNotification])

    // Auto-remove notification after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  const value: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotifications()

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'success'
      case 'error': return 'error'
      case 'warning': return 'warning'
      case 'info': return 'info'
      default: return 'info'
    }
  }

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return '#28a745'
      case 'error': return '#dc3545'
      case 'warning': return '#ffc107'
      case 'info': return '#17a2b8'
      default: return '#6c757d'
    }
  }

  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className="notification"
          style={{ borderLeftColor: getNotificationColor(notification.type) }}
        >
          <div className="notification-content">
            <div className="notification-header">
              <span className="notification-icon">{getNotificationIcon(notification.type)}</span>
              <span className="notification-title">{notification.title}</span>
              <button
                className="notification-close"
                onClick={() => removeNotification(notification.id)}
              >
                ×
              </button>
            </div>
            <div className="notification-message">{notification.message}</div>
            <div className="notification-time">
              {notification.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
