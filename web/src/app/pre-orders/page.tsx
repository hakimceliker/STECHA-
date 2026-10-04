'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PreOrderList from '@/components/PreOrderList';
import { useAuth } from '@/hooks/useAuth';

interface PreOrder {
  id: string;
  business_id: string;
  items: string[];
  pickup_date: string;
  status: string;
}

export default function PreOrdersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [preOrders, setPreOrders] = useState<PreOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PreOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const filterOrders = useCallback(() => {
    if (statusFilter === 'all') {
      setFilteredOrders(preOrders);
    } else {
      setFilteredOrders(preOrders.filter((order) => order.status === statusFilter));
    }
  }, [preOrders, statusFilter]);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/pre-orders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPreOrders(data.pre_orders || []);
      }
    } catch (error) {
      console.error('Failed to load pre-orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
    }
  }, [isAuthenticated, loadOrders]);

  useEffect(() => {
    filterOrders();
  }, [filterOrders]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-3xl font-bold mb-8">Pre-Orders</h1>
      <div className="mb-6 flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <PreOrderList preOrders={filteredOrders} isLoading={loading} onRefresh={loadOrders} />
    </div>
  );
}
