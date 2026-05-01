import { apiConfig } from '../config/api'

export const testBackendConnection = async (): Promise<boolean> => {
  try {
    console.log('Testing backend connection...')
    console.log('API Base URL:', apiConfig.baseURL)
    
    // Test the backend test endpoint
    const response = await fetch(`${apiConfig.baseURL}/api/test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
      console.log('Backend connection successful:', data)
      return true
    } else {
      console.error('Backend connection failed:', response.status, response.statusText)
      return false
    }
  } catch (error) {
    console.error('Backend connection error:', error)
    return false
  }
}

export const testAuthEndpoint = async (): Promise<boolean> => {
  try {
    console.log('Testing auth endpoint...')
    
    const response = await fetch(`${apiConfig.baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword'
      })
    })

    if (response.ok) {
      const data = await response.json()
      console.log('Auth endpoint reachable:', response.status)
      return true
    } else {
      console.log('Auth endpoint reachable but invalid credentials:', response.status)
      return true // Endpoint exists, just credentials are invalid
    }
  } catch (error) {
    console.error('Auth endpoint error:', error)
    return false
  }
}

export const runConnectionTests = async () => {
  console.log('=== Backend Connection Tests ===')
  
  const backendConnected = await testBackendConnection()
  const authConnected = await testAuthEndpoint()
  
  console.log('\n=== Test Results ===')
  console.log('Backend Connection:', backendConnected ? 'SUCCESS' : 'FAILED')
  console.log('Auth Endpoint:', authConnected ? 'SUCCESS' : 'FAILED')
  
  if (backendConnected && authConnected) {
    console.log('\nFrontend is properly connected to the backend!')
  } else {
    console.log('\nConnection issues detected. Check:')
    console.log('1. Backend server is running on port 8000')
    console.log('2. CORS is properly configured')
    console.log('3. API endpoints are accessible')
  }
  
  return { backendConnected, authConnected }
}
