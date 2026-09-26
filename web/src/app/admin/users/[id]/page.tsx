'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button, Card, Input, Badge } from '@/components'
import { useAdmin } from '@/hooks'

export default function AdminUserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const userId = parseInt(params.id as string, 10)

  const [formData, setFormData] = useState({
    name: '',
    locale: '',
  })
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false)
  const [showPromoteConfirm, setShowPromoteConfirm] = useState(false)

  const {
    currentUser,
    loading,
    error,
    getUser,
    updateUser,
    deactivateUser,
    promoteAdmin,
    clearError,
  } = useAdmin()

  const loadUserData = useCallback(async () => {
    try {
      await getUser(userId)
    } catch (error) {
      console.error('Failed to load user:', error)
    }
  }, [userId, getUser])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    loadUserData()
  }, [router, loadUserData])

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name,
        locale: currentUser.locale,
      })
    }
  }, [currentUser])

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateUser(userId, {
        name: formData.name,
        locale: formData.locale,
      })
      alert('Kullanıcı başarıyla güncellendi')
    } catch (error) {
      console.error('Failed to update user:', error)
    }
  }

  const handleDeactivateUser = async () => {
    try {
      await deactivateUser(userId)
      alert('Kullanıcı başarıyla deaktive edildi')
      router.push('/admin')
    } catch (error) {
      console.error('Failed to deactivate user:', error)
    }
  }

  const handlePromoteAdmin = async () => {
    try {
      await promoteAdmin(userId)
      alert('Kullanıcı admin olarak yükseltildi')
    } catch (error) {
      console.error('Failed to promote user:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p>Yükleniyor...</p>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center py-12">
            <p className="text-4xl mb-4">❌</p>
            <h3 className="h4 mb-2">Kullanıcı Bulunamadı</h3>
            <p className="body-sm text-slate-600 dark:text-slate-400 mb-6">
              Istenen kullanıcı bulunamadı
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
          <h1 className="h1 mb-2">Kullanıcı Yönetimi</h1>
          <p className="body-sm text-slate-600 dark:text-slate-400">
            Kullanıcı bilgilerini görüntüle ve düzenle
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

        {/* User Info Card */}
        <Card className="mb-6 p-6">
          <div className="mb-6">
            <h2 className="h3 mb-4">{currentUser.name}</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                  E-mail
                </p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {currentUser.email}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                  ID
                </p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {currentUser.id}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Durum
                </p>
                <div className="flex items-center gap-2">
                  {currentUser.is_admin ? (
                    <Badge variant="success">Admin</Badge>
                  ) : (
                    <Badge variant="warning">Kullanıcı</Badge>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Oluşturma Tarihi
                </p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {new Date(currentUser.created_at).toLocaleDateString('tr-TR')}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Edit Form */}
        <Card className="mb-6 p-6">
          <h3 className="h4 mb-6">Kullanıcı Bilgilerini Düzenle</h3>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <Input
              label="Ad Soyad"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
            <Input
              label="Dil"
              value={formData.locale}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, locale: e.target.value }))
              }
              placeholder="tr-TR, en-US, vb."
            />
            <Button type="submit" disabled={loading}>
              Kaydet
            </Button>
          </form>
        </Card>

        {/* Actions */}
        <Card className="p-6">
          <h3 className="h4 mb-6">Diğer İşlemler</h3>
          <div className="space-y-4">
            {!currentUser.is_admin && (
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  Bu kullanıcıyı admin yapmak istiyorsanız, aşağıdaki butona tıklayın.
                </p>
                {showPromoteConfirm ? (
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      onClick={handlePromoteAdmin}
                      disabled={loading}
                    >
                      Evet, Admin Yap
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowPromoteConfirm(false)}
                      disabled={loading}
                    >
                      İptal
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => setShowPromoteConfirm(true)}
                  >
                    Admin Olarak Yükselt
                  </Button>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                Kullanıcıyı deaktive etmek istiyorsanız, aşağıdaki butona tıklayın.
                Bu işlem geri alınamaz.
              </p>
              {showDeactivateConfirm ? (
                <div className="flex gap-2">
                  <Button
                    variant="danger"
                    onClick={handleDeactivateUser}
                    disabled={loading}
                  >
                    Evet, Deaktive Et
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeactivateConfirm(false)}
                    disabled={loading}
                  >
                    İptal
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowDeactivateConfirm(true)}
                >
                  Kullanıcıyı Deaktive Et
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
