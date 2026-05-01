import React from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Alert } from '../components/Alert'
import { Loader } from '../components/Loader'
import { PricingService } from '../services/pricingService'
import type { PricingRule } from '../types/api'
import './Pricing.css'

export const Pricing: React.FC = () => {
  const [pricing, setPricing] = React.useState<PricingRule[]>([])
  const [vehicleType, setVehicleType] = React.useState('')
  const [categoryType, setCategoryType] = React.useState('')
  const [selected, setSelected] = React.useState<PricingRule | null>(null)
  const [status, setStatus] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    loadPricing()
  }, [])

  const loadPricing = async () => {
    setLoading(true)
    setError(null)
    try {
      const rules = await PricingService.getAllPricing()
      setPricing(rules)
    } catch (err: any) {
      setError(err.message || 'Unable to load pricing rules')
    }
    setLoading(false)
  }

  const handleFind = async () => {
    setLoading(true)
    setError(null)
    try {
      const rule = await PricingService.getActivePricing(vehicleType, categoryType)
      if (rule) {
        setSelected(rule)
        setStatus('Found matching pricing rule')
      } else {
        setError('No pricing rule found')
        setSelected(null)
      }
    } catch (err: any) {
      setError(err.message || 'No pricing rule found')
      setSelected(null)
    }
    setLoading(false)
  }

  return (
    <div className="page-container">
      <div className="pricing-grid">
        <Card title="Pricing Rules" hover>
          {loading && <Loader message="Loading pricing data..." />}
          {status && <Alert type="success" message={status} onClose={() => setStatus(null)} />}
          {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

          <div className="form-group">
            <label>Vehicle type</label>
            <input value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} placeholder="sedan" />
          </div>
          <div className="form-group">
            <label>Category type</label>
            <input value={categoryType} onChange={(e) => setCategoryType(e.target.value)} placeholder="standard" />
          </div>
          <Button variant="primary" onClick={handleFind}>Find pricing rule</Button>
        </Card>

        <Card title="Pricing List" hover>
          <Button variant="secondary" onClick={loadPricing}>Load pricing rules</Button>
          <ul className="list-section">
            {pricing.map((rule) => (
              <li key={rule.id}>
                <strong>{rule.vehicleType} / {rule.categoryType}</strong>
                <div>Base fare: {rule.baseFare}</div>
                <div>Price per km: {rule.pricePerKm}</div>
                <Button variant="secondary" onClick={async () => {
                  try {
                    const pricingRule = await PricingService.getPricingById(rule.id)
                    if (pricingRule) {
                      setSelected(pricingRule)
                    } else {
                      setError('Unable to load pricing detail')
                    }
                  } catch (err: any) {
                    setError(err.message || 'Unable to load pricing detail')
                  }
                }}>Details</Button>
              </li>
            ))}
          </ul>
        </Card>

        {selected && (
          <Card title="Selected Pricing Rule" hover>
            <p><strong>Vehicle type:</strong> {selected.vehicleType}</p>
            <p><strong>Category:</strong> {selected.categoryType}</p>
            <p><strong>Base fare:</strong> {selected.baseFare}</p>
            <p><strong>Price per km:</strong> {selected.pricePerKm}</p>
            <p><strong>Minimum fare:</strong> {selected.minimumFare}</p>
            <p><strong>Maximum fare:</strong> {selected.maximumFare ?? 'n/a'}</p>
            <p><strong>Surge multiplier:</strong> {selected.surgeMultiplier ?? 1}</p>
            <p><strong>Active:</strong> {selected.active ? 'Yes' : 'No'}</p>
          </Card>
        )}
      </div>
    </div>
  )
}
