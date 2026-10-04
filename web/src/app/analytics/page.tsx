'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card } from '@/components'
import axios from 'axios'

interface DashboardData {
  total_conversations: number
  total_messages: number
  total_tokens_used: number
  total_cost_usd: number
  total_api_calls: number
  average_response_time_ms: number | null
  last_active_at: string | null
  recent_activity: any[]
  daily_usage: any[]
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

        const response = await axios.get('/api/v1/analytics/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        })

        setDashboard(response.data)
      } catch (err: any) {
        if (err.response?.status === 401) {
          router.push('/login')
        } else {
          setError('Failed to load analytics')
        }
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-slate-400 text-center">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.push('/profile')}
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm mb-6"
        >
          ← Back to Profile
        </button>

        <h1 className="text-3xl font-bold text-white mb-8">Analytics Dashboard</h1>

        {error && (
          <Card className="p-4 mb-6 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </Card>
        )}

        {dashboard && (
          <div className="space-y-6">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-6">
                <p className="text-slate-400 text-sm mb-2">Conversations</p>
                <p className="text-3xl font-bold text-white">{dashboard.total_conversations}</p>
              </Card>

              <Card className="p-6">
                <p className="text-slate-400 text-sm mb-2">Messages</p>
                <p className="text-3xl font-bold text-white">{dashboard.total_messages}</p>
              </Card>

              <Card className="p-6">
                <p className="text-slate-400 text-sm mb-2">Tokens Used</p>
                <p className="text-3xl font-bold text-white">{dashboard.total_tokens_used.toLocaleString()}</p>
              </Card>

              <Card className="p-6">
                <p className="text-slate-400 text-sm mb-2">Cost USD</p>
                <p className="text-3xl font-bold text-green-400">${dashboard.total_cost_usd.toFixed(2)}</p>
              </Card>
            </div>

            {/* Detailed Metrics */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Usage Overview</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between border-b border-slate-700 pb-4">
                  <span className="text-slate-400">API Calls</span>
                  <span className="text-white font-semibold">{dashboard.total_api_calls}</span>
                </div>

                <div className="flex justify-between border-b border-slate-700 pb-4">
                  <span className="text-slate-400">Average Response Time</span>
                  <span className="text-white font-semibold">
                    {dashboard.average_response_time_ms ? `${dashboard.average_response_time_ms}ms` : 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between pb-4">
                  <span className="text-slate-400">Last Active</span>
                  <span className="text-white font-semibold">
                    {dashboard.last_active_at
                      ? new Date(dashboard.last_active_at).toLocaleDateString()
                      : 'Never'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Daily Usage */}
            {dashboard.daily_usage.length > 0 && (
              <Card className="p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Daily Usage (Last 7 Days)</h2>
                
                <div className="space-y-3">
                  {dashboard.daily_usage.map((day: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-4 border-b border-slate-700 pb-3 last:border-0">
                      <span className="text-slate-400 text-sm min-w-20">{day.date}</span>
                      <div className="flex-1 bg-slate-700 h-8 rounded flex items-center px-3">
                        <span className="text-xs text-slate-300">
                          {day.api_calls} calls • {day.tokens_in + day.tokens_out} tokens • ${day.cost_usd.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Recent Activity */}
            {dashboard.recent_activity.length > 0 && (
              <Card className="p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {dashboard.recent_activity.map((activity: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between border-b border-slate-700 pb-3 last:border-0">
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{activity.event_type}</p>
                        <p className="text-slate-400 text-xs">
                          {activity.provider} • {new Date(activity.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-sm">{activity.tokens} tokens</p>
                        <p className={`text-xs ${activity.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                          {activity.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Button
              onClick={() => router.push('/profile')}
              variant="outline"
              className="w-full"
            >
              Back to Profile
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
