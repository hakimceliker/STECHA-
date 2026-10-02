'use client';

import { useRouter } from 'next/navigation';
import { Button } from './Button';
import { Card } from './Card';
import { LoadingSkeleton } from './LoadingSkeleton';

interface PreOrder {
  id: string;
  business_id: string;
  items: string[];
  pickup_date: string;
  status: string;
}

interface PreOrderListProps {
  preOrders: PreOrder[];
  isLoading: boolean;
  onRefresh: () => void;
}

export default function PreOrderList({
  preOrders,
  isLoading,
  onRefresh,
}: PreOrderListProps) {
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
          {preOrders.length} pre-order{preOrders.length !== 1 ? 's' : ''}
        </p>
        <Button
          onClick={onRefresh}
          disabled={isLoading}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {isLoading && preOrders.length === 0 ? (
        <div className="space-y-4">
          <LoadingSkeleton lines={4} className="h-32" />
          <LoadingSkeleton lines={4} className="h-32" />
          <LoadingSkeleton lines={4} className="h-32" />
        </div>
      ) : preOrders.length === 0 ? (
        <Card className="bg-gray-50 p-8 text-center">
          <p className="text-gray-500 mb-2">No pre-orders yet</p>
          <p className="text-sm text-gray-400">
            Create a new pre-order to see it here
          </p>
          <Button
            onClick={() => router.push('/pre-orders/new')}
            className="mt-4 bg-blue-600 text-white hover:bg-blue-700"
          >
            Create Pre-Order
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {preOrders.map((preOrder) => (
            <Card
              key={preOrder.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/pre-orders/${preOrder.id}`)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Pre-Order #{preOrder.id.slice(0, 8)}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Pickup: {new Date(preOrder.pickup_date).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    preOrder.status
                  )}`}
                >
                  {preOrder.status}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Items:</p>
                <div className="flex flex-wrap gap-2">
                  {preOrder.items.slice(0, 3).map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700"
                    >
                      {item}
                    </span>
                  ))}
                  {preOrder.items.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                      +{preOrder.items.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/pre-orders/${preOrder.id}`);
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
