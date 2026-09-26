'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button, Card, Badge } from '@/components'
import { useAdmin } from '@/hooks'

export default function AdminBusinessDetailPage() {
  const router = useRouter()
  const params = useParams()
  const businessId = parseInt(params.id as string, 10)

  const [suspendReason, setSuspendReason] = useState('')
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false)

  const {
    currentBusiness,
    loading,
    error,
    getBusiness,
    suspendBusiness,
    clearError,
  } = useAdmin()

  const loadBusinessData = useCallback(async () => {
    try {
      await getBusiness(businessId)
    } catch (error) {
      console.error('Failed to load business:', error)
    }
  }, [businessId, getBusiness])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    loadBusinessData()
  }, [router, loadBusinessData])

  const handleSuspendBusiness = async () => {
    try {
      await suspendBusiness(businessId, suspendReason || undefined)
      alert('İşletme başarıyla askıya alındı')
      setShowSuspendConfirm(false)
      setSuspendReason('')
    } catch (error) {
      console.error('Failed to suspend business:', error)
    }
  }

  const getStatusBadgeVariant = () => {
    switch (currentBusiness?.status) {
      case 'active':
        return 'success'
      case 'suspended':
        return 'error'
      case 'inactive':
        return 'warning'
      default:
        return 'warning'
    }
  }

  const getStatusLabel = () => {
    switch (currentBusiness?.status) {
      case 'active':
        return 'Aktif'
      case 'suspended':
        return 'Askıya Alındı'
      case 'inactive':
        return 'Pasif'
      default:
        return 'Bilinmiyor'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p>Yükleniyor...</p>
      </div>
    )
  }

  if (!currentBusiness) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center py-12">
            <p className="text-4xl mb-4">❌</p>
            <h3 className="h4 mb-2">İşletme Bulunamadı</h3>
            <p className="body-sm text-slate-600 dark:text-slate-400 mb-6">
              Istenen işletme bulunamadı
            </p>
            <Button onClick={() => router.push('/admin')}>
              Admin Paneline Dön
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="text-blue-600 dark:text-blue-400 hover:underline mb-4"
          >
            ← Admin Paneline Dön
          </button>
          <h1 className="h1 mb-2">İşletme Yönetimi</h1>
          <p className="body-sm text-slate-600 dark:text-slate-400">
            İşletme bilgilerini görüntüle ve yönet
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 p-6 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <div className="flex justify-between items-start">
              <p className="text-red-800 dark:text-red-200">{error}</p>
              <button
                onClick={clearError}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
              >
                ✕
              </button>
            </div>
          </Card>
        )}

        {/* Business Info Card */}
        <Card className="mb-6 p-6">
          <div className="mb-6">
            <h2 className="h3 mb-4">{currentBusiness.name}</h2>
            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                  İşletme Türü
                </p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {currentBusiness.type}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                  İşletme ID
                </p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {currentBusiness.id}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Sahip ID
                </p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {currentBusiness.owner_id}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Oluşturma Tarihi
                </p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {new Date(currentBusiness.created_at).toLocaleDateString('tr-TR')}
                </p>
              </div>
            </div>

            {/* Status and Commission */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Durum
                  </p>
                  <Badge variant={getStatusBadgeVariant() as any}>
                    {getStatusLabel()}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                    Komisyon Oranı
                  </p>
                  <p className="font-medium text-slate-900 dark:text-white text-lg">
                    %{(currentBusiness.commission_rate * 100).toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        {currentBusiness.status !== 'suspended' && (
          <Card className="p-6">
            <h3 className="h4 mb-6">İşletme İşlemleri</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  İşletmeyi askıya almak istiyorsanız, aşağıdaki alana bir neden yazın ve butona tıklayın.
                  Bu işlem kısmen geri alınabilir.
                </p>

                {showSuspendConfirm ? (
                  <>
                    <textarea
                      value={suspendReason}
                      onChange={(e) => setSuspendReason(e.target.value)}
                      placeholder="Askıya alma nedeni (opsiyonel)"
                      className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white mb-3"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="danger"
                        onClick={handleSuspendBusiness}
                        disabled={loading}
                      >
                        Evet, Askıya Al
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowSuspendConfirm(false)
                          setSuspendReason('')
                        }}
                        disabled={loading}
                      >
                        İptal
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => setShowSuspendConfirm(true)}
                  >
                    İşletmeyi Askıya Al
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}

        {currentBusiness.status === 'suspended' && (
          <Card className="p-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
            <p className="text-yellow-800 dark:text-yellow-200">
              ⚠️ Bu işletme şu anda askıya alınmış durumda. Yönetici tarafından etkinleştirilmesi gereklidir.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
