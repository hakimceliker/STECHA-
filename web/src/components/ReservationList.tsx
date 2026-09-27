'use client';

import { useRouter } from 'next/navigation';
import { Button } from './Button';
import { Card } from './Card';
import { LoadingSkeleton } from './LoadingSkeleton';

interface Reservation {
  id: string;
  business_id: string;
  guest_count: number;
  reservation_date: string;
  status: string;
}

interface ReservationListProps {
  reservations: Reservation[];
  isLoading: boolean;
  onRefresh: () => void;
}

export default function ReservationList({
  reservations,
  isLoading,
  onRefresh,
}: ReservationListProps) {
  const router = useRouter();

  const getStatusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-gray-600">
          {reservations.length} reservation{reservations.length !== 1 ? 's' : ''}
        </p>
        <Button
          onClick={onRefresh}
          disabled={isLoading}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {isLoading && reservations.length === 0 ? (
        <div className="space-y-4">
          <LoadingSkeleton lines={4} className="h-32" />
          <LoadingSkeleton lines={4} className="h-32" />
          <LoadingSkeleton lines={4} className="h-32" />
        </div>
      ) : reservations.length === 0 ? (
        <Card className="bg-gray-50 p-8 text-center">
          <p className="text-gray-500 mb-2">No reservations yet</p>
          <p className="text-sm text-gray-400">
            Create a new reservation to see it here
          </p>
          <Button
            onClick={() => router.push('/reservations/new')}
            className="mt-4 bg-blue-600 text-white hover:bg-blue-700"
          >
            Create Reservation
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reservations.map((reservation) => (
            <Card
              key={reservation.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/reservations/${reservation.id}`)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Reservation #{reservation.id.slice(0, 8)}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {reservation.guest_count} guest{reservation.guest_count !== 1 ? 's' : ''} •{' '}
                    {new Date(reservation.reservation_date).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    reservation.status
                  )}`}
                >
                  {reservation.status}
                </span>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/reservations/${reservation.id}`);
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  View Details →
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
