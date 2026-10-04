import axios from 'axios'
import type {
  AdminUser,
  AdminUpdateUserRequest,
  AdminStats,
  ApprovalQueueItem,
  PendingReservation,
  PendingPreOrder,
  AdminBusiness,
} from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export const adminService = {
  // Metrics endpoints
  async getMetrics(): Promise<AdminStats> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/admin/metrics`, {
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
      throw error
    }
  },

  // Approval queue endpoints
  async getApprovalQueue(
    limit = 100,
    skip = 0,
    type?: string
  ): Promise<ApprovalQueueItem[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/admin/approval-queue`, {
        headers: getAuthHeaders(),
        params: { limit, skip, type },
      })
      return response.data
    } catch (error) {
      console.error('Failed to fetch approval queue:', error)
      throw error
    }
  },

  async getPendingReservations(limit = 50): Promise<PendingReservation[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/admin/reservations/pending`,
        {
          headers: getAuthHeaders(),
          params: { limit },
        }
      )
      return response.data
    } catch (error) {
      console.error('Failed to fetch pending reservations:', error)
      throw error
    }
  },

  async getPendingPreOrders(limit = 50): Promise<PendingPreOrder[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/admin/pre-orders/pending`,
        {
          headers: getAuthHeaders(),
          params: { limit },
        }
      )
      return response.data
    } catch (error) {
      console.error('Failed to fetch pending pre-orders:', error)
      throw error
    }
  },

  // Reservation approval endpoints
  async approveReservation(reservationId: number): Promise<{ status: string; id: number }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/admin/reservations/${reservationId}/approve`,
        {},
        {
          headers: getAuthHeaders(),
        }
      )
      return response.data
    } catch (error) {
      console.error(`Failed to approve reservation ${reservationId}:`, error)
      throw error
    }
  },

  async rejectReservation(
    reservationId: number,
    reason?: string
  ): Promise<{ status: string; id: number; reason?: string }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/admin/reservations/${reservationId}/reject`,
        { reason },
        {
          headers: getAuthHeaders(),
        }
      )
      return response.data
    } catch (error) {
      console.error(`Failed to reject reservation ${reservationId}:`, error)
      throw error
    }
  },

  // Pre-order approval endpoints
  async approvePreOrder(preOrderId: number): Promise<{ status: string; id: number }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/admin/pre-orders/${preOrderId}/approve`,
        {},
        {
          headers: getAuthHeaders(),
        }
      )
      return response.data
    } catch (error) {
      console.error(`Failed to approve pre-order ${preOrderId}:`, error)
      throw error
    }
  },

  async rejectPreOrder(
    preOrderId: number,
    reason?: string
  ): Promise<{ status: string; id: number; reason?: string }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/admin/pre-orders/${preOrderId}/reject`,
        { reason },
        {
          headers: getAuthHeaders(),
        }
      )
      return response.data
    } catch (error) {
      console.error(`Failed to reject pre-order ${preOrderId}:`, error)
      throw error
    }
  },

  // User management endpoints
  async listUsers(
    limit = 100,
    skip = 0,
    search?: string,
    isAdmin?: boolean
  ): Promise<AdminUser[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/admin/users`, {
        headers: getAuthHeaders(),
        params: { limit, skip, search, is_admin: isAdmin },
      })
      return response.data
    } catch (error) {
      console.error('Failed to fetch users:', error)
      throw error
    }
  },

  async getUser(userId: number): Promise<AdminUser> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/admin/users/${userId}`, {
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error(`Failed to fetch user ${userId}:`, error)
      throw error
    }
  },

  async updateUser(userId: number, data: AdminUpdateUserRequest): Promise<AdminUser> {
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/v1/admin/users/${userId}`, data, {
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error(`Failed to update user ${userId}:`, error)
      throw error
    }
  },

  async deactivateUser(userId: number): Promise<{ status: string; user_id: number }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/admin/users/${userId}/deactivate`,
        {},
        {
          headers: getAuthHeaders(),
        }
      )
      return response.data
    } catch (error) {
      console.error(`Failed to deactivate user ${userId}:`, error)
      throw error
    }
  },

  async promoteAdmin(userId: number): Promise<{ status: string; user_id: number }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/admin/users/${userId}/promote-admin`,
        {},
        {
          headers: getAuthHeaders(),
        }
      )
      return response.data
    } catch (error) {
      console.error(`Failed to promote user ${userId}:`, error)
      throw error
    }
  },

  // Business management endpoints
  async listBusinesses(
    limit = 100,
    skip = 0,
    status?: string
  ): Promise<AdminBusiness[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/admin/businesses`, {
        headers: getAuthHeaders(),
        params: { limit, skip, status },
      })
      return response.data
    } catch (error) {
      console.error('Failed to fetch businesses:', error)
      throw error
    }
  },

  async getBusiness(businessId: number): Promise<AdminBusiness> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/admin/businesses/${businessId}`, {
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error(`Failed to fetch business ${businessId}:`, error)
      throw error
    }
  },

  async suspendBusiness(businessId: number, reason?: string): Promise<{ status: string; id: number; reason?: string }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/admin/businesses/${businessId}/suspend`,
        { reason },
        {
          headers: getAuthHeaders(),
        }
      )
      return response.data
    } catch (error) {
      console.error(`Failed to suspend business ${businessId}:`, error)
      throw error
    }
  },
}
