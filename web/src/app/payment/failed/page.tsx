'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Card } from '@/components'

export default function PaymentFailedPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorMessage = searchParams.get('message') || 'Ödeme işlemi başarısız oldu'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mb-6">
            <span className="text-3xl">❌</span>
          </div>

          <h1 className="h2 mb-2">Ödeme Başarısız</h1>
          <p className="body-sm text-slate-600 dark:text-slate-400 mb-6">
            {errorMessage}
          </p>

          {/* Error Card */}
          <Card variant="filled" className="mb-8 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
            <div className="p-4">
              <p className="text-sm text-red-900 dark:text-red-200">
                <strong>Sebep:</strong> {errorMessage}
              </p>
            </div>
          </Card>

          {/* Troubleshooting */}
          <Card variant="outlined" className="mb-8">
            <div className="p-4 text-left">
              <h3 className="h5 mb-3 text-slate-900 dark:text-white">
                Deneyebileceğiniz şeyler:
              </h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>✓ Kart bilgilerinizi kontrol edin</li>
                <li>✓ Başka bir ödeme yöntemi deneyin</li>
                <li>✓ Bankanızla iletişime geçin</li>
                <li>✓ Daha sonra tekrar deneyin</li>
              </ul>
            </div>
          </Card>

          <div className="space-y-3">
            <Button
              fullWidth
              size="lg"
              onClick={() => router.back()}
            >
              Geri Dön
            </Button>
            <Button
              fullWidth
              variant="outline"
              size="lg"
              onClick={() => router.push('/chat')}
            >
              Sohbete Dön
            </Button>
            <Button
              fullWidth
              variant="outline"
              size="lg"
              onClick={() => router.push('/profile')}
            >
              Destek İletişim
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
