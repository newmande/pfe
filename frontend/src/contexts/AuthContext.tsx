import React, { createContext, useContext, useState, useEffect } from 'react'
import { AuthService } from '../services/authService'
import type { User, AuthContextType, LoginCredentials, RegisterData } from '../types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const isAuthenticated = !!token && !!user
  const isAdmin = user?.roles.includes('ROLE_ADMIN') || false

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('auth_token')
      if (storedToken) {
        try {
          const currentUser = await AuthService.getCurrentUser()
          if (currentUser) {
            const adaptedUser: User = {
              id: currentUser.id,
              name: currentUser.name,
              email: currentUser.email,
              phone: currentUser.phone,
              roles: currentUser.roles || ['ROLE_USER'],
              location: currentUser.location || undefined
            }
            setUser(adaptedUser)
            setToken(storedToken)
          } else {
            localStorage.removeItem('auth_token')
          }
        } catch (error) {
          console.error('Failed to get current user:', error)
          localStorage.removeItem('auth_token')
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      const response = await AuthService.login(credentials.email, credentials.password)
      if (response) {
        const currentUser = await AuthService.getCurrentUser()
        if (currentUser) {
          const adaptedUser: User = {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            phone: currentUser.phone,
            roles: currentUser.roles || ['ROLE_USER'],
            location: currentUser.location || undefined
          }
          setUser(adaptedUser)
          setToken(response.token)
        }
      } else {
        throw new Error('Login failed')
      }
    } catch (error) {
      throw error
    }
  }

  const register = async (data: RegisterData): Promise<string> => {
    try {
      const message = await AuthService.register(data.email, data.password, data.name, data.phone)
      return message || 'Registration successful'
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    AuthService.logout()
    setUser(null)
    setToken(null)
  }

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
