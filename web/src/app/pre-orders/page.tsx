'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Button, Card, Badge } from '@/components'

interface PreOrder {
  id: string
  business_name: string
  order_date: string
  delivery_date: string
  items: string[]
  status: 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled'
  total_price: number
}

export default function PreOrdersPage() {
  const router = useRouter()
  const [preOrders, setPreOrders] = useState<PreOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<PreOrder[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    loadPreOrders()
  }, [router])

  useEffect(() => {
    filterOrders()
  }, [preOrders, filterStatus])

  const loadPreOrders = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        'http://localhost:8000/api/v1/pre_orders',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      setPreOrders(response.data.pre_orders || [])
    } catch (error) {
      console.error('Failed to load pre-orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterOrders = () => {
    if (filterStatus === 'all') {
      setFilteredOrders(preOrders)
    } else {
      setFilteredOrders(preOrders.filter(o => o.status === filterStatus))
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'ready':
        return 'success'
      case 'completed':
        return 'primary'
      case 'cancelled':
        return 'error'
      default:
        return 'warning'
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Beklemede',
      confirmed: 'Onaylandı',
      ready: 'Hazır',
      completed: 'Tamamlandı',
      cancelled: 'İptal Edildi',
    }
    return labels[status] || status
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p>Yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <button
              onClick={() => router.push('/chat')}
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm mb-4"
            >
              ← Sohbete Dön
            </button>
            <h1 className="h1 mb-2">Ön Siparişlerim</h1>
            <p className="body-sm text-slate-600 dark:text-slate-400">
              Tüm ön siparişlerinizi yönetin
            </p>
          </div>
          <Button onClick={() => router.push('/pre-orders/new')} size="lg">
            + Yeni Ön Sipariş
          </Button>
        </div>

        {/* Filter */}
        <Card className="mb-6">
          <div className="p-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Durum
            </label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full md:w-64 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="all">Tümü</option>
              <option value="pending">Beklemede</option>
              <option value="confirmed">Onaylandı</option>
              <option value="ready">Hazır</option>
              <option value="completed">Tamamlandı</option>
              <option value="cancelled">İptal Edildi</option>
            </select>
          </div>
        </Card>

        {/* Pre-Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-4xl mb-4">📦</p>
              <h3 className="h4 mb-2">Henüz Ön Sipariş Yok</h3>
              <p className="body-sm text-slate-600 dark:text-slate-400 mb-6">
                İlk ön siparişinizi vererek başlayın
              </p>
              <Button onClick={() => router.push('/pre-orders/new')}>
                Yeni Ön Sipariş Oluştur
              </Button>
            </Card>
          ) : (
            filteredOrders.map(order => (
              <Card
                key={order.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/pre-orders/${order.id}`)}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="h4 text-slate-900 dark:text-white mb-2">
                        {order.business_name}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {order.items.join(', ')}
                      </p>
                    </div>
                    <Badge variant={getStatusBadgeVariant(order.status)}>
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Sipariş Tarihi</p>
                      <p className="font-medium text-slate-900 dark:text-white text-sm">
                        {new Date(order.order_date).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Teslim Tarihi</p>
                      <p className="font-medium text-slate-900 dark:text-white text-sm">
                        {new Date(order.delivery_date).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Tutar</p>
                      <p className="font-medium text-slate-900 dark:text-white text-sm">
                        ${(order.total_price / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
