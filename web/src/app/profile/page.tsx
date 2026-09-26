'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Button, Input, Card } from '@/components'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  locale: string
  is_admin: boolean
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    locale: 'tr',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    loadUserProfile()
  }, [router])

  const loadUserProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:8000/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setUser(response.data)
      setFormData({
        firstName: response.data.first_name,
        lastName: response.data.last_name,
        locale: response.data.locale,
      })
    } catch (error) {
      console.error('Failed to load profile:', error)
      router.push('/login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const token = localStorage.getItem('token')
      await axios.put(
        'http://localhost:8000/api/v1/auth/me',
        {
          first_name: formData.firstName,
          last_name: formData.lastName,
          locale: formData.locale,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      setSuccessMessage('Profil başarıyla güncellendi')
      await loadUserProfile()
    } catch (error: any) {
      setErrorMessage(error.response?.data?.detail || 'Güncelleme başarısız oldu')
    } finally {
      setIsSaving(false)
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
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/chat')}
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm mb-4"
          >
            ← Sohbete Dön
          </button>
          <h1 className="h1 mb-2">Profil Ayarları</h1>
          <p className="body-sm text-slate-600 dark:text-slate-400">
            Hesap bilgilerinizi yönetin
          </p>
        </div>

        {/* Profile Card */}
        <Card className="mb-8">
          <div className="p-6">
            <h2 className="h3 mb-6">Kişisel Bilgiler</h2>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  E-posta
                </label>
                <div className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white">
                  {user?.email}
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Ad"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                />
                <Input
                  label="Soyad"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                />
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Dil
                </label>
                <select
                  name="locale"
                  value={formData.locale}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="tr">Türkçe</option>
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                </select>
              </div>

              {/* Messages */}
              {successMessage && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-sm text-green-700 dark:text-green-200">{successMessage}</p>
                </div>
              )}
              {errorMessage && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-700 dark:text-red-200">{errorMessage}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  isLoading={isSaving}
                  disabled={isSaving}
                >
                  Değişiklikleri Kaydet
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => loadUserProfile()}
                  disabled={isSaving}
                >
                  İptal
                </Button>
              </div>
            </form>
          </div>
        </Card>

        {/* Security Card */}
        <Card className="mb-8">
          <div className="p-6">
            <h2 className="h3 mb-6">Güvenlik</h2>
            <div className="space-y-4">
              <Button
                variant="outline"
                fullWidth
                className="justify-start"
              >
                🔒 Şifreni Değiştir
              </Button>
              {user?.is_admin && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-900 dark:text-blue-200">
                    <strong>Admin Hesabı:</strong> Bu hesap admin yetkilerine sahiptir.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200 dark:border-red-900">
          <div className="p-6">
            <h2 className="h3 mb-6 text-red-600 dark:text-red-400">Tehlikeli Bölge</h2>
            <Button
              variant="danger"
              fullWidth
              onClick={() => {
                if (confirm('Hesabınızı silmek istediğinizden emin misiniz?')) {
                  console.log('Delete account')
                }
              }}
            >
              Hesabı Sil
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
