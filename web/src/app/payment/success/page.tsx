'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Card } from '@/components'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const transactionId = searchParams.get('transaction_id')
  const amount = searchParams.get('amount')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate payment verification
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-8 text-center">
          {isLoading ? (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-6">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 dark:border-blue-800 dark:border-t-blue-400 rounded-full animate-spin"></div>
              </div>
              <h2 className="h3 mb-2">Ödeme İşleniyor</h2>
              <p className="body-sm text-slate-600 dark:text-slate-400">
                Lütfen bekleyin...
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-6">
                <span className="text-3xl">✅</span>
              </div>
              <h1 className="h2 mb-2">Ödeme Başarılı!</h1>
              <p className="body-sm text-slate-600 dark:text-slate-400 mb-6">
                Siparişiniz başarıyla oluşturulmuştur
              </p>

              {/* Receipt */}
              <Card variant="filled" className="mb-8 text-left">
                <div className="p-4 space-y-3">
                  {transactionId && (
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        İşlem ID:
                      </span>
                      <span className="text-sm font-mono text-slate-900 dark:text-white">
                        {transactionId}
                      </span>
                    </div>
                  )}

                  {amount && (
                    <div className="flex justify-between border-t border-slate-200 dark:border-slate-600 pt-3">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        Toplam Tutar:
                      </span>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        {(parseInt(amount) / 100).toFixed(2)} TRY
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between border-t border-slate-200 dark:border-slate-600 pt-3">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Tarih:
                    </span>
                    <span className="text-sm text-slate-900 dark:text-white">
                      {new Date().toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Next Steps */}
              <Card variant="outlined" className="mb-8 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
                <div className="p-4">
                  <p className="text-sm text-blue-900 dark:text-blue-200">
                    📧 Ödeme onay e-postası kısa süre içinde gönderilecektir.
                  </p>
                </div>
              </Card>

              <div className="space-y-3">
                <Button
                  fullWidth
                  size="lg"
                  onClick={() => router.push('/chat')}
                >
                  Sohbete Dön
                </Button>
                <Button
                  fullWidth
                  variant="outline"
                  size="lg"
                  onClick={() => router.push('/pre-orders')}
                >
                  Siparişleri Görüntüle
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
