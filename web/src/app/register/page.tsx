'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Button, Input } from '@/components'
import { FormLayout } from '@/components/FormLayout'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Tüm alanlar gerekli')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor')
      return
    }

    if (formData.password.length < 8) {
      setError('Şifre en az 8 karakter olmalı')
      return
    }

    setIsLoading(true)

    try {
      await axios.post('http://localhost:8000/api/v1/auth/register', {
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
      })

      // Redirect to login after successful registration
      router.push('/login')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Kayıt başarısız oldu')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <FormLayout title="Kayıt Ol" subtitle="Hesabınızı oluşturun">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Ad"
            placeholder="John"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
          />
          <Input
            label="Soyad"
            placeholder="Doe"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
          />
        </div>

        <Input
          label="E-posta"
          type="email"
          placeholder="you@example.com"
          name="email"
          value={formData.email}
          onChange={handleChange}
          error={error && error.includes('E-posta') ? error : ''}
          required
        />

        <Input
          label="Şifre"
          type="password"
          placeholder="••••••••"
          name="password"
          value={formData.password}
          onChange={handleChange}
          helperText="En az 8 karakter"
          required
        />

        <Input
          label="Şifre (Tekrar)"
          type="password"
          placeholder="••••••••"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
          </div>
        )}

        <Button type="submit" fullWidth isLoading={isLoading} size="lg">
          {isLoading ? 'Kaydediliyor...' : 'Kayıt Ol'}
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
        <p className="text-center text-body-sm text-slate-600 dark:text-slate-400 mb-4">
          Zaten hesabınız var mı?
        </p>
        <Button
          variant="outline"
          fullWidth
          onClick={() => router.push('/login')}
        >
          Giriş Yap
        </Button>
      </div>

      <div className="mt-6 text-center">
        <a href="/" className="text-body-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">
          ← Ana sayfaya dön
        </a>
      </div>
    </FormLayout>
  )
}
