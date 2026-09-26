'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import axios from 'axios'
import { Button, Card, Badge } from '@/components'

interface OrderItem {
  name: string
  quantity: number
  unit_price: number
}

interface PreOrderDetail {
  id: string
  business_name: string
  delivery_date: string
  items: OrderItem[]
  status: string
  total_price: number
  special_requests: string
  created_at: string
}

export default function PreOrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<PreOrderDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    loadOrder()
  }, [orderId, router])

  const loadOrder = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        `http://localhost:8000/api/v1/pre_orders/${orderId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      setOrder(response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ön sipariş yüklenemedi')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Bu ön siparişi iptal etmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      await axios.delete(
        `http://localhost:8000/api/v1/pre_orders/${orderId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      router.push('/pre-orders')
    } catch (err) {
      setError('İptal işlemi başarısız oldu')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p>Yükleniyor...</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Card className="text-center p-8">
          <p className="text-4xl mb-4">❌</p>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
          <Button onClick={() => router.push('/pre-orders')}>
            Geri Dön
          </Button>
        </Card>
      </div>
    )
  }

  const statusConfig: Record<string, { variant: any; label: string; emoji: string }> = {
    pending: { variant: 'warning', label: 'Beklemede', emoji: '⏳' },
    confirmed: { variant: 'success', label: 'Onaylandı', emoji: '✅' },
    ready: { variant: 'success', label: 'Hazır', emoji: '📦' },
    completed: { variant: 'primary', label: 'Tamamlandı', emoji: '🎉' },
    cancelled: { variant: 'error', label: 'İptal Edildi', emoji: '❌' },
  }

  const statusInfo = statusConfig[order.status] || statusConfig.pending

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.push('/pre-orders')}
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm mb-8"
        >
          ← Geri Dön
        </button>

        {/* Main Card */}
        <Card className="mb-6">
          <div className="p-8">
            {/* Status Banner */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="h2 mb-2">{order.business_name}</h1>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{statusInfo.emoji}</span>
                  <Badge variant={statusInfo.variant}>
                    {statusInfo.label}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="space-y-6">
              {/* Delivery Date */}
              <div className="pb-6 border-b border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  Teslimat Tarihi
                </p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {new Date(order.delivery_date).toLocaleDateString('tr-TR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {/* Items */}
              <div className="pb-6 border-b border-slate-200 dark:border-slate-700">
                <h3 className="h4 mb-4">Ürünler</h3>
                <div className="space-y-3">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-700 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {item.name}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {item.quantity} x {item.unit_price.toFixed(2)} TRY
                        </p>
                      </div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {(item.quantity * item.unit_price).toFixed(2)} TRY
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Price */}
              <div className="pb-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    Toplam Tutar
                  </p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {(order.total_price / 100).toFixed(2)} TRY
                  </p>
                </div>
              </div>

              {/* Special Requests */}
              {order.special_requests && (
                <div className="pb-6 border-b border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Özel İstekler
                  </p>
                  <p className="text-slate-900 dark:text-white">
                    {order.special_requests}
                  </p>
                </div>
              )}

              {/* Order Date */}
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  Sipariş Tarihi
                </p>
                <p className="text-slate-900 dark:text-white">
                  {new Date(order.created_at).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        {order.status === 'pending' && (
          <Card className="border-red-200 dark:border-red-900 mb-6">
            <div className="p-6">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Siparişiniz henüz onay bekliyorsa iptal edebilirsiniz.
              </p>
              <Button
                fullWidth
                variant="danger"
                onClick={handleCancel}
              >
                Siparişi İptal Et
              </Button>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            fullWidth
            variant="outline"
            onClick={() => router.push('/chat')}
          >
            Sohbete Dön
          </Button>
          <Button
            fullWidth
            variant="outline"
            onClick={() => router.push('/pre-orders')}
          >
            Tüm Siparişler
          </Button>
        </div>
      </div>
    </div>
  )
}
