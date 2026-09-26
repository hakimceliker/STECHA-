'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Badge, Input } from '@/components'
import { useAdmin } from '@/hooks'
import type { ApprovalQueueItem } from '@/types'

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('metrics')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const {
    metrics,
    loading,
    error,
    approvalQueue,
    users,
    businesses,
    getMetrics,
    getApprovalQueue,
    listUsers,
    listBusinesses,
    approveReservation,
    rejectReservation,
    approvePreOrder,
    rejectPreOrder,
    clearError,
  } = useAdmin()

  const loadInitialData = useCallback(async () => {
    try {
      await getMetrics()
      await getApprovalQueue()
    } catch (error) {
      console.error('Failed to load initial data:', error)
    }
  }, [getMetrics, getApprovalQueue])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    loadInitialData()
  }, [router, loadInitialData])

  const handleApproveReservation = async (id: number) => {
    try {
      await approveReservation(id)
    } catch (error) {
      console.error('Failed to approve reservation:', error)
    }
  }

  const handleRejectReservation = async (id: number) => {
    try {
      await rejectReservation(id)
    } catch (error) {
      console.error('Failed to reject reservation:', error)
    }
  }

  const handleApprovePreOrder = async (id: number) => {
    try {
      await approvePreOrder(id)
    } catch (error) {
      console.error('Failed to approve pre-order:', error)
    }
  }

  const handleRejectPreOrder = async (id: number) => {
    try {
      await rejectPreOrder(id)
    } catch (error) {
      console.error('Failed to reject pre-order:', error)
    }
  }

  const getApprovalQueueItems = () => {
    if (filterStatus === 'all') {
      return approvalQueue
    }
    return approvalQueue.filter((item) => item.type === filterStatus)
  }

  if (loading && activeTab === 'metrics') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p>Yükleniyor...</p>
      </div>
    )
  }

  const filteredItems = getApprovalQueueItems()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="h1 mb-2">Yönetici Paneli</h1>
            <p className="body-sm text-slate-600 dark:text-slate-400">
              Stech AI Yönetim İstatistikleri
            </p>
          </div>
          <div className="flex gap-2">
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
          {['metrics', 'reservations', 'users', 'pre_orders'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab === 'metrics' && '📊 Metriks'}
              {tab === 'reservations' && '🍽️ Rezervasyonlar'}
              {tab === 'users' && '👥 Kullanıcılar'}
              {tab === 'pre_orders' && '📦 Ön Siparişler'}
            </button>
          ))}
        </div>

        {/* Metrics Tab */}
        {activeTab === 'metrics' && metrics && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="h4 text-slate-900 dark:text-white">Toplam Kullanıcı</h3>
                    <span className="text-2xl">👥</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {metrics.total_users}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Kayıtlı kullanıcı sayısı
                  </p>
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="h4 text-slate-900 dark:text-white">Sohbetler</h3>
                    <span className="text-2xl">💬</span>
                  </div>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                    {metrics.total_conversations}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Toplam sohbet sayısı
                  </p>
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="h4 text-slate-900 dark:text-white">Rezervasyonlar</h3>
                    <span className="text-2xl">🍽️</span>
                  </div>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                    {metrics.total_reservations}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Toplam rezervasyon
                  </p>
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="h4 text-slate-900 dark:text-white">Ön Siparişler</h3>
                    <span className="text-2xl">📦</span>
                  </div>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                    {metrics.total_pre_orders}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Toplam ön sipariş
                  </p>
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="h4 text-slate-900 dark:text-white">Onay Bekleme</h3>
                    <span className="text-2xl">⏳</span>
                  </div>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                    {metrics.pending_approvals}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Bekleyen onaylar
                  </p>
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="h4 text-slate-900 dark:text-white">Tahmini Gelir</h3>
                    <span className="text-2xl">💰</span>
                  </div>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                    ${(metrics.revenue_estimate / 100).toFixed(2)}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Toplam tahmini gelir
                  </p>
                </div>
              </Card>
            </div>

            {/* Charts Placeholder */}
            <Card>
              <div className="p-6">
                <h3 className="h4 mb-6">Kullanıcı Aktivitesi</h3>
                <div className="h-64 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                  <p className="text-slate-600 dark:text-slate-400">
                    Grafik burada gösterilecektir
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Approvals Tab */}
        {activeTab === 'reservations' && (
          <div className="space-y-6">
            {/* Filter */}
            <Card>
              <div className="p-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tür
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full md:w-64 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="all">Tümü</option>
                  <option value="reservation">Rezervasyonlar</option>
                  <option value="pre_order">Ön Siparişler</option>
                </select>
              </div>
            </Card>

            {/* Approval Queue List */}
            <div className="space-y-4">
              {filteredItems.length === 0 ? (
                <Card className="text-center py-12">
                  <p className="text-4xl mb-4">✅</p>
                  <h3 className="h4 mb-2">Onay Bekleyen Öğe Yok</h3>
                  <p className="body-sm text-slate-600 dark:text-slate-400">
                    Tüm rezervasyonlar ve ön siparişler onaylanmıştır
                  </p>
                </Card>
              ) : (
                filteredItems.map((item: ApprovalQueueItem) => (
                  <Card key={`${item.type}-${item.id}`} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="h4 text-slate-900 dark:text-white mb-2">
                          {item.type === 'reservation' ? '🍽️ Rezervasyon' : '📦 Ön Sipariş'}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Kullanıcı #{item.user_id} | İşletme #{item.business_id}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            if (item.type === 'reservation') {
                              handleApproveReservation(item.id)
                            } else {
                              handleApprovePreOrder(item.id)
                            }
                          }}
                        >
                          Onayla
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (item.type === 'reservation') {
                              handleRejectReservation(item.id)
                            } else {
                              handleRejectPreOrder(item.id)
                            }
                          }}
                        >
                          Reddet
                        </Button>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {item.type === 'reservation' && (
                          <>
                            <div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                                Tarih
                              </p>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {item.detail.reservation_date
                                  ? new Date(item.detail.reservation_date).toLocaleDateString('tr-TR')
                                  : '-'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                                Misafir Sayısı
                              </p>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {item.detail.guest_count || '-'} kişi
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                                Onay Puanı
                              </p>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {item.detail.approval_score?.toFixed(2) || '-'}
                              </p>
                            </div>
                          </>
                        )}
                        {item.type === 'pre_order' && (
                          <>
                            <div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                                Teslim Tarihi
                              </p>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {item.detail.pickup_date
                                  ? new Date(item.detail.pickup_date).toLocaleDateString('tr-TR')
                                  : '-'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                                Tutar
                              </p>
                              <p className="font-medium text-slate-900 dark:text-white">
                                ₺{item.detail.total_try?.toFixed(2) || '-'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                                Ürün Sayısı
                              </p>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {item.detail.items_count || '-'}
                              </p>
                            </div>
                          </>
                        )}
                        <div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                            Oluşturma Tarihi
                          </p>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {new Date(item.created_at).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Search */}
            <Card>
              <div className="p-6">
                <Input
                  label="Kullanıcı Ara"
                  placeholder="Email veya ad ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button
                  className="mt-4"
                  onClick={() => listUsers(100, 0, searchTerm || undefined)}
                >
                  Ara
                </Button>
              </div>
            </Card>

            {/* Users List */}
            <div className="space-y-4">
              {users.length === 0 ? (
                <Card className="text-center py-12">
                  <p className="text-4xl mb-4">👤</p>
                  <h3 className="h4 mb-2">Kullanıcı Bulunamadı</h3>
                  <p className="body-sm text-slate-600 dark:text-slate-400">
                    Arama kritelerinize uygun kullanıcı yok
                  </p>
                </Card>
              ) : (
                users.map((user) => (
                  <Card key={user.id} className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="h4 text-slate-900 dark:text-white mb-2">
                          {user.name}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                          {user.email}
                        </p>
                        <div className="flex gap-2 items-center">
                          {user.is_admin && (
                            <Badge variant="success">Admin</Badge>
                          )}
                          <span className="text-xs text-slate-600 dark:text-slate-400">
                            ID: {user.id}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/admin/users/${user.id}`)}
                        >
                          Düzenle
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* Businesses Tab */}
        {activeTab === 'pre_orders' && (
          <div className="space-y-6">
            {/* Businesses List */}
            <div className="space-y-4">
              {businesses.length === 0 ? (
                <Card className="text-center py-12">
                  <p className="text-4xl mb-4">🏢</p>
                  <h3 className="h4 mb-2">İşletme Bulunamadı</h3>
                  <p className="body-sm text-slate-600 dark:text-slate-400">
                    Sistemde kayıtlı işletme yok
                  </p>
                </Card>
              ) : (
                businesses.map((business) => (
                  <Card key={business.id} className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="h4 text-slate-900 dark:text-white mb-2">
                          {business.name}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                          Sahip #{business.owner_id}
                        </p>
                        <div className="flex gap-2 items-center">
                          <Badge
                            variant={
                              business.status === 'active'
                                ? 'success'
                                : business.status === 'suspended'
                                  ? 'error'
                                  : 'warning'
                            }
                          >
                            {business.status === 'active' && 'Aktif'}
                            {business.status === 'suspended' && 'Askıya Alındı'}
                            {business.status === 'inactive' && 'Pasif'}
                          </Badge>
                          <span className="text-xs text-slate-600 dark:text-slate-400">
                            Komisyon: %{(business.commission_rate * 100).toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/admin/businesses/${business.id}`)}
                        >
                          Görüntüle
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
