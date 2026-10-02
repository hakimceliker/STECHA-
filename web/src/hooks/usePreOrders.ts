import { useState, useCallback } from 'react'
import { preOrderService } from '@/services'
import type { PreOrder, CreatePreOrderRequest, UpdatePreOrderRequest } from '@/types'

interface UsePreOrdersState {
  preOrders: PreOrder[]
  currentPreOrder: PreOrder | null
  loading: boolean
  error: string | null
}

export function usePreOrders() {
  const [state, setState] = useState<UsePreOrdersState>({
    preOrders: [],
    currentPreOrder: null,
    loading: false,
    error: null,
  })

  const listPreOrders = useCallback(async (limit = 50, skip = 0) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const preOrders = await preOrderService.listPreOrders(limit, skip)
      setState((prev) => ({ ...prev, preOrders, loading: false }))
      return preOrders
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load pre-orders'
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      throw error
    }
  }, [])

  const getPreOrder = useCallback(async (id: number) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const preOrder = await preOrderService.getPreOrder(id)
      setState((prev) => ({ ...prev, currentPreOrder: preOrder, loading: false }))
      return preOrder
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load pre-order'
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      throw error
    }
  }, [])

  const createPreOrder = useCallback(async (data: CreatePreOrderRequest) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const preOrder = await preOrderService.createPreOrder(data)
      setState((prev) => ({
        ...prev,
        preOrders: [preOrder, ...prev.preOrders],
        loading: false,
      }))
      return preOrder
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create pre-order'
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      throw error
    }
  }, [])

  const updatePreOrder = useCallback(async (id: number, data: UpdatePreOrderRequest) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const preOrder = await preOrderService.updatePreOrder(id, data)
      setState((prev) => ({
        ...prev,
        preOrders: prev.preOrders.map((p) => (p.id === id ? preOrder : p)),
        currentPreOrder: prev.currentPreOrder?.id === id ? preOrder : prev.currentPreOrder,
        loading: false,
      }))
      return preOrder
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update pre-order'
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      throw error
    }
  }, [])

  const cancelPreOrder = useCallback(async (id: number) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const result = await preOrderService.cancelPreOrder(id)
      setState((prev) => ({
        ...prev,
        preOrders: prev.preOrders.map((p) =>
          p.id === id ? { ...p, status: 'cancelled' } : p
        ),
        currentPreOrder:
          prev.currentPreOrder?.id === id
            ? { ...prev.currentPreOrder, status: 'cancelled' }
            : prev.currentPreOrder,
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
    listPreOrders,
    getPreOrder,
    createPreOrder,
    updatePreOrder,
    cancelPreOrder,
    clearError,
  }
}
