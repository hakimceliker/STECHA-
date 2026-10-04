import { useState, useCallback, useEffect } from 'react'
import { reservationService } from '@/services'
import type { Reservation, CreateReservationRequest, UpdateReservationRequest } from '@/types'

interface UseReservationsState {
  reservations: Reservation[]
  currentReservation: Reservation | null
  loading: boolean
  error: string | null
}

export function useReservations() {
  const [state, setState] = useState<UseReservationsState>({
    reservations: [],
    currentReservation: null,
    loading: false,
    error: null,
  })

  const listReservations = useCallback(async (limit = 50, skip = 0) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const reservations = await reservationService.listReservations(limit, skip)
      setState((prev) => ({ ...prev, reservations, loading: false }))
      return reservations
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load reservations'
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      throw error
    }
  }, [])

  const getReservation = useCallback(async (id: number) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const reservation = await reservationService.getReservation(id)
      setState((prev) => ({ ...prev, currentReservation: reservation, loading: false }))
      return reservation
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load reservation'
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      throw error
    }
  }, [])

  const createReservation = useCallback(async (data: CreateReservationRequest) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const reservation = await reservationService.createReservation(data)
      setState((prev) => ({
        ...prev,
        reservations: [reservation, ...prev.reservations],
        loading: false,
      }))
      return reservation
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create reservation'
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      throw error
    }
  }, [])

  const updateReservation = useCallback(async (id: number, data: UpdateReservationRequest) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const reservation = await reservationService.updateReservation(id, data)
      setState((prev) => ({
        ...prev,
        reservations: prev.reservations.map((r) => (r.id === id ? reservation : r)),
        currentReservation: prev.currentReservation?.id === id ? reservation : prev.currentReservation,
        loading: false,
      }))
      return reservation
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update reservation'
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      throw error
    }
  }, [])

  const cancelReservation = useCallback(async (id: number) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const result = await reservationService.cancelReservation(id)
      setState((prev) => ({
        ...prev,
        reservations: prev.reservations.map((r) =>
          r.id === id ? { ...r, status: 'cancelled' } : r
        ),
        currentReservation:
          prev.currentReservation?.id === id
            ? { ...prev.currentReservation, status: 'cancelled' }
            : prev.currentReservation,
        loading: false,
      }))
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel reservation'
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      throw error
    }
  }, [])

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    listReservations,
    getReservation,
    createReservation,
    updateReservation,
    cancelReservation,
    clearError,
  }
}
