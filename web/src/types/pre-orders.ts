export interface PreOrderItem {
  name: string;
  quantity: number;
  price: number;
  [key: string]: string | number;
}

export interface PreOrder {
  id: number;
  user_id: number;
  business_id: number;
  items_json: PreOrderItem[];
  items_description?: string;
  pickup_date?: string; // ISO 8601 datetime
  total_try: number;
  currency: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  status: 'pending' | 'confirmed' | 'cancelled';
  approval_status: 'pending' | 'approved' | 'rejected';
  created_at: string; // ISO 8601 datetime
}

export interface CreatePreOrderRequest {
  business_id: number;
  items: PreOrderItem[];
  items_description?: string;
  pickup_date?: string; // ISO 8601 datetime
  total_try: number;
}

export interface UpdatePreOrderRequest {
  items?: PreOrderItem[];
  items_description?: string;
  pickup_date?: string;
  total_try?: number;
  status?: 'pending' | 'confirmed' | 'cancelled';
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  approval_status?: 'pending' | 'approved' | 'rejected';
}

export interface PreOrderListResponse {
  items: PreOrder[];
  total: number;
  skip: number;
  limit: number;
}
