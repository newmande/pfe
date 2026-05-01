import { ApiService } from './apiService'
import type { Reservation } from '../types/api'

export interface ReservationData {
  datetime: string
  pickupLocation: string
  dropoffLocation: string
  numberOfPassengers: number
  type?: string
  category?: string
}

export interface PaginatedReservations {
  data: Reservation[]
  pagination: {
    total: number
    page: number
    pages: number
  }
}

export class ReservationService {
  static async createReservation(reservationData: ReservationData): Promise<{ message: string } | null> {
    const response = await ApiService.post<{ message: string }>('/api/reservations', reservationData)
    return response.success ? response.data : null
  }

  static async getMyReservations(): Promise<Reservation[]> {
    const response = await ApiService.get<Reservation[]>('/api/reservations/my-reservations')
    return response.success ? response.data : []
  }

  static async getAllReservations(page: number = 1, limit: number = 20): Promise<PaginatedReservations | null> {
    const response = await ApiService.get<PaginatedReservations>(`/api/reservations?page=${page}&limit=${limit}`)
    return response.success ? response.data : null
  }

  static async deleteReservation(id: number): Promise<{ message: string } | null> {
    const response = await ApiService.delete<{ message: string }>(`/api/reservations/${id}`)
    return response.success ? response.data : null
  }

  static async confirmReservation(id: number): Promise<{ message: string } | null> {
    const response = await ApiService.get<{ message: string }>(`/api/reservations/reservation-confirm/${id}`)
    return response.success ? response.data : null
  }

  static async getDriverReservations(): Promise<Reservation[]> {
    const response = await ApiService.get<Reservation[]>('/api/reservations/driver-reservations')
    return response.success ? response.data : []
  }

  static async updateReservationStatus(id: number, status: string): Promise<{ message: string } | null> {
    const response = await ApiService.patch<{ message: string }>(`/api/reservations/${id}/status`, { status })
    return response.success ? response.data : null
  }

  static async updateReservation(id: number, reservationData: Partial<ReservationData>): Promise<{ message: string; reservation: Reservation } | null> {
    const response = await ApiService.put<{ message: string; reservation: Reservation }>(`/api/reservations/${id}`, reservationData)
    return response.success ? response.data : null
  }
}
