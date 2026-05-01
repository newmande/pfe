import { ApiService } from './apiService'
import type { Vehicle } from '../types/api'

export class VehicleService {
  static async getAllVehicles(): Promise<Vehicle[]> {
    const response = await ApiService.get<Vehicle[]>('/api/vehicles')
    return response.success ? response.data : []
  }

  static async getAvailableVehicles(): Promise<Vehicle[]> {
    const response = await ApiService.get<Vehicle[]>('/api/vehicles/available')
    return response.success ? response.data : []
  }

  static async getVehiclesByType(type: string): Promise<Vehicle[]> {
    const response = await ApiService.get<Vehicle[]>(`/api/vehicles/type/${type}`)
    return response.success ? response.data : []
  }

  static async getVehicle(id: number): Promise<Vehicle | null> {
    const response = await ApiService.get<Vehicle>(`/api/vehicles/${id}`)
    return response.success ? response.data : null
  }

  static async searchVehiclesByModel(model: string): Promise<Vehicle[]> {
    const response = await ApiService.get<Vehicle[]>(`/api/vehicles/search/${model}`)
    return response.success ? response.data : []
  }

  static async createVehicle(vehicleData: Omit<Vehicle, 'id' | 'availability'>): Promise<Vehicle | null> {
    const response = await ApiService.post<Vehicle>('/api/vehicles', vehicleData)
    return response.success ? response.data : null
  }

  static async updateVehicle(id: number, vehicleData: Partial<Vehicle>): Promise<Vehicle | null> {
    const response = await ApiService.put<Vehicle>(`/api/vehicles/${id}`, vehicleData)
    return response.success ? response.data : null
  }

  static async deleteVehicle(id: number): Promise<{ message: string } | null> {
    const response = await ApiService.delete<{ message: string }>(`/api/vehicles/${id}`)
    return response.success ? response.data : null
  }
}
