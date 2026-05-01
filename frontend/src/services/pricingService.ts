import { ApiService } from './apiService'
import type { PricingRule } from '../types/api'

export class PricingService {
  static async getAllPricing(): Promise<PricingRule[]> {
    const response = await ApiService.get<{ status: string; count: number; data: PricingRule[] }>('/api/pricing')
    return response.success && response.data ? response.data.data : []
  }

  static async getActivePricing(vehicleType: string, categoryType: string): Promise<PricingRule | null> {
    const response = await ApiService.get<PricingRule>(`/api/pricing/active/${vehicleType}/${categoryType}`)
    return response.success ? response.data : null
  }

  static async getPricingById(id: number): Promise<PricingRule | null> {
    const response = await ApiService.get<PricingRule>(`/api/pricing/${id}`)
    return response.success ? response.data : null
  }

  static async createPricing(pricingData: Omit<PricingRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<PricingRule | null> {
    const response = await ApiService.post<PricingRule>('/api/pricing', pricingData)
    return response.success ? response.data : null
  }

  static async updatePricing(id: number, pricingData: Partial<PricingRule>): Promise<PricingRule | null> {
    const response = await ApiService.put<PricingRule>(`/api/pricing/${id}`, pricingData)
    return response.success ? response.data : null
  }

  static async deletePricing(id: number): Promise<{ message: string } | null> {
    const response = await ApiService.delete<{ message: string }>(`/api/pricing/${id}`)
    return response.success ? response.data : null
  }
}
