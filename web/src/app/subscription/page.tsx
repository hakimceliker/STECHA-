'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card } from '@/components'
import axios from 'axios'

interface Subscription {
  id: number
  plan_id: number
  status: string
  current_period_start: string
  current_period_end: string
  cancel_at: string | null
  canceled_at: string | null
  created_at: string
}

export default function SubscriptionPage() {
  const router = useRouter()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [canceling, setCanceling] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadSubscription = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

        const response = await axios.get('/api/v1/payments/subscription', {
          headers: { Authorization: `Bearer ${token}` },
        })

        setSubscription(response.data)
      } catch (err: any) {
        if (err.response?.status === 401) {
          router.push('/login')
        } else {
          setError('Failed to load subscription')
        }
      } finally {
        setLoading(false)
      }
    }

    loadSubscription()
  }, [router])

  const handleCancelSubscription = async () => {
    if (!subscription) return

    if (
      !confirm(
        "Are you sure you want to cancel your subscription? You will lose access to premium features."
      )
    ) {
      return
    }

    setCanceling(true)
    try {
      const token = localStorage.getItem('token')
      await axios.post(
        `/api/v1/payments/subscription/${subscription.id}/cancel`,
        { at_period_end: true },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      setError('Subscription cancellation scheduled. Access will end at the end of the billing period.')
      // Reload subscription data
      const response = await axios.get('/api/v1/payments/subscription', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setSubscription(response.data)
    } catch (err) {
      setError('Failed to cancel subscription')
    } finally {
      setCanceling(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-slate-400 text-center">Loading subscription...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push('/profile')}
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm mb-6"
        >
          ← Back to Profile
        </button>

        <h1 className="text-3xl font-bold text-white mb-8">Subscription Management</h1>

        {error && (
          <Card className="p-4 mb-6 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </Card>
        )}

        {!subscription ? (
          <Card className="p-8 text-center">
            <p className="text-slate-400 mb-6">You don&apos;t have an active subscription</p>
            <Button onClick={() => router.push('/payment/plans')}>Browse Plans</Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Subscription Status */}
            <Card className="p-8">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white">Active Subscription</h2>
                  <span
                    className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                      subscription.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200'
                    }`}
                  >
                    {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
                  <span className="text-slate-400">Subscription ID</span>
                  <span className="text-white font-mono text-sm">{subscription.id}</span>
                </div>

                <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
                  <span className="text-slate-400">Current Period</span>
                  <span className="text-white">
                    {new Date(subscription.current_period_start).toLocaleDateString()} -{' '}
                    {new Date(subscription.current_period_end).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
                  <span className="text-slate-400">Subscribed Since</span>
                  <span className="text-white">
                    {new Date(subscription.created_at).toLocaleDateString()}
                  </span>
                </div>

                {subscription.cancel_at && (
                  <div className="flex justify-between pb-4 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                    <span className="text-red-800 dark:text-red-200">Will Cancel</span>
                    <span className="text-red-800 dark:text-red-200 font-semibold">
                      {new Date(subscription.cancel_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {!subscription.cancel_at && (
                <Button
                  onClick={handleCancelSubscription}
                  disabled={canceling}
                  variant="outline"
                  className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  {canceling ? 'Canceling...' : 'Cancel Subscription'}
                </Button>
              )}

              {subscription.cancel_at && (
                <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ Your subscription is scheduled to cancel. You&apos;ll retain access until the end of
                    your billing period.
                  </p>
                </Card>
              )}
            </Card>

            {/* Usage Info */}
            <Card className="p-8">
              <h3 className="text-xl font-bold text-white mb-4">Subscription Benefits</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-slate-300">
                  <span className="text-blue-400">✓</span>
                  Unlimited AI conversations
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <span className="text-blue-400">✓</span>
                  Priority support
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <span className="text-blue-400">✓</span>
                  Advanced analytics
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <span className="text-blue-400">✓</span>
                  Custom documents storage
                </li>
              </ul>
            </Card>

            {/* Change Plan */}
            <Button
              onClick={() => router.push('/payment/plans')}
              className="w-full"
              variant="outline"
            >
              Change Plan
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
