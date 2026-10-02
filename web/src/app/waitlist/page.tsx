'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Card, Input, Badge } from '@/components'
import axios from 'axios'

function WaitlistContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    name: '',
    consent_marketing: false,
    consent_terms: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const campaignSource = searchParams.get('source') || 'landing_page'
  const utmSource = searchParams.get('utm_source')
  const utmCampaign = searchParams.get('utm_campaign')

  useEffect(() => {
    // Check if email is already registered
    const email = searchParams.get('email')
    if (email) {
      setFormData((prev) => ({ ...prev, email }))
    }
  }, [searchParams])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = 'Valid email is required'
    }

    // Name validation
    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    // Phone validation (optional but if provided, must be valid)
    if (formData.phone) {
      const phoneRegex = /^\+?1?\d{9,15}$/
      if (!phoneRegex.test(formData.phone.replace(/[\s\-]/g, ''))) {
        newErrors.phone = 'Invalid phone number format'
      }
    }

    // Consent validation
    if (!formData.consent_terms) {
      newErrors.consent_terms = 'You must accept the terms'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const payload = {
        email: formData.email,
        phone: formData.phone || null,
        name: formData.name,
        source: campaignSource,
        campaign_source: utmSource || utmCampaign || null,
        consent_marketing: formData.consent_marketing,
        consent_terms: formData.consent_terms,
      }

      await axios.post('/api/v1/waitlist', payload)
      setSuccess(true)
      setSubmitted(true)
      setFormData({
        email: '',
        phone: '',
        name: '',
        consent_marketing: false,
        consent_terms: false,
      })

      // Show success message for 5 seconds then redirect to home
      setTimeout(() => {
        router.push('/')
      }, 5000)
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || 'Failed to join waitlist. Please try again.'

      if (error.response?.status === 409) {
        setErrors({
          email: 'Email already registered on waitlist',
        })
      } else {
        setErrors({
          submit: errorMessage,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  if (success && submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="h2 mb-2">Welcome to the Waitlist!</h2>
          <p className="body-sm text-slate-600 dark:text-slate-400 mb-4">
            Thank you for joining. We&apos;ll notify you when it&apos;s your turn to access Stech AI.
          </p>
          <Badge variant="success" className="mx-auto">
            Registration Complete
          </Badge>
          <p className="body-xs text-slate-500 dark:text-slate-500 mt-6">
            Redirecting to home page in 5 seconds...
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8">
        <div className="mb-8">
          <h1 className="h1 mb-2">Join the Waitlist</h1>
          <p className="body-sm text-slate-600 dark:text-slate-400">
            Be among the first to experience Stech AI - your AI assistant for Turkish speakers
          </p>
        </div>

        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{errors.submit}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              label="Email Address *"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              error={errors.email}
              disabled={loading}
            />
          </div>

          <div>
            <Input
              label="Full Name *"
              type="text"
              placeholder="Your name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              error={errors.name}
              disabled={loading}
            />
          </div>

          <div>
            <Input
              label="Phone Number (Optional)"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={formData.phone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, phone: e.target.value }))
              }
              error={errors.phone}
              disabled={loading}
            />
          </div>

          <div className="space-y-3 pt-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.consent_terms}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    consent_terms: e.target.checked,
                  }))
                }
                disabled={loading}
                className="mt-1"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                I accept the terms and conditions *
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.consent_marketing}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    consent_marketing: e.target.checked,
                  }))
                }
                disabled={loading}
                className="mt-1"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Send me updates about Stech AI
              </span>
            </label>
          </div>

          {errors.consent_terms && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {errors.consent_terms}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Joining...' : 'Join Waitlist'}
          </Button>

          <p className="text-xs text-slate-500 dark:text-slate-400 text-center pt-2">
            We respect your privacy. Your data will never be shared.
          </p>
        </form>
      </Card>
    </div>
  )
}

export default function WaitlistPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <WaitlistContent />
    </Suspense>
  )
}
