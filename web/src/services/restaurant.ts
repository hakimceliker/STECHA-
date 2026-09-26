import axios from 'axios'
import type {
  RestaurantStats,
  DashboardMetrics,
  RestaurantReservation,
  RestaurantPreOrder,
  RestaurantUpdateRequest,
  Business,
} from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export const restaurantService = {
  async getMyBusiness(): Promise<Business> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/restaurant/my-business`, {
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error('Failed to fetch business:', error)
      throw error
    }
  },

  async getStats(): Promise<RestaurantStats> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/restaurant/stats`, {
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      throw error
    }
  },

  async getDashboardMetrics(days = 30): Promise<DashboardMetrics[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/restaurant/dashboard-metrics`, {
        headers: getAuthHeaders(),
        params: { days },
      })
      return response.data
    } catch (error) {
      console.error('Failed to fetch dashboard metrics:', error)
      throw error
    }
  },

  async getUpcomingReservations(limit = 50, skip = 0): Promise<RestaurantReservation[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/restaurant/upcoming-reservations`,
        {
          headers: getAuthHeaders(),
          params: { limit, skip },
        }
      )
      return response.data
    } catch (error) {
      console.error('Failed to fetch upcoming reservations:', error)
      throw error
    }
  },

  async getPendingPreOrders(limit = 50, skip = 0): Promise<RestaurantPreOrder[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/restaurant/pre-orders`, {
        headers: getAuthHeaders(),
        params: { limit, skip },
      })
      return response.data
    } catch (error) {
      console.error('Failed to fetch pre-orders:', error)
      throw error
    }
  },

  async getReservation(reservationId: number): Promise<RestaurantReservation> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/restaurant/reservations/${reservationId}`,
        {
          headers: getAuthHeaders(),
        }
      )
      return response.data
    } catch (error) {
      console.error(`Failed to fetch reservation ${reservationId}:`, error)
      throw error
    }
  },

  async getPreOrder(preOrderId: number): Promise<RestaurantPreOrder> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/restaurant/pre-orders/${preOrderId}`, {
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error(`Failed to fetch pre-order ${preOrderId}:`, error)
      throw error
    }
  },

  async updateBusinessSettings(data: RestaurantUpdateRequest): Promise<Business> {
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/v1/restaurant/settings`, data, {
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error('Failed to update business settings:', error)
      throw error
    }
  },

  async confirmReservation(reservationId: number): Promise<{ status: string; id: number }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/restaurant/reservations/${reservationId}/confirm`,
        {},
        {
          headers: getAuthHeaders(),
        }
      )
      return response.data
    } catch (error) {
      console.error(`Failed to confirm reservation ${reservationId}:`, error)
      throw error
    }
  },

  async cancelReservation(
    reservationId: number,
    reason?: string
  ): Promise<{ status: string; id: number }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/restaurant/reservations/${reservationId}/cancel`,
        { reason },
        {
          headers: getAuthHeaders(),
        }
      )
      return response.data
    } catch (error) {
      console.error(`Failed to cancel reservation ${reservationId}:`, error)
      throw error
    }
  },

  async confirmPreOrder(preOrderId: number): Promise<{ status: string; id: number }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/restaurant/pre-orders/${preOrderId}/confirm`,
        {},
        {
          headers: getAuthHeaders(),
        }
      )
      return response.data
    } catch (error) {
      console.error(`Failed to confirm pre-order ${preOrderId}:`, error)
      throw error
    }
  },

  async cancelPreOrder(preOrderId: number, reason?: string): Promise<{ status: string; id: number }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/restaurant/pre-orders/${preOrderId}/cancel`,
        { reason },
        {
          headers: getAuthHeaders(),
        }
      )
      return response.data
    } catch (error) {
      console.error(`Failed to cancel pre-order ${preOrderId}:`, error)
      throw error
    }
  },
}
