// Test the complete password reset flow
export const testPasswordReset = async () => {
  const resetUrl = "http://localhost:8000/auth/verify-forgot_password?email=play4store7%40gmail.com&expires=1777491470&signature=5BgSXALe7tI_vRsxkUgK1OLFp-gxVq3G0aCPkl4XsH4&timestamp=1777487870&token=KgYxEFnl8AK6ps1fKNH3lB7nxbooMIA87%2BdQ%2BkGyfrM%3D"
  
  console.log('=== Testing Password Reset POST ===')
  console.log('Reset URL:', resetUrl)
  
  try {
    // Test POST request with new password
    const response = await fetch(resetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        password: 'NewPassword123'
      })
    })

    const data = await response.json()
    
    console.log('Response Status:', response.status)
    console.log('Response Data:', data)
    
    if (response.ok) {
      console.log('SUCCESS: Password reset completed!')
      console.log('Message:', data.message)
    } else {
      console.log('ERROR: Password reset failed')
      console.log('Error:', data.error)
    }
    
    return { success: response.ok, data }
    
  } catch (error) {
    console.error('Network Error:', error)
    return { success: false, error }
  }
}

// Run this in browser console to test
export const runTest = () => {
  console.log('Starting password reset test...')
  testPasswordReset()
}
