import { useState, useCallback } from 'react'

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  email?: boolean
  phone?: boolean
  custom?: (value: string) => string | null
}

export interface ValidationRules {
  [key: string]: ValidationRule
}

export interface FormErrors {
  [key: string]: string | null
}

export interface UseFormValidationReturn {
  errors: FormErrors
  validateField: (name: string, value: string, rules?: ValidationRule) => boolean
  validateForm: (data: Record<string, string>, rules?: ValidationRules) => boolean
  clearErrors: () => void
  clearFieldError: (name: string) => void
  hasErrors: boolean
}

export const useFormValidation = (rules?: ValidationRules): UseFormValidationReturn => {
  const [errors, setErrors] = useState<FormErrors>({})

  const validateField = useCallback((name: string, value: string, fieldRules?: ValidationRule): boolean => {
    const validationRules = fieldRules || rules?.[name] || {}
    let errorMessage: string | null = null

    // Required validation
    if (validationRules.required && (!value || value.trim() === '')) {
      errorMessage = `${name} is required`
    }

    // Email validation
    if (!errorMessage && validationRules.email && value) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailPattern.test(value)) {
        errorMessage = 'Please enter a valid email address'
      }
    }

    // Phone validation
    if (!errorMessage && validationRules.phone && value) {
      const phonePattern = /^[\d\s\-\+\(\)]+$/
      if (!phonePattern.test(value) || value.length < 10) {
        errorMessage = 'Please enter a valid phone number'
      }
    }

    // Min length validation
    if (!errorMessage && validationRules.minLength && value) {
      if (value.length < validationRules.minLength) {
        errorMessage = `${name} must be at least ${validationRules.minLength} characters`
      }
    }

    // Max length validation
    if (!errorMessage && validationRules.maxLength && value) {
      if (value.length > validationRules.maxLength) {
        errorMessage = `${name} must be no more than ${validationRules.maxLength} characters`
      }
    }

    // Pattern validation
    if (!errorMessage && validationRules.pattern && value) {
      if (!validationRules.pattern.test(value)) {
        errorMessage = `${name} format is invalid`
      }
    }

    // Custom validation
    if (!errorMessage && validationRules.custom && value) {
      const customError = validationRules.custom(value)
      if (customError) {
        errorMessage = customError
      }
    }

    setErrors(prev => ({
      ...prev,
      [name]: errorMessage
    }))

    return !errorMessage
  }, [rules])

  const validateForm = useCallback((data: Record<string, string>, formRules?: ValidationRules): boolean => {
    const validationRules = formRules || rules || {}
    let isValid = true
    const newErrors: FormErrors = {}

    Object.keys(validationRules).forEach(fieldName => {
      const fieldValue = data[fieldName] || ''
      const fieldRules = validationRules[fieldName]
      
      // Re-use validateField logic but collect errors
      let errorMessage: string | null = null

      if (fieldRules.required && (!fieldValue || fieldValue.trim() === '')) {
        errorMessage = `${fieldName} is required`
      }

      if (!errorMessage && fieldRules.email && fieldValue) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailPattern.test(fieldValue)) {
          errorMessage = 'Please enter a valid email address'
        }
      }

      if (!errorMessage && fieldRules.phone && fieldValue) {
        const phonePattern = /^[\d\s\-\+\(\)]+$/
        if (!phonePattern.test(fieldValue) || fieldValue.length < 10) {
          errorMessage = 'Please enter a valid phone number'
        }
      }

      if (!errorMessage && fieldRules.minLength && fieldValue) {
        if (fieldValue.length < fieldRules.minLength) {
          errorMessage = `${fieldName} must be at least ${fieldRules.minLength} characters`
        }
      }

      if (!errorMessage && fieldRules.maxLength && fieldValue) {
        if (fieldValue.length > fieldRules.maxLength) {
          errorMessage = `${fieldName} must be no more than ${fieldRules.maxLength} characters`
        }
      }

      if (!errorMessage && fieldRules.pattern && fieldValue) {
        if (!fieldRules.pattern.test(fieldValue)) {
          errorMessage = `${fieldName} format is invalid`
        }
      }

      if (!errorMessage && fieldRules.custom && fieldValue) {
        const customError = fieldRules.custom(fieldValue)
        if (customError) {
          errorMessage = customError
        }
      }

      if (errorMessage) {
        newErrors[fieldName] = errorMessage
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }, [rules])

  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  const clearFieldError = useCallback((name: string) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[name]
      return newErrors
    })
  }, [])

  const hasErrors = Object.values(errors).some(error => error !== null)

  return {
    errors,
    validateField,
    validateForm,
    clearErrors,
    clearFieldError,
    hasErrors
  }
}
