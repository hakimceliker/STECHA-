import axios from 'axios'
import type { Reservation, CreateReservationRequest, UpdateReservationRequest } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export const reservationService = {
  async listReservations(limit = 50, skip = 0): Promise<Reservation[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/reservations`, {
        headers: getAuthHeaders(),
        params: { limit, skip },
      })
      return response.data
    } catch (error) {
      console.error('Failed to list reservations:', error)
      throw error
    }
  },

  async getReservation(id: number): Promise<Reservation> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/reservations/${id}`, {
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error(`Failed to fetch reservation ${id}:`, error)
      throw error
    }
  },

  async createReservation(data: CreateReservationRequest): Promise<Reservation> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/reservations`, data, {
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error('Failed to create reservation:', error)
      throw error
    }
  },

  async updateReservation(id: number, data: UpdateReservationRequest): Promise<Reservation> {
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/v1/reservations/${id}`, data, {
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error(`Failed to update reservation ${id}:`, error)
      throw error
    }
  },

  async cancelReservation(id: number): Promise<{ status: string; reservation_id: number }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/reservations/${id}/cancel`,
        {},
        {
          headers: getAuthHeaders(),
        }
      )
      return response.data
    } catch (error) {
      console.error(`Failed to cancel reservation ${id}:`, error)
      throw error
    }
  },
}
