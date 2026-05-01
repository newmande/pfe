import type { User, Driver, Vehicle, Reservation, PricingRule } from '../types/api'

export const exportToCSV = (data: any[], filename: string, headers?: Record<string, string>) => {
  if (data.length === 0) {
    alert('No data to export')
    return
  }

  const csvHeaders = headers || Object.keys(data[0])
  const csvContent = [
    (csvHeaders as string[]).join(','),
    ...data.map(row => 
      (csvHeaders as string[]).map(header => {
        const value = row[header] || ''
        // Escape quotes and wrap in quotes if contains comma
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const exportUsersToCSV = (users: User[]) => {
  const headers = {
    id: 'ID',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    roles: 'Roles',
    createdAt: 'Created At'
  }
  
  const processedData = users.map(user => ({
    ...user,
    roles: user.roles?.join(', ') || 'User',
    createdAt: new Date(user.createdAt).toLocaleDateString()
  }))
  
  exportToCSV(processedData, 'users', headers)
}

export const exportDriversToCSV = (drivers: Driver[]) => {
  const headers = {
    id: 'ID',
    name: 'Name',
    phone: 'Phone',
    availability: 'Availability',
    location: 'Location'
  }
  
  const processedData = drivers.map(driver => ({
    ...driver,
    availability: driver.availability ? 'Available' : 'Unavailable',
    location: driver.location 
      ? `${driver.location.latitude}, ${driver.location.longitude}`
      : 'Not set'
  }))
  
  exportToCSV(processedData, 'drivers', headers)
}

export const exportVehiclesToCSV = (vehicles: Vehicle[]) => {
  const headers = {
    id: 'ID',
    model: 'Model',
    license: 'License',
    type: 'Type',
    category: 'Category',
    capacity: 'Capacity',
    availability: 'Availability'
  }
  
  const processedData = vehicles.map(vehicle => ({
    ...vehicle,
    availability: vehicle.availability ? 'Available' : 'Unavailable'
  }))
  
  exportToCSV(processedData, 'vehicles', headers)
}

export const exportReservationsToCSV = (reservations: Reservation[]) => {
  const headers = {
    id: 'ID',
    datetime: 'Date & Time',
    pickupLocation: 'Pickup Location',
    dropoffLocation: 'Dropoff Location',
    status: 'Status',
    passengers: 'Passengers',
    price: 'Price',
    distance: 'Distance',
    duration: 'Duration',
    driver: 'Driver',
    vehicle: 'Vehicle'
  }
  
  const processedData = reservations.map(reservation => ({
    ...reservation,
    driver: reservation.driver?.name || 'Not assigned',
    vehicle: reservation.vehicle ? `${reservation.vehicle.model} (${reservation.vehicle.license})` : 'Not assigned'
  }))
  
  exportToCSV(processedData, 'reservations', headers)
}

export const exportPricingToCSV = (pricing: PricingRule[]) => {
  const headers = {
    id: 'ID',
    vehicleType: 'Vehicle Type',
    categoryType: 'Category Type',
    baseFare: 'Base Fare',
    pricePerKm: 'Price per KM',
    minimumFare: 'Minimum Fare',
    maximumFare: 'Maximum Fare',
    surgeMultiplier: 'Surge Multiplier',
    active: 'Active',
    createdAt: 'Created At'
  }
  
  const processedData = pricing.map(rule => ({
    ...rule,
    active: rule.active ? 'Yes' : 'No',
    createdAt: rule.createdAt ? new Date(rule.createdAt).toLocaleDateString() : 'N/A'
  }))
  
  exportToCSV(processedData, 'pricing', headers)
}

export const exportToJSON = (data: any[], filename: string) => {
  if (data.length === 0) {
    alert('No data to export')
    return
  }

  const jsonContent = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.json`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
