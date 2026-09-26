'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Button, Card, Badge } from '@/components'

interface Metrics {
  total_users: number
  total_conversations: number
  total_reservations: number
  total_pre_orders: number
  pending_approvals: number
  revenue_estimate: number
}

export default function AdminPage() {
  const router = useRouter()
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('metrics')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    loadMetrics()
  }, [router])

  const loadMetrics = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        'http://localhost:8000/api/v1/admin/metrics',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      setMetrics(response.data)
    } catch (error) {
      console.error('Failed to load metrics:', error)
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

        {/* Reservations Tab */}
        {activeTab === 'reservations' && (
          <Card>
            <div className="p-6">
              <h3 className="h4 mb-6">Rezervasyon Yönetimi</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Bu bölüm yapım aşamasındadır. Tüm rezervasyonları burada görebilecek ve onaylayabileceksiniz.
              </p>
              <Button variant="outline">Rezervasyonları Yükle</Button>
            </div>
          </Card>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <Card>
            <div className="p-6">
              <h3 className="h4 mb-6">Kullanıcı Yönetimi</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Bu bölüm yapım aşamasındadır. Tüm kullanıcıları burada görebilecek ve yönetebileceksiniz.
              </p>
              <Button variant="outline">Kullanıcıları Yükle</Button>
            </div>
          </Card>
        )}

        {/* Pre Orders Tab */}
        {activeTab === 'pre_orders' && (
          <Card>
            <div className="p-6">
              <h3 className="h4 mb-6">Ön Sipariş Yönetimi</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Bu bölüm yapım aşamasındadır. Tüm ön siparişleri burada görebilecek ve yönetebileceksiniz.
              </p>
              <Button variant="outline">Ön Siparişleri Yükle</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
