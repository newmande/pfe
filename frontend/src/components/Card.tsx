import React from 'react'
import './Card.css'

interface CardProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  className?: string
  hover?: boolean
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  className = '',
  hover = true,
}) => {
  return (
    <div className={`card ${hover ? 'card-hover' : ''} ${className}`}>
      {(title || subtitle) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  )
}
