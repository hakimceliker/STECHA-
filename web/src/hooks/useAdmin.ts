import { useState, useCallback } from 'react'
import { adminService } from '@/services'
import type {
  AdminUser,
  AdminUpdateUserRequest,
  AdminStats,
  ApprovalQueueItem,
  PendingReservation,
  PendingPreOrder,
  AdminBusiness,
} from '@/types'

interface UseAdminState {
  users: AdminUser[]
  currentUser: AdminUser | null
  metrics: AdminStats | null
  approvalQueue: ApprovalQueueItem[]
  pendingReservations: PendingReservation[]
  pendingPreOrders: PendingPreOrder[]
  businesses: AdminBusiness[]
  currentBusiness: AdminBusiness | null
  loading: boolean
  error: string | null
}

export function useAdmin() {
  const [state, setState] = useState<UseAdminState>({
    users: [],
    currentUser: null,
    metrics: null,
    approvalQueue: [],
    pendingReservations: [],
    pendingPreOrders: [],
    businesses: [],
    currentBusiness: null,
    loading: false,
    error: null,
  })

  const getMetrics = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const metrics = await adminService.getMetrics()
      setState((prev) => ({ ...prev, metrics, loading: false }))
      return metrics
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load metrics'
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      throw error
    }
  }, [])

  const getApprovalQueue = useCallback(async (limit = 100, skip = 0, type?: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const queue = await adminService.getApprovalQueue(limit, skip, type)
      setState((prev) => ({ ...prev, approvalQueue: queue, loading: false }))
      return queue
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load approval queue'
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      throw error
    }
  }, [])

  const getPendingReservations = useCallback(async (limit = 50) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const reservations = await adminService.getPendingReservations(limit)
      setState((prev) => ({ ...prev, pendingReservations: reservations, loading: false }))
      return reservations
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load pending reservations'
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      throw error
    }
  }, [])

  const getPendingPreOrders = useCallback(async (limit = 50) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const preOrders = await adminService.getPendingPreOrders(limit)
      setState((prev) => ({ ...prev, pendingPreOrders: preOrders, loading: false }))
      return preOrders
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load pending pre-orders'
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      throw error
    }
  }, [])

  const approveReservation = useCallback(async (reservationId: number) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const result = await adminService.approveReservation(reservationId)
      setState((prev) => ({
        ...prev,
        approvalQueue: prev.approvalQueue.filter((item) => item.id !== reservationId),
        pendingReservations: prev.pendingReservations.filter((r) => r.id !== reservationId),
        loading: false,
      }))
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve reservation'
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      throw error
    }
  }, [])

  const rejectReservation = useCallback(async (reservationId: number, reason?: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const result = await adminService.rejectReservation(reservationId, reason)
      setState((prev) => ({
        ...prev,
        approvalQueue: prev.approvalQueue.filter((item) => item.id !== reservationId),
        pendingReservations: prev.pendingReservations.filter((r) => r.id !== reservationId),
        loading: false,
      }))
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject reservation'
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      throw error
    }
  }, [])

  const approvePreOrder = useCallback(async (preOrderId: number) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const result = await adminService.approvePreOrder(preOrderId)
      setState((prev) => ({
        ...prev,
        approvalQueue: prev.approvalQueue.filter((item) => item.id !== preOrderId),
        pendingPreOrders: prev.pendingPreOrders.filter((p) => p.id !== preOrderId),
        loading: false,
      }))
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve pre-order'
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      throw error
    }
  }, [])

  const rejectPreOrder = useCallback(async (preOrderId: number, reason?: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const result = await adminService.rejectPreOrder(preOrderId, reason)
      setState((prev) => ({
        ...prev,
        approvalQueue: prev.approvalQueue.filter((item) => item.id !== preOrderId),
        pendingPreOrders: prev.pendingPreOrders.filter((p) => p.id !== preOrderId),
        loading: false,
      }))
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject pre-order'
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      throw error
    }
  }, [])

  const listUsers = useCallback(async (limit = 100, skip = 0, search?: string, isAdmin?: boolean) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const users = await adminService.listUsers(limit, skip, search, isAdmin)
      setState((prev) => ({ ...prev, users, loading: false }))
      return users
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load users'
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      throw error
    }
  }, [])

  const getUser = useCallback(async (userId: number) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const user = await adminService.getUser(userId)
      setState((prev) => ({ ...prev, currentUser: user, loading: false }))
      return user
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load user'
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      throw error
    }
  }, [])

  const updateUser = useCallback(async (userId: number, data: AdminUpdateUserRequest) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const user = await adminService.updateUser(userId, data)
      setState((prev) => ({
        ...prev,
        users: prev.users.map((u) => (u.id === userId ? user : u)),
        currentUser: prev.currentUser?.id === userId ? user : prev.currentUser,
        loading: false,
      }))
      return user
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user'
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      throw error
    }
  }, [])

  const deactivateUser = useCallback(async (userId: number) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const result = await adminService.deactivateUser(userId)
      setState((prev) => ({
        ...prev,
        users: prev.users.filter((u) => u.id !== userId),
        currentUser: prev.currentUser?.id === userId ? null : prev.currentUser,
        loading: false,
      }))
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to deactivate user'
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      throw error
    }
  }, [])

  const promoteAdmin = useCallback(async (userId: number) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const result = await adminService.promoteAdmin(userId)
      setState((prev) => ({
        ...prev,
        users: prev.users.map((u) =>
          u.id === userId ? { ...u, is_admin: true } : u
        ),
        currentUser:
          prev.currentUser?.id === userId
            ? { ...prev.currentUser, is_admin: true }
            : prev.currentUser,
        loading: false,
      }))
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to promote user'
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      throw error
    }
  }, [])

  const listBusinesses = useCallback(async (limit = 100, skip = 0, status?: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const businesses = await adminService.listBusinesses(limit, skip, status)
      setState((prev) => ({ ...prev, businesses, loading: false }))
      return businesses
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load businesses'
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      throw error
    }
  }, [])

  const getBusiness = useCallback(async (businessId: number) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const business = await adminService.getBusiness(businessId)
      setState((prev) => ({ ...prev, currentBusiness: business, loading: false }))
      return business
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load business'
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      throw error
    }
  }, [])

  const suspendBusiness = useCallback(async (businessId: number, reason?: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const result = await adminService.suspendBusiness(businessId, reason)
      setState((prev) => ({
        ...prev,
        businesses: prev.businesses.map((b) =>
          b.id === businessId ? { ...b, status: 'suspended' } : b
        ),
        currentBusiness:
          prev.currentBusiness?.id === businessId
            ? { ...prev.currentBusiness, status: 'suspended' }
            : prev.currentBusiness,
        loading: false,
      }))
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to suspend business'
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }))
      throw error
    }
  }, [])

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    getMetrics,
    getApprovalQueue,
    getPendingReservations,
    getPendingPreOrders,
    approveReservation,
    rejectReservation,
    approvePreOrder,
    rejectPreOrder,
    listUsers,
    getUser,
    updateUser,
    deactivateUser,
    promoteAdmin,
    listBusinesses,
    getBusiness,
    suspendBusiness,
    clearError,
  }
}
