'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReservationList from '@/components/ReservationList';
import { useAuth } from '@/hooks/useAuth';

interface Reservation {
  id: string;
  business_id: string;
  guest_count: number;
  reservation_date: string;
  status: string;
}

export default function ReservationsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const filterReservations = useCallback(() => {
    if (statusFilter === 'all') {
      setFilteredReservations(reservations);
    } else {
      setFilteredReservations(reservations.filter((res) => res.status === statusFilter));
    }
  }, [reservations, statusFilter]);

  const loadReservations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/reservations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setReservations(data.reservations || []);
      }
    } catch (error) {
      console.error('Failed to load reservations:', error);
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
      loadReservations();
    }
  }, [isAuthenticated, loadReservations]);

  useEffect(() => {
    filterReservations();
  }, [filterReservations]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-3xl font-bold mb-8">Reservations</h1>
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
      <ReservationList reservations={filteredReservations} isLoading={loading} onRefresh={loadReservations} />
    </div>
  );
}
