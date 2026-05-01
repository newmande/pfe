import { ApiService } from './apiService'
import type { User } from '../types/api'

export class UserService {
  static async getCurrentUser(): Promise<User | null> {
    const response = await ApiService.get<User>('/api/users/me')
    return response.success ? response.data : null
  }

  static async updateCurrentUser(userData: Partial<User>): Promise<User | null> {
    const response = await ApiService.put<User>('/api/users/me', userData)
    return response.success ? response.data : null
  }

  static async getAllUsers(): Promise<User[]> {
    const response = await ApiService.get<User[]>('/api/users')
    return response.success ? response.data : []
  }

  static async searchByEmail(email: string): Promise<User | null> {
    const response = await ApiService.get<User>(`/api/users/search/email/${email}`)
    return response.success ? response.data : null
  }

  static async updateUser(id: number, userData: Partial<User> & { role?: string }): Promise<User | null> {
    const response = await ApiService.put<User>(`/api/users/${id}`, userData)
    return response.success ? response.data : null
  }

  static async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { password: string; role?: string }): Promise<User | null> {
    const response = await ApiService.post<User>('/api/users', userData)
    return response.success ? response.data : null
  }

  static async deleteUser(id: number): Promise<{ message: string } | null> {
    const response = await ApiService.delete<{ message: string }>(`/api/users/${id}`)
    return response.success ? response.data : null
  }
}
