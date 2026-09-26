'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Card, Badge } from '@/components'

interface AnalyticsData {
  total_messages: number
  total_tokens_used: number
  average_response_time: number
  user_engagement_rate: number
  conversation_topics: string[]
  daily_active_users: number
  reservation_conversion_rate: number
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [timeRange, setTimeRange] = useState('7days')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    loadAnalytics()
  }, [router, timeRange])

  const loadAnalytics = async () => {
    try {
      const token = localStorage.getItem('token')
      // In a real app, this would call an analytics endpoint
      // For now, we'll show placeholder data
      setAnalytics({
        total_messages: 2543,
        total_tokens_used: 125430,
        average_response_time: 1.2,
        user_engagement_rate: 78.5,
        conversation_topics: ['Reservation', 'Pre-order', 'Restaurant Info', 'Menu Inquiry'],
        daily_active_users: 342,
        reservation_conversion_rate: 64.3,
      })
    } catch (error) {
      console.error('Failed to load analytics:', error)
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
            <button
              onClick={() => router.push('/chat')}
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm mb-4"
            >
              ← Sohbete Dön
            </button>
            <h1 className="h1 mb-2">Analitikler</h1>
            <p className="body-sm text-slate-600 dark:text-slate-400">
              Platform kullanım istatistikleri ve eğilimleri
            </p>
          </div>
        </div>

        {/* Time Range Filter */}
        <Card className="mb-8">
          <div className="p-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Zaman Aralığı
            </label>
            <div className="flex gap-2 flex-wrap">
              {['24hours', '7days', '30days', '90days'].map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    timeRange === range
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600'
                  }`}
                >
                  {range === '24hours' && 'Son 24 Saat'}
                  {range === '7days' && 'Son 7 Gün'}
                  {range === '30days' && 'Son 30 Gün'}
                  {range === '90days' && 'Son 90 Gün'}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="p-6">
              <h3 className="h5 text-slate-600 dark:text-slate-400 mb-2">Toplam Mesaj</h3>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {analytics?.total_messages.toLocaleString()}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                +12% geçen dönem
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="h5 text-slate-600 dark:text-slate-400 mb-2">Kullanılan Token</h3>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                {(analytics?.total_tokens_used || 0 / 1000).toFixed(0)}K
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {analytics?.total_tokens_used.toLocaleString()} token
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="h5 text-slate-600 dark:text-slate-400 mb-2">
                Aktif Kullanıcılar
              </h3>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {analytics?.daily_active_users}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Günlük ortalama
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="h5 text-slate-600 dark:text-slate-400 mb-2">
                Çevrim Oranı
              </h3>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                {analytics?.reservation_conversion_rate}%
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Rezervasyon dönüşümü
              </p>
            </div>
          </Card>
        </div>

        {/* Charts and Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Response Time */}
          <Card>
            <div className="p-6">
              <h3 className="h4 mb-6">Ortalama Yanıt Süresi</h3>
              <div className="flex items-end justify-between h-40">
                {[1.5, 1.3, 1.1, 1.4, 1.2, 1.0, 1.2].map((value, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-6 bg-blue-600 rounded-t-lg mb-2"
                      style={{ height: `${(value / 2) * 100}%` }}
                    ></div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {idx === 0 ? 'Pzt' : idx === 1 ? 'Sal' : idx === 2 ? 'Çar' : idx === 3 ? 'Per' : idx === 4 ? 'Cum' : idx === 5 ? 'Cmt' : 'Paz'}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-4">
                Ortalama: {analytics?.average_response_time}s
              </p>
            </div>
          </Card>

          {/* Engagement */}
          <Card>
            <div className="p-6">
              <h3 className="h4 mb-6">Kullanıcı Katılımı</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      Chat Katılımı
                    </p>
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {analytics?.user_engagement_rate}%
                    </p>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${analytics?.user_engagement_rate}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      Dönüş Oranı
                    </p>
                    <p className="text-sm font-bold text-green-600 dark:text-green-400">
                      58.2%
                    </p>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: '58.2%' }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      Tamamlanma Oranı
                    </p>
                    <p className="text-sm font-bold text-purple-600 dark:text-purple-400">
                      74.5%
                    </p>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: '74.5%' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Conversation Topics */}
          <Card className="lg:col-span-2">
            <div className="p-6">
              <h3 className="h4 mb-6">En Popüler Konular</h3>
              <div className="space-y-3">
                {analytics?.conversation_topics.map((topic, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      <span className="text-sm text-slate-900 dark:text-white">
                        {topic}
                      </span>
                    </div>
                    <Badge variant="primary">
                      {Math.floor(Math.random() * 100 + 50)} mention
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
