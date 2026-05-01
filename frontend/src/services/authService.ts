import { ApiService } from './apiService'
import type { User } from '../types/api'

export class AuthService {
  static async login(email: string, password: string): Promise<{ token: string; roles: string[]; user: { id: number; name: string } } | null> {
    const requestData = { email, password };
    console.log('Login request data:', requestData);
    
    const response = await ApiService.post<{ token: string; roles: string[]; user: { id: number; name: string } }>('/auth/login', requestData)
    
    console.log('Login response:', response);

    if (response.success && response.data) {
      localStorage.setItem('auth_token', response.data.token)
      return response.data
    }
    return null
  }

  static async register(email: string, password: string, name: string, phone: string): Promise<string | null> {
    const response = await ApiService.post<{ message: string }>('/auth/register', {
      email,
      password,
      name,
      phone,
    })

    if (response.success && response.data) {
      return response.data.message
    }
    return null
  }

  static async logout(): Promise<void> {
    await ApiService.post('/auth/logout')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
  }

  static getToken(): string | null {
    return localStorage.getItem('auth_token')
  }

  static isAuthenticated(): boolean {
    return !!this.getToken()
  }

  static async forgotPassword(email: string): Promise<{ message: string; resetUrl?: string } | null> {
    const response = await ApiService.post<{ message: string; resetUrl?: string }>('/auth/forgot_password', {
      email,
    })

    if (response.success && response.data) {
      return {
        message: response.data.message,
        resetUrl: response.data.resetUrl
      }
    }
    return null
  }

  static async resetPassword(email: string, password: string): Promise<string | null> {
    const response = await ApiService.post<{ message: string }>(`/auth/verify-forgot_password?email=${email}`, {
      password,
    })

    if (response.success && response.data) {
      return response.data.message
    }
    return null
  }

  static async getCurrentUser(): Promise<User | null> {
    const response = await ApiService.get<User>('/api/users/me')
    if (response.success && response.data) {
      return response.data
    }
    return null
  }
}
