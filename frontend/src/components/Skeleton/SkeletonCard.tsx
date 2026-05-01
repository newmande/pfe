import React from 'react'
import './SkeletonCard.css'

interface SkeletonCardProps {
  lines?: number
  showAvatar?: boolean
  showButton?: boolean
  height?: string
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ 
  lines = 3, 
  showAvatar = false, 
  showButton = false,
  height = '120px'
}) => {
  return (
    <div className="skeleton-card" style={{ height }}>
      {showAvatar && (
        <div className="skeleton-avatar" />
      )}
      
      <div className="skeleton-content">
        <div className="skeleton-title" />
        {Array.from({ length: lines }).map((_, index) => (
          <div key={index} className="skeleton-line" style={{ width: `${Math.random() * 40 + 60}%` }} />
        ))}
      </div>
      
      {showButton && (
        <div className="skeleton-button" />
      )}
    </div>
  )
}
