import { useState, useCallback } from 'react'
import { ApiService } from '../services/apiService'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApi<T = unknown>(
  initialData: T | null = null
): UseApiState<T> & {
  execute: (endpoint: string, method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH', payload?: unknown) => Promise<T | null>
  reset: () => void
  setData: (data: T | null) => void
} {
  const [state, setState] = useState<UseApiState<T>>({
    data: initialData,
    loading: false,
    error: null,
  })

  const execute = useCallback(
    async (
      endpoint: string,
      method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
      payload?: unknown
    ): Promise<T | null> => {
      setState({ data: state.data, loading: true, error: null })

      const response = await ApiService.request<T>(endpoint, method, payload)

      if (response.success && response.data) {
        setState({ data: response.data, loading: false, error: null })
        return response.data
      } else {
        setState({ data: null, loading: false, error: response.error || 'An error occurred' })
        return null
      }
    },
    [state.data]
  )

  const reset = useCallback(() => {
    setState({ data: initialData, loading: false, error: null })
  }, [initialData])

  const setData = useCallback((data: T | null) => {
    setState((prev) => ({ ...prev, data }))
  }, [])

  return { ...state, execute, reset, setData }
}

export default useApi
