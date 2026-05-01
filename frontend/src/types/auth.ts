export interface User {
  id: number
  name: string
  email: string
  phone?: string
  roles: string[]
  location?: {
    latitude: number
    longitude: number
  }
}

export interface AuthResponse {
  token: string
  roles: string[]
  user: {
    id: number
    name: string
  }
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
  phone: string
}

export type UserRole = 'user' | 'admin'

export interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<string>
  logout: () => void
  loading: boolean
}
