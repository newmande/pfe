import { useState, useCallback } from 'react'

export interface ErrorHandler {
  error: string | null
  setError: (error: string | null) => void
  clearError: () => void
  handleError: (error: unknown, defaultMessage?: string) => void
}

export const useErrorHandler = (): ErrorHandler => {
  const [error, setErrorState] = useState<string | null>(null)

  const setError = useCallback((error: string | null) => {
    setErrorState(error)
  }, [])

  const clearError = useCallback(() => {
    setErrorState(null)
  }, [])

  const handleError = useCallback((error: unknown, defaultMessage = 'An unexpected error occurred') => {
    let errorMessage = defaultMessage

    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = (error as { message: string }).message
    }

    setErrorState(errorMessage)
  }, [])

  return {
    error,
    setError,
    clearError,
    handleError
  }
}
