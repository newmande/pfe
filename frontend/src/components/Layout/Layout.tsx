import React from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { ErrorBoundary } from '../ErrorBoundary'
import './Layout.css'

interface LayoutProps {
  children: React.ReactNode
  currentPage: string
  onPageChange: (page: string) => void
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onPageChange }) => {
  return (
    <ErrorBoundary>
      <div className="layout">
        <Header />
        <div className="layout-body">
          <Sidebar currentPage={currentPage} onPageChange={onPageChange} />
          <main className="layout-main">
            <div className="main-content">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  )
}
