export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  code?: number
}

export interface ApiError {
  message: string
  code?: number
  status?: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

export interface User {
  id: number
  email: string
  name: string
  createdAt: string
  updatedAt: string
  phone?: string
  roles?: string[]
  location?: {
    latitude: number
    longitude: number
  } | null
}

export interface AuthToken {
  token: string
  refreshToken?: string
  expiresIn?: number
}

export interface Driver {
  id: number
  name: string
  phone?: string
  availability?: boolean
  location?: {
    latitude?: number
    longitude?: number
  }
}

export interface Vehicle {
  id: number
  model: string
  license: string
  type: string
  category: string
  capacity: number
  availability: boolean
}

export interface PricingRule {
  id: number
  vehicleType: string
  categoryType: string
  baseFare: number
  pricePerKm: number
  minimumFare: number
  maximumFare?: number
  surgeMultiplier?: number
  active: boolean
  description?: string
  notes?: string
  createdAt?: string
  updatedAt?: string | null
}

export interface Reservation {
  id: number
  datetime: string
  pickupLocation: string
  dropoffLocation: string
  status: string
  passengers: number
  category?: string
  price: string
  distance: string
  duration: string
  driver?: {
    id: number
    name: string
  } | null
  vehicle?: {
    model: string
    license: string
  } | null
  user?: {
    id: number
    name: string
    email: string
  } | null
}
