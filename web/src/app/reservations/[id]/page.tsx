'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import axios from 'axios'
import { Button, Card, Badge } from '@/components'

interface ReservationDetail {
  id: string
  business_name: string
  reservation_date: string
  guest_count: number
  status: string
  special_requests: string
  created_at: string
  business_phone?: string
  business_address?: string
}

export default function ReservationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const reservationId = params.id as string

  const [reservation, setReservation] = useState<ReservationDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    loadReservation()
  }, [reservationId, router])

  const loadReservation = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        `http://localhost:8000/api/v1/reservations/${reservationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      setReservation(response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Rezervasyon yüklenemedi')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Bu rezervasyonu iptal etmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      await axios.delete(
        `http://localhost:8000/api/v1/reservations/${reservationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      router.push('/reservations')
    } catch (err) {
      setError('İptal işlemi başarısız oldu')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p>Yükleniyor...</p>
      </div>
    )
  }

  if (error || !reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Card className="text-center p-8">
          <p className="text-4xl mb-4">❌</p>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
          <Button onClick={() => router.push('/reservations')}>
            Geri Dön
          </Button>
        </Card>
      </div>
    )
  }

  const statusConfig: Record<string, { variant: any; label: string; emoji: string }> = {
    pending: { variant: 'warning', label: 'Beklemede', emoji: '⏳' },
    approved: { variant: 'success', label: 'Onaylandı', emoji: '✅' },
    rejected: { variant: 'error', label: 'Reddedildi', emoji: '❌' },
    completed: { variant: 'primary', label: 'Tamamlandı', emoji: '🎉' },
  }

  const statusInfo = statusConfig[reservation.status] || statusConfig.pending

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.push('/reservations')}
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm mb-8"
        >
          ← Geri Dön
        </button>

        {/* Main Card */}
        <Card className="mb-6">
          <div className="p-8">
            {/* Status Banner */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="h2 mb-2">{reservation.business_name}</h1>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{statusInfo.emoji}</span>
                  <Badge variant={statusInfo.variant}>
                    {statusInfo.label}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Reservation Details */}
            <div className="space-y-6">
              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Tarih
                  </p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {new Date(reservation.reservation_date).toLocaleDateString(
                      'tr-TR',
                      {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Saat
                  </p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {new Date(reservation.reservation_date).toLocaleTimeString(
                      'tr-TR',
                      { hour: '2-digit', minute: '2-digit' }
                    )}
                  </p>
                </div>
              </div>

              {/* Guest Count */}
              <div className="pb-6 border-b border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  Misafir Sayısı
                </p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  👥 {reservation.guest_count} Kişi
                </p>
              </div>

              {/* Restaurant Info */}
              {reservation.business_address && (
                <div className="pb-6 border-b border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Adres
                  </p>
                  <p className="text-slate-900 dark:text-white">
                    {reservation.business_address}
                  </p>
                </div>
              )}

              {reservation.business_phone && (
                <div className="pb-6 border-b border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Telefon
                  </p>
                  <a
                    href={`tel:${reservation.business_phone}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {reservation.business_phone}
                  </a>
                </div>
              )}

              {/* Special Requests */}
              {reservation.special_requests && (
                <div className="pb-6 border-b border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Özel İstekler
                  </p>
                  <p className="text-slate-900 dark:text-white">
                    {reservation.special_requests}
                  </p>
                </div>
              )}

              {/* Booking Time */}
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  Rezervasyon Tarihi
                </p>
                <p className="text-slate-900 dark:text-white">
                  {new Date(reservation.created_at).toLocaleDateString(
                    'tr-TR',
                    {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }
                  )}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        {reservation.status === 'pending' && (
          <Card className="border-red-200 dark:border-red-900">
            <div className="p-6">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Rezervasyonunuz henüz onay bekliyorsa iptal edebilirsiniz.
              </p>
              <Button
                fullWidth
                variant="danger"
                onClick={handleCancel}
              >
                Rezervasyonu İptal Et
              </Button>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <Button
            fullWidth
            variant="outline"
            onClick={() => router.push('/chat')}
          >
            Sohbete Dön
          </Button>
          <Button
            fullWidth
            variant="outline"
            onClick={() => router.push('/reservations')}
          >
            Tüm Rezervasyonlar
          </Button>
        </div>
      </div>
    </div>
  )
}
