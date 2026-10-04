export interface AdminUser {
  id: number;
  email: string;
  name: string;
  locale: string;
  is_admin: boolean;
  created_at: string;
}

export interface AdminUpdateUserRequest {
  name?: string;
  locale?: string;
  is_admin?: boolean;
}

export interface AdminStats {
  total_users: number;
  total_conversations: number;
  total_reservations: number;
  total_pre_orders: number;
  total_waitlist: number;
  pending_approvals: number;
  revenue_estimate: number;
}

export interface ApprovalQueueItem {
  id: number;
  user_id: number;
  business_id: number;
  type: 'reservation' | 'pre_order';
  created_at: string;
  detail: {
    reservation_date?: string;
    guest_count?: number;
    approval_score?: number;
    pickup_date?: string;
    total_try?: number;
    items_count?: number;
  };
}

export interface PendingReservation {
  id: number;
  user_id: number;
  business_id: number;
  reservation_date: string;
  guest_count: number;
  approval_status: 'pending' | 'approved' | 'rejected';
  ai_score: number;
}

export interface PendingPreOrder {
  id: number;
  user_id: number;
  business_id: number;
  pickup_date: string;
  total_try: number;
  approval_status: 'pending' | 'approved' | 'rejected';
}

export interface AdminBusiness {
  id: number;
  owner_id: number;
  type: string;
  name: string;
  status: 'active' | 'suspended' | 'inactive';
  commission_rate: number;
  created_at: string;
}

export interface AdminDashboardStats {
  date: string;
  users: number;
  reservations: number;
  pre_orders: number;
  revenue: number;
}
