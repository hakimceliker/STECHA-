'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Input, Badge } from '@/components'
import { useRestaurant } from '@/hooks'

export default function RestaurantReservationsPage() {
  const router = useRouter()
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState<string>('')

  const {
    upcomingReservations,
    loading,
    error,
    getUpcomingReservations,
    confirmReservation,
    cancelReservation,
    clearError,
  } = useRestaurant()

  const loadReservations = useCallback(async () => {
    try {
      await getUpcomingReservations(100, 0)
    } catch (error) {
      console.error('Failed to load reservations:', error)
    }
  }, [getUpcomingReservations])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    loadReservations()
  }, [router, loadReservations])

  const handleConfirmReservation = async (id: number) => {
    try {
      await confirmReservation(id)
      alert('Rezervasyon başarıyla onaylandı')
    } catch (error) {
      console.error('Failed to confirm reservation:', error)
    }
  }

  const handleCancelReservation = async (id: number) => {
    try {
      const reason = window.prompt('İptal nedeni (opsiyonel):')
      await cancelReservation(id, reason || undefined)
      alert('Rezervasyon başarıyla iptal edildi')
    } catch (error) {
      console.error('Failed to cancel reservation:', error)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success'
      case 'pending':
        return 'warning'
      case 'cancelled':
        return 'error'
      default:
        return 'primary'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Onaylı'
      case 'pending':
        return 'Beklemede'
      case 'cancelled':
        return 'İptal Edildi'
      default:
        return status
    }
  }

  const filteredReservations = upcomingReservations.filter((res) => {
    if (filterStatus !== 'all' && res.status !== filterStatus) {
      return false
    }
    if (searchTerm && !res.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    if (dateFilter) {
      const resDate = new Date(res.reservation_date).toISOString().split('T')[0]
      if (resDate !== dateFilter) {
        return false
      }
    }
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p>Yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/restaurant')}
            className="text-blue-600 dark:text-blue-400 hover:underline mb-4"
          >
            ← Restoran Paneline Dön
          </button>
          <h1 className="h1 mb-2">Rezervasyonlar</h1>
          <p className="body-sm text-slate-600 dark:text-slate-400">
            Masa rezervasyonlarını yönet ve onayla
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 p-6 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <div className="flex justify-between items-start">
              <p className="text-red-800 dark:text-red-200">{error}</p>
              <button
                onClick={clearError}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
              >
                ✕
              </button>
            </div>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Input
              label="Müşteri Adı"
              placeholder="Müşteri adı ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Input
              label="Tarih"
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Durum
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="all">Tümü</option>
                <option value="pending">Beklemede</option>
                <option value="confirmed">Onaylı</option>
                <option value="cancelled">İptal Edildi</option>
              </select>
            </div>
          </div>
          <Button onClick={loadReservations} variant="outline">
            Yenile
          </Button>
        </Card>

        {/* Reservations List */}
        <div className="space-y-4">
          {filteredReservations.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-4xl mb-4">🍽️</p>
              <h3 className="h4 mb-2">Rezervasyon Bulunamadı</h3>
              <p className="body-sm text-slate-600 dark:text-slate-400">
                Arama kriterlerinize uygun rezervasyon yok
              </p>
            </Card>
          ) : (
            filteredReservations.map((reservation) => (
              <Card key={reservation.id} className="p-6">
                <div className="mb-4 flex justify-between items-start">
                  <div>
                    <h3 className="h4 text-slate-900 dark:text-white mb-2">
                      {reservation.customer_name}
                    </h3>
                    <div className="flex gap-2 items-center">
                      <Badge variant={getStatusBadgeVariant(reservation.status) as any}>
                        {getStatusLabel(reservation.status)}
                      </Badge>
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        ID: {reservation.id}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Müşteri #{reservation.user_id}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-slate-200 dark:border-slate-700">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                      Tarih
                    </p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {new Date(reservation.reservation_date).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                      Saat
                    </p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {new Date(reservation.reservation_date).toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                      Misafir Sayısı
                    </p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {reservation.guest_count} kişi
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                      İletişim
                    </p>
                    <p className="font-medium text-slate-900 dark:text-white text-sm">
                      {reservation.customer_phone || '-'}
                    </p>
                  </div>
                </div>

                {reservation.special_requests && (
                  <div className="py-4 border-b border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                      Özel İstekler
                    </p>
                    <p className="text-slate-900 dark:text-white">
                      {reservation.special_requests}
                    </p>
                  </div>
                )}

                {reservation.status === 'pending' && (
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleConfirmReservation(reservation.id)}
                    >
                      Onayla
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCancelReservation(reservation.id)}
                    >
                      İptal Et
                    </Button>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
