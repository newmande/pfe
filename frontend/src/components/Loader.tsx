import React from 'react'
import './Loader.css'

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
}

export const Loader: React.FC<LoaderProps> = ({ size = 'md', message }) => {
  return (
    <div className={`loader-container loader-${size}`}>
      <div className="spinner"></div>
      {message && <p className="loader-message">{message}</p>}
    </div>
  )
}
