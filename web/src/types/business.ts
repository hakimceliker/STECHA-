export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Business {
  id: number;
  owner_id: number;
  type: 'restaurant' | 'cafe' | 'bakery' | 'other';
  name: string;
  address: string;
  phone: string;
  email: string;
  description?: string;
  coordinates: Coordinates;
  tax_no: string;
  daily_capacity: number;
  status: 'active' | 'inactive' | 'suspended';
  commission_rate: number;
  created_at: string;
  updated_at?: string;
}

export interface CreateBusinessRequest {
  type: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  description?: string;
  coordinates: Coordinates;
  tax_no: string;
  daily_capacity: number;
}

export interface UpdateBusinessRequest {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
  daily_capacity?: number;
  status?: 'active' | 'inactive' | 'suspended';
}

export interface BusinessStats {
  id: number;
  name: string;
  total_reservations: number;
  total_pre_orders: number;
  pending_approvals: number;
  revenue: number;
}
