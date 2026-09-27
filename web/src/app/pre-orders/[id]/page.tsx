'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface PreOrder {
  id: string;
  business_id: string;
  items: string[];
  pickup_date: string;
  status: string;
  total_price: number;
}

export default function PreOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [order, setOrder] = useState<PreOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/pre-orders/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      } else {
        setError('Pre-order not found');
      }
    } catch (err) {
      setError('Failed to load pre-order');
      console.error('Error loading pre-order:', err);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadOrder();
    }
  }, [isAuthenticated, loadOrder]);

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading order...</div>;
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error || 'Pre-order not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <button onClick={() => router.back()} className="text-blue-600 mb-4">
        ← Back
      </button>
      <h1 className="text-3xl font-bold mb-8">Pre-Order #{order.id}</h1>
      <div className="bg-gray-50 p-6 rounded-lg">
        <p className="mb-4">
          <strong>Status:</strong> {order.status}
        </p>
        <p className="mb-4">
          <strong>Pickup Date:</strong> {new Date(order.pickup_date).toLocaleDateString()}
        </p>
        <p className="mb-4">
          <strong>Total Price:</strong> ${order.total_price.toFixed(2)}
        </p>
        <p className="mb-6">
          <strong>Items:</strong>
          <ul className="list-disc ml-6 mt-2">
            {order.items.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </p>
        {order.status === 'pending' && (
          <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
            Cancel Order
          </button>
        )}
      </div>
    </div>
  );
}
