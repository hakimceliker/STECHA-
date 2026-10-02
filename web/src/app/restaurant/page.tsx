'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Badge } from '@/components'
import { useRestaurant } from '@/hooks'

export default function RestaurantPage() {
  const router = useRouter()
  const {
    business,
    stats,
    upcomingReservations,
    pendingPreOrders,
    loading,
    error,
    getMyBusiness,
    getStats,
    getUpcomingReservations,
    getPendingPreOrders,
    confirmReservation,
    cancelReservation,
    confirmPreOrder,
    cancelPreOrder,
    clearError,
  } = useRestaurant()

  const [activeTab, setActiveTab] = useState('overview')
  const [settingsFormData, setSettingsFormData] = useState({
    name: '',
    phone: '',
    email: '',
    description: '',
    daily_capacity: 0,
  })

  const loadInitialData = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (!token) {
        router.push('/login')
        return
      }

      await getMyBusiness()
      await getStats()
      await getUpcomingReservations(10)
      await getPendingPreOrders(10)
    } catch (err) {
      console.error('Failed to load restaurant data:', err)
      router.push('/login')
    }
  }, [getMyBusiness, getStats, getUpcomingReservations, getPendingPreOrders, router])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  useEffect(() => {
    if (business) {
      setSettingsFormData({
        name: business.name || '',
        phone: business.phone || '',
        email: business.email || '',
        description: business.description || '',
        daily_capacity: business.daily_capacity || 0,
      })
    }
  }, [business])

  const handleReservationConfirm = async (reservationId: number) => {
    try {
      await confirmReservation(reservationId)
    } catch (err) {
      console.error('Failed to confirm reservation:', err)
    }
  }

  const handleReservationCancel = async (reservationId: number) => {
    try {
      await cancelReservation(reservationId)
    } catch (err) {
      console.error('Failed to cancel reservation:', err)
    }
  }

  const handlePreOrderConfirm = async (preOrderId: number) => {
    try {
      await confirmPreOrder(preOrderId)
    } catch (err) {
      console.error('Failed to confirm pre-order:', err)
    }
  }

  const handlePreOrderCancel = async (preOrderId: number) => {
    try {
      await cancelPreOrder(preOrderId)
    } catch (err) {
      console.error('Failed to cancel pre-order:', err)
    }
  }

  if (loading && !business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="text-slate-600 dark:text-slate-400">Yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">
              {business?.name || 'Restoran Paneli'}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              İşletmenizi yönetin ve siparişleri kontrol edin
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/profile')}>
              Profil
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                router.push('/login')
              }}
            >
              Çıkış Yap
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8 flex gap-2 border-b border-slate-200 dark:border-slate-700">
          {['overview', 'reservations', 'pre_orders', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab === 'overview' && '📊 Genel Bakış'}
              {tab === 'reservations' && '🍽️ Rezervasyonlar'}
              {tab === 'pre_orders' && '📦 Ön Siparişler'}
              {tab === 'settings' && '⚙️ Ayarlar'}
            </button>
          ))}
        </div>

        {error && (
          <Card className="mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <div className="p-6 flex justify-between items-center">
              <p className="text-red-700 dark:text-red-200">{error}</p>
              <Button variant="outline" size="sm" onClick={clearError}>
                Kapat
              </Button>
            </div>
          </Card>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && business && stats && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <div className="p-6">
                  <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Toplam Rezervasyonlar
                  </h3>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {stats.total_reservations}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Tüm zaman</p>
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Toplam Ön Siparişler
                  </h3>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                    {stats.total_pre_orders}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Tüm zaman</p>
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Bekleyen Onaylar
                  </h3>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                    {stats.pending_approvals}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Onay bekleniyor</p>
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Tahmini Gelir
                  </h3>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                    ₺{stats.revenue.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Toplam gelir</p>
                </div>
              </Card>
            </div>

            {/* Upcoming Reservations */}
            {upcomingReservations.length > 0 && (
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
                    Yaklaşan Rezervasyonlar
                  </h3>
                  <div className="space-y-3">
                    {upcomingReservations.slice(0, 5).map((reservation) => (
                      <div
                        key={reservation.id}
                        className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {reservation.guest_count} Kişi - {new Date(reservation.reservation_date).toLocaleString('tr-TR')}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {reservation.user_name || `Kullanıcı #${reservation.user_id}`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={reservation.approval_status === 'approved' ? 'success' : 'warning'}>
                            {reservation.approval_status === 'approved' ? 'Onaylı' : 'Beklemede'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Reservations Tab */}
        {activeTab === 'reservations' && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
                Rezervasyon Yönetimi
              </h3>
              {upcomingReservations.length === 0 ? (
                <p className="text-slate-600 dark:text-slate-400">Hiçbir rezervasyon yok</p>
              ) : (
                <div className="space-y-4">
                  {upcomingReservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-600 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-white">
                          {reservation.guest_count} Kişi - {new Date(reservation.reservation_date).toLocaleString('tr-TR')}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {reservation.user_name || `Kullanıcı #${reservation.user_id}`}
                        </p>
                        {reservation.special_requests && (
                          <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                            Not: {reservation.special_requests}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={reservation.approval_status === 'approved' ? 'success' : 'warning'}>
                          {reservation.approval_status === 'approved' ? 'Onaylı' : 'Beklemede'}
                        </Badge>
                        {reservation.approval_status !== 'approved' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleReservationConfirm(reservation.id)}
                              disabled={loading}
                            >
                              Onayla
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReservationCancel(reservation.id)}
                              disabled={loading}
                            >
                              Reddet
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Pre Orders Tab */}
        {activeTab === 'pre_orders' && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
                Ön Sipariş Yönetimi
              </h3>
              {pendingPreOrders.length === 0 ? (
                <p className="text-slate-600 dark:text-slate-400">Hiçbir ön sipariş yok</p>
              ) : (
                <div className="space-y-4">
                  {pendingPreOrders.map((preOrder) => (
                    <div
                      key={preOrder.id}
                      className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-600 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-white">
                          {preOrder.items_description || `Sipariş #${preOrder.id}`}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {preOrder.user_name || `Kullanıcı #${preOrder.user_id}`} · ₺{preOrder.total_try.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                          Alınacak: {preOrder.pickup_date ? new Date(preOrder.pickup_date).toLocaleString('tr-TR') : 'Belirtilmedi'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={preOrder.approval_status === 'approved' ? 'success' : 'warning'}>
                          {preOrder.approval_status === 'approved' ? 'Onaylı' : 'Beklemede'}
                        </Badge>
                        {preOrder.approval_status !== 'approved' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handlePreOrderConfirm(preOrder.id)}
                              disabled={loading}
                            >
                              Onayla
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePreOrderCancel(preOrder.id)}
                              disabled={loading}
                            >
                              Reddet
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && business && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-6 text-slate-900 dark:text-white">
                İşletme Ayarları
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    İşletme Adı
                  </label>
                  <input
                    type="text"
                    value={settingsFormData.name}
                    onChange={(e) => setSettingsFormData({ ...settingsFormData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={settingsFormData.phone}
                    onChange={(e) => setSettingsFormData({ ...settingsFormData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    E-posta
                  </label>
                  <input
                    type="email"
                    value={settingsFormData.email}
                    onChange={(e) => setSettingsFormData({ ...settingsFormData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Açıklama
                  </label>
                  <textarea
                    value={settingsFormData.description}
                    onChange={(e) => setSettingsFormData({ ...settingsFormData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Günlük Kapasite
                  </label>
                  <input
                    type="number"
                    value={settingsFormData.daily_capacity}
                    onChange={(e) =>
                      setSettingsFormData({ ...settingsFormData, daily_capacity: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button disabled={loading}>Değişiklikleri Kaydet</Button>
                  <Button variant="outline">İptal</Button>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
