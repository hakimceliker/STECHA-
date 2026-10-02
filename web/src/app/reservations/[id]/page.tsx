'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface Reservation {
  id: string;
  business_id: string;
  guest_count: number;
  reservation_date: string;
  status: string;
}

export default function ReservationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReservation = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/reservations/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setReservation(data);
      } else {
        setError('Reservation not found');
      }
    } catch (err) {
      setError('Failed to load reservation');
      console.error('Error loading reservation:', err);
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
      loadReservation();
    }
  }, [isAuthenticated, loadReservation]);

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading reservation...</div>;
  }

  if (error || !reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error || 'Reservation not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <button onClick={() => router.back()} className="text-blue-600 mb-4">
        ← Back
      </button>
      <h1 className="text-3xl font-bold mb-8">Reservation #{reservation.id}</h1>
      <div className="bg-gray-50 p-6 rounded-lg">
        <p className="mb-4">
          <strong>Status:</strong> {reservation.status}
        </p>
        <p className="mb-4">
          <strong>Reservation Date:</strong> {new Date(reservation.reservation_date).toLocaleDateString()}
        </p>
        <p className="mb-4">
          <strong>Guest Count:</strong> {reservation.guest_count}
        </p>
        {reservation.status === 'pending' && (
          <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
            Cancel Reservation
          </button>
        )}
      </div>
    </div>
  );
}
