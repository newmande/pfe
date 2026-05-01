/**
 * API Configuration
 * Centralized configuration for backend API communication
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

/**
 * Fetch wrapper for API calls
 */
export async function apiCall<T = unknown>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  data?: unknown,
  headers?: Record<string, string>
): Promise<T> {
  const url = `${apiConfig.baseURL}${endpoint}`;
  
  const requestOptions: RequestInit = {
    method,
    headers: {
      ...apiConfig.headers,
      ...headers,
    },
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    requestOptions.body = JSON.stringify(data);
  }

  const response = await fetch(url, requestOptions);

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export default apiConfig;
