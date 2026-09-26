'use client'

import React from 'react'
import { Button, Card, CardContent, CardHeader } from '@/components'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Navigation Bar */}
      <nav className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
        <div className="container-responsive flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-blue-600">🚀</div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Stech AI</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">AI-destekli Restoran Platformu</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
              Özellikler
            </a>
            <a href="#" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
              Hakkında
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container-responsive py-20 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="h1 mb-6 text-slate-900 dark:text-white">
            Restoranlar ve Müşteriler İçin AI Asistan
          </h2>
          <p className="body-lg mb-8 text-slate-600 dark:text-slate-300">
            Masa rezervasyonu, ön sipariş ve müşteri hizmeti işlemlerini AI ile otomatikleştirin.
            Türkçe konuşan kullanıcılar için optimize edilmiş.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 md:flex-row">
            <Button
              variant="primary"
              size="lg"
              onClick={() => window.location.href = '/chat'}
            >
              🚀 Hemen Başlayın
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => window.location.href = '/waitlist'}
            >
              📋 Bekleme Listesine Katılın
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container-responsive py-20">
        <h3 className="h2 mb-12 text-center text-slate-900 dark:text-white">
          Temel Özellikler
        </h3>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Feature 1 */}
          <Card variant="filled">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="text-3xl">💬</span>
                <h4 className="h4 text-slate-900 dark:text-white">AI Sohbet</h4>
              </div>
            </CardHeader>
            <CardContent>
              <p className="body-sm text-slate-600 dark:text-slate-300">
                Türkçe konuşan AI asistanınız ile 24/7 sohbet edin. Rezervasyon sorgusu,
                sipariş yardımı ve daha fazlası.
              </p>
            </CardContent>
          </Card>

          {/* Feature 2 */}
          <Card variant="filled">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="text-3xl">🍽️</span>
                <h4 className="h4 text-slate-900 dark:text-white">Masa Rezervasyonu</h4>
              </div>
            </CardHeader>
            <CardContent>
              <p className="body-sm text-slate-600 dark:text-slate-300">
                Milyonlarca restoranda online masa rezervasyonu yapın.
                Anında onay, akıllı öneriler ve kolay iptali.
              </p>
            </CardContent>
          </Card>

          {/* Feature 3 */}
          <Card variant="filled">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="text-3xl">📦</span>
                <h4 className="h4 text-slate-900 dark:text-white">Ön Sipariş</h4>
              </div>
            </CardHeader>
            <CardContent>
              <p className="body-sm text-slate-600 dark:text-slate-300">
                Favori restoranlardan önceden sipariş verin.
                İşletmeciler için akıllı envanter yönetimi.
              </p>
            </CardContent>
          </Card>

          {/* Feature 4 */}
          <Card variant="filled">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="text-3xl">🔐</span>
                <h4 className="h4 text-slate-900 dark:text-white">Güvenli Ödeme</h4>
              </div>
            </CardHeader>
            <CardContent>
              <p className="body-sm text-slate-600 dark:text-slate-300">
                Güvenli ödeme sistemleri ile işlem yapın.
                Tüm verileriniz şifreli ve korunmuş.
              </p>
            </CardContent>
          </Card>

          {/* Feature 5 */}
          <Card variant="filled">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="text-3xl">📊</span>
                <h4 className="h4 text-slate-900 dark:text-white">İşletmeci Paneli</h4>
              </div>
            </CardHeader>
            <CardContent>
              <p className="body-sm text-slate-600 dark:text-slate-300">
                Kapsamlı analytics ve yönetim araçları.
                Rezervasyonları ve siparişleri merkezi yerden yönetin.
              </p>
            </CardContent>
          </Card>

          {/* Feature 6 */}
          <Card variant="filled">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="text-3xl">🌍</span>
                <h4 className="h4 text-slate-900 dark:text-white">Tüm Cihazlarda</h4>
              </div>
            </CardHeader>
            <CardContent>
              <p className="body-sm text-slate-600 dark:text-slate-300">
                Web, iOS ve Android'de tam deneyim.
                Senkronize verilerinizi her yerden erişin.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container-responsive py-16">
        <Card variant="elevated" className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
          <CardContent>
            <div className="text-center">
              <h3 className="h3 mb-4">Restoranınız için Hazır mısınız?</h3>
              <p className="body-base mb-6 text-blue-100">
                Bugün başlayın ve müşteri deneyiminizi dönüştürün
              </p>
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-blue-700"
                onClick={() => window.location.href = '/dashboard'}
              >
                Restoran Paneline Giriş
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 dark:border-slate-700 dark:bg-slate-950">
        <div className="container-responsive text-center">
          <p className="body-sm text-slate-600 dark:text-slate-400">
            © 2026 Stech AI. Tüm hakları saklıdır.
          </p>
          <p className="body-sm mt-2 text-slate-500 dark:text-slate-500">
            Türkçe AI Asistan Platformu
          </p>
        </div>
      </footer>
    </main>
  )
}
