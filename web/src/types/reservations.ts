export interface Reservation {
  id: number;
  user_id: number;
  business_id: number;
  reservation_date: string; // ISO 8601 datetime
  guest_count: number;
  special_requests?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  approval_status: 'pending' | 'approved' | 'rejected';
  created_at: string; // ISO 8601 datetime
}

export interface CreateReservationRequest {
  business_id: number;
  reservation_date: string; // ISO 8601 datetime
  guest_count: number;
  special_requests?: string;
}

export interface UpdateReservationRequest {
  reservation_date?: string;
  guest_count?: number;
  special_requests?: string;
  status?: 'pending' | 'confirmed' | 'cancelled';
  approval_status?: 'pending' | 'approved' | 'rejected';
}

export interface ReservationListResponse {
  items: Reservation[];
  total: number;
  skip: number;
  limit: number;
}
