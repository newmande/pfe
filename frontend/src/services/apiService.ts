import type { ApiResponse, ApiError } from '../types/api'
import { apiConfig } from '../config/api'

export class ApiService {
  static async request<T = unknown>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
    data?: unknown,
    customHeaders?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const url = `${apiConfig.baseURL}${endpoint}`
    
    const headers: Record<string, string> = {
      ...apiConfig.headers,
      ...customHeaders,
    }

    // Add auth token if available
    const token = localStorage.getItem('auth_token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const requestOptions: RequestInit = {
      method,
      headers,
    }

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      requestOptions.body = JSON.stringify(data)
    }

    console.log('API Request:', { url, method, headers, body: requestOptions.body });

    try {
      const response = await fetch(url, requestOptions)
      const responseData = await response.json()

      console.log('API Response:', response.status, responseData);

      if (!response.ok) {
        const error: ApiError = {
          message: responseData.error || responseData.message || `HTTP ${response.status}`,
          code: responseData.code,
          status: response.status,
        }
        console.log('API Error:', error);
        throw error
      }

      return {
        success: true,
        data: responseData,
      }
    } catch (error) {
      const apiError = error instanceof Error
        ? { message: error.message }
        : typeof error === 'object' && error !== null && 'message' in error
          ? (error as ApiError)
          : { message: 'Unknown error occurred' }

      console.log('API Service Error:', apiError);
      
      return {
        success: false,
        error: apiError.message,
        code: (apiError as ApiError).code,
      }
    }
  }

  static get<T = unknown>(endpoint: string, headers?: Record<string, string>) {
    return this.request<T>(endpoint, 'GET', undefined, headers)
  }

  static post<T = unknown>(
    endpoint: string,
    data?: unknown,
    headers?: Record<string, string>
  ) {
    return this.request<T>(endpoint, 'POST', data, headers)
  }

  static put<T = unknown>(
    endpoint: string,
    data?: unknown,
    headers?: Record<string, string>
  ) {
    return this.request<T>(endpoint, 'PUT', data, headers)
  }

  static delete<T = unknown>(endpoint: string, headers?: Record<string, string>) {
    return this.request<T>(endpoint, 'DELETE', undefined, headers)
  }

  static patch<T = unknown>(
    endpoint: string,
    data?: unknown,
    headers?: Record<string, string>
  ) {
    return this.request<T>(endpoint, 'PATCH', data, headers)
  }
}

export default ApiService
