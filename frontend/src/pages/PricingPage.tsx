import React, { useEffect, useState } from 'react'
import { PricingService } from '../services/pricingService'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Alert } from '../components/Alert'
import { Loader } from '../components/Loader'
import type { PricingRule } from '../types/api'
import './PricingPage.css'

const VEHICLE_TYPES = ['sedan', 'van', 'suv', 'luxury']
const CATEGORY_TYPES = ['standard', 'premium', 'business']

const initialFormData = {
  vehicleType: 'sedan',
  categoryType: 'standard',
  baseFare: '',
  pricePerKm: '',
  minimumFare: '',
  maximumFare: '',
  surgeMultiplier: '',
  active: true,
  description: '',
  notes: ''
}

export const PricingPage: React.FC = () => {
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null)
  const [formData, setFormData] = useState(initialFormData)

  useEffect(() => {
    loadPricingRules()
  }, [])

  const loadPricingRules = async () => {
    try {
      setLoading(true)
      setError(null)
      const rules = await PricingService.getAllPricing()
      setPricingRules(rules)
    } catch (err: any) {
      setError(err.message || 'Failed to load pricing rules')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const pricingData = {
        ...formData,
        baseFare: parseFloat(formData.baseFare),
        pricePerKm: parseFloat(formData.pricePerKm),
        minimumFare: parseFloat(formData.minimumFare),
        maximumFare: formData.maximumFare ? parseFloat(formData.maximumFare) : undefined,
        surgeMultiplier: formData.surgeMultiplier ? parseFloat(formData.surgeMultiplier) : undefined
      }

      if (editingRule) {
        await PricingService.updatePricing(editingRule.id, pricingData)
      } else {
        await PricingService.createPricing(pricingData)
      }

      setFormData(initialFormData)
      setShowForm(false)
      setEditingRule(null)
      await loadPricingRules()
    } catch (err: any) {
      setError(err.message || `Failed to ${editingRule ? 'update' : 'create'} pricing rule`)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (rule: PricingRule) => {
    setEditingRule(rule)
    setFormData({
      vehicleType: rule.vehicleType,
      categoryType: rule.categoryType,
      baseFare: rule.baseFare.toString(),
      pricePerKm: rule.pricePerKm.toString(),
      minimumFare: rule.minimumFare.toString(),
      maximumFare: rule.maximumFare?.toString() || '',
      surgeMultiplier: rule.surgeMultiplier?.toString() || '',
      active: rule.active,
      description: rule.description || '',
      notes: rule.notes || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this pricing rule?')) return

    try {
      setLoading(true)
      await PricingService.deletePricing(id)
      await loadPricingRules()
    } catch (err: any) {
      setError(err.message || 'Failed to delete pricing rule')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingRule(null)
    setFormData(initialFormData)
  }

  if (loading && pricingRules.length === 0) {
    return (
      <div className="pricing-page">
        <div className="loading-container">
          <Loader size="lg" message="Loading pricing rules..." />
        </div>
      </div>
    )
  }

  return (
    <div className="pricing-page">
      <div className="page-header">
        <h1>Pricing Management</h1>
        <p>Configure transport pricing rules and fare structures</p>
        <Button variant="primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Pricing Rule'}
        </Button>
      </div>

      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      {showForm && (
        <Card className="pricing-form-card">
          <h2>{editingRule ? 'Edit Pricing Rule' : 'Create Pricing Rule'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Vehicle Type *</label>
                <select name="vehicleType" value={formData.vehicleType} onChange={handleInputChange} required>
                  {VEHICLE_TYPES.map(type => (
                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select name="categoryType" value={formData.categoryType} onChange={handleInputChange} required>
                  {CATEGORY_TYPES.map(cat => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Base Fare (TND) *</label>
                <input type="number" name="baseFare" value={formData.baseFare} onChange={handleInputChange} step="0.01" min="0" required />
              </div>
              <div className="form-group">
                <label>Price per km (TND) *</label>
                <input type="number" name="pricePerKm" value={formData.pricePerKm} onChange={handleInputChange} step="0.01" min="0" required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Minimum Fare (TND) *</label>
                <input type="number" name="minimumFare" value={formData.minimumFare} onChange={handleInputChange} step="0.01" min="0" required />
              </div>
              <div className="form-group">
                <label>Maximum Fare (TND)</label>
                <input type="number" name="maximumFare" value={formData.maximumFare} onChange={handleInputChange} step="0.01" min="0" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Surge Multiplier</label>
                <input type="number" name="surgeMultiplier" value={formData.surgeMultiplier} onChange={handleInputChange} step="0.1" min="1" placeholder="1.0" />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input type="checkbox" name="active" checked={formData.active} onChange={handleInputChange} />
                  Active
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <input type="text" name="description" value={formData.description} onChange={handleInputChange} placeholder="e.g., Standard city fare" />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows={2} placeholder="Additional pricing notes..." />
            </div>

            <div className="form-actions">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? <Loader size="sm" /> : (editingRule ? 'Update Rule' : 'Create Rule')}
              </Button>
              <Button type="button" variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="pricing-list">
        <h2>Pricing Rules ({pricingRules.length})</h2>
        {pricingRules.length === 0 ? (
          <Card className="empty-state">
            <div className="empty-icon">💰</div>
            <p>No pricing rules configured yet</p>
          </Card>
        ) : (
          pricingRules.map((rule) => (
            <Card key={rule.id} className="pricing-card">
              <div className="pricing-header">
                <div className="pricing-type">
                  <h3>{rule.vehicleType.charAt(0).toUpperCase() + rule.vehicleType.slice(1)} - {rule.categoryType.charAt(0).toUpperCase() + rule.categoryType.slice(1)}</h3>
                  <span className={`status-badge ${rule.active ? 'active' : 'inactive'}`}>
                    {rule.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="pricing-fare">
                  <strong>{rule.baseFare} TND</strong>
                  <small>Base fare</small>
                </div>
              </div>
              <div className="pricing-details">
                <div className="detail-row">
                  <span>Per km:</span>
                  <span>{rule.pricePerKm} TND</span>
                </div>
                <div className="detail-row">
                  <span>Min fare:</span>
                  <span>{rule.minimumFare} TND</span>
                </div>
                <div className="detail-row">
                  <span>Max fare:</span>
                  <span>{rule.maximumFare ? rule.maximumFare + ' TND' : 'No limit'}</span>
                </div>
                {rule.surgeMultiplier && (
                  <div className="detail-row">
                    <span>Surge:</span>
                    <span>{rule.surgeMultiplier}x</span>
                  </div>
                )}
                {rule.description && (
                  <div className="detail-row description">
                    <span>{rule.description}</span>
                  </div>
                )}
              </div>
              <div className="pricing-actions">
                <Button variant="primary" size="sm" onClick={() => handleEdit(rule)}>
                  Edit
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(rule.id)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
