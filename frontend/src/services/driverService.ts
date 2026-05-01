import { ApiService } from './apiService'
import type { Driver } from '../types/api'

export class DriverService {
  static async getAllDrivers(): Promise<Driver[]> {
    const response = await ApiService.get<Driver[]>('/api/drivers')
    return response.success ? response.data : []
  }

  static async getAvailableDrivers(): Promise<Driver[]> {
    const response = await ApiService.get<Driver[]>('/api/drivers/available')
    return response.success ? response.data : []
  }

  static async getDriver(id: number): Promise<Driver | null> {
    const response = await ApiService.get<Driver>(`/api/drivers/${id}`)
    return response.success ? response.data : null
  }

  static async createDriver(driverData: Omit<Driver, 'id'>): Promise<Driver | null> {
    const response = await ApiService.post<Driver>('/api/drivers', driverData)
    return response.success ? response.data : null
  }

  static async updateDriver(id: number, driverData: Partial<Driver>): Promise<Driver | null> {
    const response = await ApiService.put<Driver>(`/api/drivers/${id}`, driverData)
    return response.success ? response.data : null
  }

  static async deleteDriver(id: number): Promise<{ message: string } | null> {
    const response = await ApiService.delete<{ message: string }>(`/api/drivers/${id}`)
    return response.success ? response.data : null
  }
}
