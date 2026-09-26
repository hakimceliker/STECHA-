'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Button, Card, Badge } from '@/components'

interface BusinessStats {
  id: string
  name: string
  capacity: number
  current_reservations: number
  pending_orders: number
  utilization_rate: number
  owner_id: string
}

export default function RestaurantPage() {
  const router = useRouter()
  const [business, setBusiness] = useState<BusinessStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    loadBusinessData()
  }, [router])

  const loadBusinessData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        'http://localhost:8000/api/v1/restaurant',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      setBusiness(response.data.business)
    } catch (error) {
      console.error('Failed to load business data:', error)
      router.push('/login')
    } finally {
      setIsLoading(false)
    }
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="h1 mb-2">{business?.name || 'Restoran Paneli'}</h1>
            <p className="body-sm text-slate-600 dark:text-slate-400">
              İşletmenizi yönetin ve siparişleri kontrol edin
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/profile')}
            >
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
          {['overview', 'reservations', 'pre_orders', 'settings'].map(tab => (
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

        {/* Overview Tab */}
        {activeTab === 'overview' && business && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <div className="p-6">
                  <h3 className="h5 text-slate-600 dark:text-slate-400 mb-2">Kapasitesi</h3>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {business.capacity}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Toplam masa sayısı
                  </p>
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <h3 className="h5 text-slate-600 dark:text-slate-400 mb-2">Mevcut Rezervasyonlar</h3>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                    {business.current_reservations}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Aktif rezervasyon
                  </p>
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <h3 className="h5 text-slate-600 dark:text-slate-400 mb-2">Bekleyen Siparişler</h3>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                    {business.pending_orders}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    İşlenmeyi bekleyen
                  </p>
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <h3 className="h5 text-slate-600 dark:text-slate-400 mb-2">Kapasite Kullanım</h3>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                    {(business.utilization_rate * 100).toFixed(0)}%
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Dolu masa oranı
                  </p>
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <div className="p-6">
                <h3 className="h4 mb-6">Hızlı İşlemler</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button fullWidth variant="primary" size="lg">
                    ✅ Yeni Rezervasyon Onayla
                  </Button>
                  <Button fullWidth variant="primary" size="lg">
                    📋 Siparişleri Gözden Geçir
                  </Button>
                  <Button fullWidth variant="outline" size="lg">
                    👥 Müşterileri Görüntüle
                  </Button>
                  <Button fullWidth variant="outline" size="lg">
                    📊 Raporlar
                  </Button>
                </div>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card>
              <div className="p-6">
                <h3 className="h4 mb-6">Son Aktiviteler</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="text-2xl">🍽️</div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white">Yeni Rezervasyon</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">5 masa için bu akşam 19:00</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">2 dakika önce</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="text-2xl">📦</div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white">Yeni Ön Sipariş</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">3 Kişi için Paket Menü</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">15 dakika önce</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">✅</div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white">Rezervasyon Onaylandı</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">2 masa için yarın 13:30</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">1 saat önce</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Reservations Tab */}
        {activeTab === 'reservations' && (
          <Card>
            <div className="p-6">
              <h3 className="h4 mb-6">Rezervasyon Yönetimi</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Gelen rezervasyonları onaylayın, reddedin veya düzenleyin.
              </p>
              <Button variant="outline">Tüm Rezervasyonları Görüntüle</Button>
            </div>
          </Card>
        )}

        {/* Pre Orders Tab */}
        {activeTab === 'pre_orders' && (
          <Card>
            <div className="p-6">
              <h3 className="h4 mb-6">Ön Sipariş Yönetimi</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Müşteri ön siparişlerini yönetin ve hazırlama durumunu takip edin.
              </p>
              <Button variant="outline">Tüm Ön Siparişleri Görüntüle</Button>
            </div>
          </Card>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <Card>
            <div className="p-6">
              <h3 className="h4 mb-6">İşletme Ayarları</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    İşletme Adı
                  </label>
                  <input
                    type="text"
                    defaultValue={business?.name}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Kapasite (Masa Sayısı)
                  </label>
                  <input
                    type="number"
                    defaultValue={business?.capacity}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button>Değişiklikleri Kaydet</Button>
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
