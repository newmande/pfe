import React from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Layout } from './components/Layout/Layout'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { Dashboard } from './pages/Dashboard'
import { VehiclesManagementPage } from './pages/VehiclesManagementPage'
import { ReservationsPage } from './pages/ReservationsPage'
import { AdminUsersPage } from './pages/AdminUsersPage'
import { PricingPage } from './pages/PricingPage'
import { DriversManagementPage } from './pages/DriversManagementPage'
import { DriverDashboard } from './pages/DriverDashboard'
import { ErrorBoundary } from './components/ErrorBoundary'

type Page = 'login' | 'register' | 'forgot-password' | 'reset-password' | 'demo' | 'dashboard' | 'vehicles' | 'reservations' | 'new-reservation' | 'reservations-admin' | 'my-reservations' | 'pricing' | 'pricing-admin' | 'users' | 'drivers' | 'driver-dashboard'

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth()
  const [currentPage, setCurrentPage] = React.useState<Page>('login')

  React.useEffect(() => {
    if (isAuthenticated && currentPage === 'login') {
      setCurrentPage('dashboard')
    }
  }, [isAuthenticated, currentPage])

  // Check if user is accessing reset password page from email link
  React.useEffect(() => {
    const isResetPasswordPage = window.location.search && window.location.search.includes('email=')
    if (isResetPasswordPage && currentPage !== 'reset-password') {
      setCurrentPage('reset-password')
    }
  }, [currentPage])

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    )
  }

  // Check if user is accessing reset password page directly from email link
  const isResetPasswordPage = window.location.pathname === '/reset-password' || 
                            (window.location.search && window.location.search.includes('email='))

  if (!isAuthenticated || isResetPasswordPage) {
    return (
      <div className="auth-pages">
        {currentPage === 'login' ? (
          <LoginPage 
            onNavigateToRegister={() => setCurrentPage('register')}
            onNavigateToForgotPassword={() => setCurrentPage('forgot-password')}
          />
        ) : currentPage === 'register' ? (
          <RegisterPage onNavigateToLogin={() => setCurrentPage('login')} />
        ) : currentPage === 'forgot-password' ? (
          <ForgotPasswordPage onNavigateToLogin={() => setCurrentPage('login')} />
        ) : currentPage === 'reset-password' || isResetPasswordPage ? (
          <ResetPasswordPage />
        ) : (
          <LoginPage 
            onNavigateToRegister={() => setCurrentPage('register')}
            onNavigateToForgotPassword={() => setCurrentPage('forgot-password')}
          />
        )}
      </div>
    )
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={(page) => setCurrentPage(page as Page)} />
      case 'vehicles':
        return <VehiclesManagementPage />
      case 'reservations':
        return <ReservationsPage />
      case 'new-reservation':
        return <ReservationsPage showFormInitially={true} />
      case 'reservations-admin':
        return <ReservationsPage />
      case 'my-reservations':
        return <ReservationsPage myReservationsOnly={true} />
      case 'pricing':
      case 'pricing-admin':
        return <PricingPage />
      case 'users':
        return <AdminUsersPage />
      case 'drivers':
        return <DriversManagementPage />
      case 'driver-dashboard':
        return <DriverDashboard />
      case 'demo':
        return <ReservationsPage />
      default:
        return <Dashboard />
    }
  }

  return (
    <Layout currentPage={currentPage} onPageChange={(page: string) => setCurrentPage(page as Page)}>
      {renderPage()}
    </Layout>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
