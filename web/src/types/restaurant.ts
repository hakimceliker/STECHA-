import { Business } from './business'
import { Reservation } from './reservations'
import { PreOrder } from './pre-orders'

export interface RestaurantStats {
  total_reservations: number
  total_pre_orders: number
  pending_approvals: number
  revenue: number
  today_reservations: number
  today_pre_orders: number
}

export interface DashboardMetrics {
  date: string
  reservations: number
  pre_orders: number
  revenue: number
  approvals_pending: number
}

export interface RestaurantReservation extends Reservation {
  user_email?: string
  user_name?: string
}

export interface RestaurantPreOrder extends PreOrder {
  user_email?: string
  user_name?: string
}

export interface RestaurantUpdateRequest {
  name?: string
  description?: string
  phone?: string
  email?: string
  address?: string
  daily_capacity?: number
}

export interface RestaurantDashboard {
  business: Business
  stats: RestaurantStats
  upcoming_reservations: RestaurantReservation[]
  pending_pre_orders: RestaurantPreOrder[]
}
