'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card } from '@/components'
import axios from 'axios'

interface Plan {
  id: number
  name: string
  description: string
  amount_cents: number
  currency: string
  billing_interval: string
  features: Record<string, number>
  is_active: boolean
  created_at: string
}

export default function PlansPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const response = await axios.get('/api/v1/payments/plans')
        setPlans(response.data)
      } catch (err) {
        console.error('Failed to load plans:', err)
      } finally {
        setLoading(false)
      }
    }

    loadPlans()
  }, [])

  const handleSelectPlan = async (planId: number) => {
    setSelectedPlan(planId)
    setCheckoutLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(
        '/api/v1/payments/checkout-session',
        {
          plan_id: planId,
          success_url: `${window.location.origin}/payment/success`,
          cancel_url: `${window.location.origin}/payment/failed`,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      // Redirect to Stripe checkout
      window.location.href = response.data.checkout_url
    } catch (err) {
      console.error('Failed to create checkout session:', err)
      setCheckoutLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <p className="text-slate-400">Loading plans...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Choose Your Plan</h1>
          <p className="text-slate-400 text-lg">
            Select the perfect plan for your needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className="p-8 relative overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">{plan.name}</h2>
                <p className="text-slate-400 text-sm">{plan.description}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white">
                    ${(plan.amount_cents / 100).toFixed(2)}
                  </span>
                  <span className="text-slate-400">
                    /{plan.billing_interval === 'month' ? 'month' : 'year'}
                  </span>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-sm font-semibold text-slate-300 mb-4">Features:</h3>
                <ul className="space-y-3">
                  {Object.entries(plan.features).map(([feature, limit]) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-slate-400 text-sm"
                    >
                      <span className="text-blue-400">✓</span>
                      {feature}: {limit}
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={checkoutLoading && selectedPlan === plan.id}
                className="w-full"
              >
                {checkoutLoading && selectedPlan === plan.id ? '...' : 'Select Plan'}
              </Button>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={() => router.push('/profile')}
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            ← Back to Profile
          </button>
        </div>
      </div>
    </div>
  )
}
