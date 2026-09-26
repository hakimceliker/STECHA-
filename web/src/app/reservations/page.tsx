'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Card, Badge } from '@/components'
import { useReservations } from '@/hooks'
import type { Reservation } from '@/types'

export default function ReservationsPage() {
  const router = useRouter()
  const { reservations, loading, error, listReservations } = useReservations()
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    listReservations()
  }, [router, listReservations])

  useEffect(() => {
    filterReservations()
  }, [reservations, searchTerm, filterStatus])

  const filterReservations = () => {
    let filtered = reservations

    if (searchTerm) {
      filtered = filtered.filter(r =>
        String(r.business_id).toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus)
    }

    setFilteredReservations(filtered)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success'
      case 'cancelled':
        return 'error'
      case 'pending':
        return 'warning'
      default:
        return 'primary'
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Beklemede',
      confirmed: 'Onaylandı',
      cancelled: 'İptal Edildi',
    }
    return labels[status] || status
  }

  const getApprovalStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Onay Beklemede',
      approved: 'Onaylandı',
      rejected: 'Reddedildi',
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p>Yükleniyor...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Card className="p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => listReservations()}>Yeniden Dene</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <button
              onClick={() => router.push('/chat')}
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm mb-4"
            >
              ← Sohbete Dön
            </button>
            <h1 className="h1 mb-2">Rezervasyonlarım</h1>
            <p className="body-sm text-slate-600 dark:text-slate-400">
              Tüm rezervasyonlarınızı yönetin
            </p>
          </div>
          <Button onClick={() => router.push('/reservations/new')} size="lg">
            + Yeni Rezervasyon
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="İş Yeri ID"
                placeholder="Ara..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Durum
                </label>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="all">Tümü</option>
                  <option value="pending">Beklemede</option>
                  <option value="approved">Onaylandı</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="rejected">Reddedildi</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Reservations List */}
        <div className="space-y-4">
          {filteredReservations.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-4xl mb-4">🍽️</p>
              <h3 className="h4 mb-2">Henüz Rezervasyon Yok</h3>
              <p className="body-sm text-slate-600 dark:text-slate-400 mb-6">
                İlk rezervasyonunuzu yaparak başlayın
              </p>
              <Button onClick={() => router.push('/reservations/new')}>
                Yeni Rezervasyon Oluştur
              </Button>
            </Card>
          ) : (
            filteredReservations.map(reservation => (
              <Card
                key={reservation.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/reservations/${reservation.id}`)}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="h4 text-slate-900 dark:text-white mb-2">
                        İş Yeri #{reservation.business_id}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        👥 {reservation.guest_count} Kişi
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getStatusBadgeVariant(reservation.status)}>
                        {getStatusLabel(reservation.status)}
                      </Badge>
                      <Badge variant={reservation.approval_status === 'approved' ? 'success' : 'warning'}>
                        {getApprovalStatusLabel(reservation.approval_status)}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Tarih & Saat</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {new Date(reservation.reservation_date).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {reservation.special_requests && (
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                          Özel İstekler
                        </p>
                        <p className="font-medium text-slate-900 dark:text-white truncate">
                          {reservation.special_requests}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
