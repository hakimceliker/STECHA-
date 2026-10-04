import axios from 'axios'
import type { PreOrder, CreatePreOrderRequest, UpdatePreOrderRequest } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export const preOrderService = {
  async listPreOrders(limit = 50, skip = 0): Promise<PreOrder[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/pre-orders`, {
        headers: getAuthHeaders(),
        params: { limit, skip },
      })
      return response.data
    } catch (error) {
      console.error('Failed to list pre-orders:', error)
      throw error
    }
  },

  async getPreOrder(id: number): Promise<PreOrder> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/pre-orders/${id}`, {
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error(`Failed to fetch pre-order ${id}:`, error)
      throw error
    }
  },

  async createPreOrder(data: CreatePreOrderRequest): Promise<PreOrder> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/pre-orders`, data, {
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error('Failed to create pre-order:', error)
      throw error
    }
  },

  async updatePreOrder(id: number, data: UpdatePreOrderRequest): Promise<PreOrder> {
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/v1/pre-orders/${id}`, data, {
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error(`Failed to update pre-order ${id}:`, error)
      throw error
    }
  },

  async cancelPreOrder(id: number): Promise<{ status: string; pre_order_id: number }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/pre-orders/${id}/cancel`,
        {},
        {
          headers: getAuthHeaders(),
        }
      )
      return response.data
    } catch (error) {
      console.error(`Failed to cancel pre-order ${id}:`, error)
      throw error
    }
  },
}
