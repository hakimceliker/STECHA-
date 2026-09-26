'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Button, Input } from '@/components'
import { FormLayout } from '@/components/FormLayout'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await axios.post('http://localhost:8000/api/v1/auth/login', {
        email,
        password,
      })

      // Save token
      localStorage.setItem('token', response.data.access_token)
      localStorage.setItem('user', JSON.stringify(response.data.user))

      // Redirect based on user type
      if (response.data.user.is_admin) {
        router.push('/admin')
      } else {
        router.push('/chat')
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Giriş başarısız oldu')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormLayout title="Giriş Yap" subtitle="Hesabınıza erişin">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="E-posta"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error ? 'Giriş başarısız' : ''}
          required
        />

        <Input
          label="Şifre"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
          </div>
        )}

        <Button type="submit" fullWidth isLoading={isLoading} size="lg">
          {isLoading ? 'Kontrol ediliyor...' : 'Giriş Yap'}
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
        <p className="text-center text-body-sm text-slate-600 dark:text-slate-400 mb-4">
          Hesabınız yok mu?
        </p>
        <Button
          variant="outline"
          fullWidth
          onClick={() => router.push('/register')}
        >
          Kayıt Ol
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
