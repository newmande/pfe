import type { ValidationRules } from '../hooks/useFormValidation'

export const authValidationRules: ValidationRules = {
  email: {
    required: true,
    email: true
  },
  password: {
    required: true,
    minLength: 6,
    custom: (value: string) => {
      if (!/(?=.*[a-z])/.test(value)) {
        return 'Password must contain at least one lowercase letter'
      }
      if (!/(?=.*[A-Z])/.test(value)) {
        return 'Password must contain at least one uppercase letter'
      }
      if (!/(?=.*\d)/.test(value)) {
        return 'Password must contain at least one number'
      }
      return null
    }
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s]+$/
  },
  phone: {
    required: true,
    phone: true,
    minLength: 10,
    maxLength: 15
  }
}

export const reservationValidationRules: ValidationRules = {
  pickupLocation: {
    required: true,
    minLength: 5
  },
  dropoffLocation: {
    required: true,
    minLength: 5
  },
  datetime: {
    required: true,
    custom: (value: string) => {
      const date = new Date(value)
      const now = new Date()
      if (date <= now) {
        return 'Reservation time must be in the future'
      }
      return null
    }
  },
  numberOfPassengers: {
    required: true,
    custom: (value: string) => {
      const num = parseInt(value)
      if (isNaN(num) || num < 1 || num > 8) {
        return 'Number of passengers must be between 1 and 8'
      }
      return null
    }
  }
}

export const vehicleValidationRules: ValidationRules = {
  model: {
    required: true,
    minLength: 2,
    maxLength: 50
  },
  license: {
    required: true,
    minLength: 5,
    maxLength: 15,
    pattern: /^[A-Za-z0-9-]+$/
  },
  type: {
    required: true
  },
  category: {
    required: true
  },
  capacity: {
    required: true,
    custom: (value: string) => {
      const num = parseInt(value)
      if (isNaN(num) || num < 1 || num > 8) {
        return 'Capacity must be between 1 and 8 passengers'
      }
      return null
    }
  }
}

export const driverValidationRules: ValidationRules = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s]+$/
  },
  phone: {
    required: true,
    phone: true,
    minLength: 10,
    maxLength: 15
  }
}

export const pricingValidationRules: ValidationRules = {
  vehicleType: {
    required: true
  },
  categoryType: {
    required: true
  },
  baseFare: {
    required: true,
    custom: (value: string) => {
      const num = parseFloat(value)
      if (isNaN(num) || num <= 0) {
        return 'Base fare must be a positive number'
      }
      return null
    }
  },
  pricePerKm: {
    required: true,
    custom: (value: string) => {
      const num = parseFloat(value)
      if (isNaN(num) || num <= 0) {
        return 'Price per KM must be a positive number'
      }
      return null
    }
  },
  minimumFare: {
    required: true,
    custom: (value: string) => {
      const num = parseFloat(value)
      if (isNaN(num) || num <= 0) {
        return 'Minimum fare must be a positive number'
      }
      return null
    }
  },
  maximumFare: {
    custom: (value: string) => {
      if (!value) return null
      const num = parseFloat(value)
      if (isNaN(num) || num <= 0) {
        return 'Maximum fare must be a positive number'
      }
      return null
    }
  },
  surgeMultiplier: {
    custom: (value: string) => {
      if (!value) return null
      const num = parseFloat(value)
      if (isNaN(num) || num < 1 || num > 5) {
        return 'Surge multiplier must be between 1 and 5'
      }
      return null
    }
  }
}
