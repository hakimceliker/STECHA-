'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Button, Input, Card } from '@/components'

export default function NewReservationPage() {
  const router = useRouter()
  const [step, setStep] = useState<'search' | 'details' | 'confirm'>('search')
  const [formData, setFormData] = useState({
    location: '',
    date: '',
    time: '',
    guests: '2',
    specialRequests: '',
  })
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(
        'http://localhost:8000/api/v1/places',
        {
          location: formData.location,
          date: formData.date,
          guest_count: parseInt(formData.guests),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      setSearchResults(response.data.places || [])
      if (response.data.places.length > 0) {
        setStep('details')
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Arama başarısız oldu')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectBusiness = (business: any) => {
    setSelectedBusiness(business)
    setStep('confirm')
  }

  const handleConfirmReservation = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(
        'http://localhost:8000/api/v1/reservations',
        {
          business_id: selectedBusiness.id,
          reservation_date: `${formData.date}T${formData.time}`,
          guest_count: parseInt(formData.guests),
          special_requests: formData.specialRequests,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      router.push(`/reservations/${response.data.id}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Rezervasyon oluşturulamadı')
    } finally {
      setIsLoading(false)
    }
  }

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

        {/* Step Indicator */}
        <div className="mb-8 flex justify-between items-center">
          {(['search', 'details', 'confirm'] as const).map((s, idx) => (
            <React.Fragment key={s}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  step === s || ['search', 'details', 'confirm'].indexOf(step) > idx
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {idx + 1}
              </div>
              {idx < 2 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    ['search', 'details', 'confirm'].indexOf(step) > idx
                      ? 'bg-blue-600'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                ></div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Search */}
        {step === 'search' && (
          <Card>
            <div className="p-8">
              <h1 className="h2 mb-2">Restoran Ara</h1>
              <p className="body-sm text-slate-600 dark:text-slate-400 mb-8">
                Tarih, saat ve misafir sayısına göre uygun restoran bulun
              </p>

              <form onSubmit={handleSearch} className="space-y-6">
                <Input
                  label="Konum"
                  placeholder="Şehir veya bölge"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Tarih"
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                  <Input
                    label="Saat"
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Misafir Sayısı
                  </label>
                  <select
                    name="guests"
                    value={formData.guests}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, guests: e.target.value }))
                    }
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map(num => (
                      <option key={num} value={num}>
                        {num} Kişi
                      </option>
                    ))}
                  </select>
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
                  </div>
                )}

                <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
                  Restoran Ara
                </Button>
              </form>
            </div>
          </Card>
        )}

        {/* Step 2: Select Restaurant */}
        {step === 'details' && searchResults.length > 0 && (
          <div className="space-y-4">
            <h1 className="h2 mb-2">Restoran Seç</h1>
            <p className="body-sm text-slate-600 dark:text-slate-400 mb-6">
              {searchResults.length} restoran bulundu
            </p>

            {searchResults.map(business => (
              <Card
                key={business.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleSelectBusiness(business)}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="h4 text-slate-900 dark:text-white">
                        {business.name}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                        📍 {business.location || 'Konum bilgisi'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600 dark:text-slate-400">Kapasite</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {business.capacity}
                      </p>
                    </div>
                  </div>
                  {business.phone && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      📞 {business.phone}
                    </p>
                  )}
                  <Button fullWidth size="sm" variant="outline">
                    Seç →
                  </Button>
                </div>
              </Card>
            ))}

            <Button
              fullWidth
              variant="outline"
              onClick={() => setStep('search')}
              size="lg"
            >
              ← Geri Dön
            </Button>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && selectedBusiness && (
          <Card>
            <div className="p-8">
              <h1 className="h2 mb-2">Rezervasyon Detayları</h1>
              <p className="body-sm text-slate-600 dark:text-slate-400 mb-8">
                Bilgilerinizi doğrulayın ve rezervasyon yapın
              </p>

              <div className="space-y-6 mb-8">
                {/* Summary Cards */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-900 dark:text-blue-200 font-medium mb-1">
                    {selectedBusiness.name}
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    {new Date(`${formData.date}T${formData.time}`).toLocaleDateString(
                      'tr-TR',
                      {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }
                    )} - {formData.time}
                  </p>
                </div>

                <form onSubmit={handleConfirmReservation} className="space-y-6">
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Misafir Sayısı: {formData.guests}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Özel İstekler
                    </label>
                    <textarea
                      name="specialRequests"
                      value={formData.specialRequests}
                      onChange={handleInputChange}
                      placeholder="Doğum günü, alerji, vb..."
                      className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      rows={4}
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                      <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      fullWidth
                      size="lg"
                      isLoading={isLoading}
                    >
                      Rezervasyon Yap
                    </Button>
                  </div>
                </form>
              </div>

              <Button
                fullWidth
                variant="outline"
                onClick={() => setStep('details')}
                size="lg"
              >
                ← Geri Dön
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
