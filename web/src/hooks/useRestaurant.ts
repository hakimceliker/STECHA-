import { useState, useCallback } from 'react'
import { restaurantService } from '@/services'
import type {
  Business,
  RestaurantStats,
  DashboardMetrics,
  RestaurantReservation,
  RestaurantPreOrder,
  RestaurantUpdateRequest,
} from '@/types'

interface UseRestaurantState {
  business: Business | null
  stats: RestaurantStats | null
  metrics: DashboardMetrics[]
  upcomingReservations: RestaurantReservation[]
  pendingPreOrders: RestaurantPreOrder[]
  currentReservation: RestaurantReservation | null
  currentPreOrder: RestaurantPreOrder | null
  loading: boolean
  error: string | null
}

export function useRestaurant() {
  const [state, setState] = useState<UseRestaurantState>({
    business: null,
    stats: null,
    metrics: [],
    upcomingReservations: [],
    pendingPreOrders: [],
    currentReservation: null,
    currentPreOrder: null,
    loading: false,
    error: null,
  })

  const getMyBusiness = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const business = await restaurantService.getMyBusiness()
      setState((prev) => ({ ...prev, business, loading: false }))
      return business
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load business'
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      throw error
    }
  }, [])

  const getStats = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const stats = await restaurantService.getStats()
      setState((prev) => ({ ...prev, stats, loading: false }))
      return stats
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load stats'
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      throw error
    }
  }, [])

  const getDashboardMetrics = useCallback(async (days = 30) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const metrics = await restaurantService.getDashboardMetrics(days)
      setState((prev) => ({ ...prev, metrics, loading: false }))
      return metrics
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load metrics'
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      throw error
    }
  }, [])

  const getUpcomingReservations = useCallback(async (limit = 50, skip = 0) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const reservations = await restaurantService.getUpcomingReservations(limit, skip)
      setState((prev) => ({ ...prev, upcomingReservations: reservations, loading: false }))
      return reservations
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load reservations'
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      throw error
    }
  }, [])

  const getPendingPreOrders = useCallback(async (limit = 50, skip = 0) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const preOrders = await restaurantService.getPendingPreOrders(limit, skip)
      setState((prev) => ({ ...prev, pendingPreOrders: preOrders, loading: false }))
      return preOrders
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load pre-orders'
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      throw error
    }
  }, [])

  const getReservation = useCallback(async (reservationId: number) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const reservation = await restaurantService.getReservation(reservationId)
      setState((prev) => ({ ...prev, currentReservation: reservation, loading: false }))
      return reservation
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load reservation'
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      throw error
    }
  }, [])

  const getPreOrder = useCallback(async (preOrderId: number) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const preOrder = await restaurantService.getPreOrder(preOrderId)
      setState((prev) => ({ ...prev, currentPreOrder: preOrder, loading: false }))
      return preOrder
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load pre-order'
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      throw error
    }
  }, [])

  const updateBusinessSettings = useCallback(async (data: RestaurantUpdateRequest) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const business = await restaurantService.updateBusinessSettings(data)
      setState((prev) => ({ ...prev, business, loading: false }))
      return business
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update settings'
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      throw error
    }
  }, [])

  const confirmReservation = useCallback(async (reservationId: number) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const result = await restaurantService.confirmReservation(reservationId)
      setState((prev) => ({
        ...prev,
        upcomingReservations: prev.upcomingReservations.filter((r) => r.id !== reservationId),
        loading: false,
      }))
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to confirm reservation'
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      throw error
    }
  }, [])

  const cancelReservation = useCallback(async (reservationId: number, reason?: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const result = await restaurantService.cancelReservation(reservationId, reason)
      setState((prev) => ({
        ...prev,
        upcomingReservations: prev.upcomingReservations.filter((r) => r.id !== reservationId),
        loading: false,
      }))
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel reservation'
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      throw error
    }
  }, [])

  const confirmPreOrder = useCallback(async (preOrderId: number) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const result = await restaurantService.confirmPreOrder(preOrderId)
      setState((prev) => ({
        ...prev,
        pendingPreOrders: prev.pendingPreOrders.filter((p) => p.id !== preOrderId),
        loading: false,
      }))
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to confirm pre-order'
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      throw error
    }
  }, [])

  const cancelPreOrder = useCallback(async (preOrderId: number, reason?: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const result = await restaurantService.cancelPreOrder(preOrderId, reason)
      setState((prev) => ({
        ...prev,
        pendingPreOrders: prev.pendingPreOrders.filter((p) => p.id !== preOrderId),
        loading: false,
      }))
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel pre-order'
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      throw error
    }
  }, [])

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    getMyBusiness,
    getStats,
    getDashboardMetrics,
    getUpcomingReservations,
    getPendingPreOrders,
    getReservation,
    getPreOrder,
    updateBusinessSettings,
    confirmReservation,
    cancelReservation,
    confirmPreOrder,
    cancelPreOrder,
    clearError,
  }
}
