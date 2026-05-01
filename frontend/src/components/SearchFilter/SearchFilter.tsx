import React, { useState } from 'react'
import { Button } from '../Button'
import './SearchFilter.css'

interface SearchFilterProps {
  onSearch: (query: string) => void
  onFilter: (filters: Record<string, any>) => void
  placeholder?: string
  filters?: Array<{
    key: string
    label: string
    options: Array<{ value: string; label: string }>
  }>
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  onSearch,
  onFilter,
  placeholder = 'Search...',
  filters = []
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = () => {
    onSearch(searchQuery.trim())
  }

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...activeFilters, [key]: value }
    setActiveFilters(newFilters)
    onFilter(newFilters)
  }

  const clearFilters = () => {
    setActiveFilters({})
    setSearchQuery('')
    onSearch('')
    onFilter({})
  }

  const hasActiveFilters = Object.values(activeFilters).some(value => value !== '') || searchQuery.trim() !== ''

  return (
    <div className="search-filter">
      <div className="search-bar">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          className="search-input"
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button variant="primary" onClick={handleSearch}>
          Search
        </Button>
        
        {filters.length > 0 && (
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
          >
            Filters {hasActiveFilters && `(${Object.values(activeFilters).filter(v => v !== '').length})`}
          </Button>
        )}
        
        {hasActiveFilters && (
          <Button variant="secondary" onClick={clearFilters}>
            Clear
          </Button>
        )}
      </div>

      {showFilters && filters.length > 0 && (
        <div className="filters-panel">
          <div className="filters-grid">
            {filters.map(filter => (
              <div key={filter.key} className="filter-group">
                <label>{filter.label}</label>
                <select
                  value={activeFilters[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  className="filter-select"
                >
                  <option value="">All</option>
                  {filter.options.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
