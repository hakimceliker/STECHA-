import axios from 'axios'
import type { Business, CreateBusinessRequest, UpdateBusinessRequest } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export const businessService = {
  async listBusinesses(limit = 50, skip = 0): Promise<Business[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/businesses`, {
        headers: getAuthHeaders(),
        params: { limit, skip },
      })
      return response.data
    } catch (error) {
      console.error('Failed to list businesses:', error)
      throw error
    }
  },

  async getBusiness(id: number): Promise<Business> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/${id}`, {
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error(`Failed to fetch business ${id}:`, error)
      throw error
    }
  },

  async searchBusinesses(query: string, limit = 50): Promise<Business[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/search`, {
        headers: getAuthHeaders(),
        params: { q: query, limit },
      })
      return response.data
    } catch (error) {
      console.error('Failed to search businesses:', error)
      throw error
    }
  },

  async createBusiness(data: CreateBusinessRequest): Promise<Business> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/businesses`, data, {
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error('Failed to create business:', error)
      throw error
    }
  },

  async updateBusiness(id: number, data: UpdateBusinessRequest): Promise<Business> {
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/v1/businesses/${id}`, data, {
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error(`Failed to update business ${id}:`, error)
      throw error
    }
  },
}
