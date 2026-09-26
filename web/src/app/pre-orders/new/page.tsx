'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Button, Input, Card } from '@/components'

interface OrderItem {
  name: string
  quantity: number
  price: number
}

export default function NewPreOrderPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    businessName: '',
    deliveryDate: '',
    deliveryTime: '',
    items: [] as OrderItem[],
    currentItem: { name: '', quantity: 1, price: 0 },
    specialRequests: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleItemChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      currentItem: {
        ...prev.currentItem,
        [field]: field === 'quantity' || field === 'price' ? Number(value) : value,
      },
    }))
  }

  const addItem = () => {
    if (!formData.currentItem.name || formData.currentItem.quantity <= 0) {
      setError('Lütfen ürün adı ve miktarı giriniz')
      return
    }

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { ...prev.currentItem }],
      currentItem: { name: '', quantity: 1, price: 0 },
    }))
    setError('')
  }

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const getTotalPrice = () => {
    return formData.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.businessName || formData.items.length === 0 || !formData.deliveryDate) {
      setError('Lütfen tüm gerekli alanları doldurunuz')
      return
    }

    setIsLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(
        'http://localhost:8000/api/v1/pre_orders',
        {
          business_name: formData.businessName,
          delivery_date: `${formData.deliveryDate}T${formData.deliveryTime || '12:00'}`,
          items: formData.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unit_price: item.price,
          })),
          total_price: Math.round(getTotalPrice() * 100),
          special_requests: formData.specialRequests,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      router.push(`/pre-orders/${response.data.id}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ön sipariş oluşturulamadı')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.push('/pre-orders')}
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm mb-8"
        >
          ← Geri Dön
        </button>

        <h1 className="h2 mb-2">Yeni Ön Sipariş</h1>
        <p className="body-sm text-slate-600 dark:text-slate-400 mb-8">
          Özel tarihler için ön siparişinizi oluşturun
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Info */}
          <Card>
            <div className="p-6">
              <h3 className="h4 mb-6">Restoran Bilgisi</h3>
              <Input
                label="Restoran Adı"
                placeholder="Restaurant Name"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                required
              />
            </div>
          </Card>

          {/* Delivery Info */}
          <Card>
            <div className="p-6">
              <h3 className="h4 mb-6">Teslimat Bilgisi</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Teslimat Tarihi"
                  type="date"
                  name="deliveryDate"
                  value={formData.deliveryDate}
                  onChange={handleInputChange}
                  required
                />
                <Input
                  label="Teslimat Saati"
                  type="time"
                  name="deliveryTime"
                  value={formData.deliveryTime}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </Card>

          {/* Items */}
          <Card>
            <div className="p-6">
              <h3 className="h4 mb-6">Ürünler</h3>

              {/* Item Input */}
              <div className="space-y-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Ürün Adı
                  </label>
                  <input
                    type="text"
                    value={formData.currentItem.name}
                    onChange={e => handleItemChange('name', e.target.value)}
                    placeholder="Menü Paketesi, Kek, vb."
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Miktar
                    </label>
                    <input
                      type="number"
                      value={formData.currentItem.quantity}
                      onChange={e => handleItemChange('quantity', e.target.value)}
                      min="1"
                      className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Fiyat (TRY)
                    </label>
                    <input
                      type="number"
                      value={formData.currentItem.price}
                      onChange={e => handleItemChange('price', e.target.value)}
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={addItem}
                >
                  + Ürün Ekle
                </Button>
              </div>

              {/* Items List */}
              {formData.items.length > 0 && (
                <div className="space-y-3">
                  {formData.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-700 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-white">
                          {item.name}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {item.quantity}x {item.price.toFixed(2)} TRY = {(
                            item.quantity * item.price
                          ).toFixed(2)} TRY
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 ml-4"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {/* Total */}
                  <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center">
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">
                        Toplam
                      </p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {getTotalPrice().toFixed(2)} TRY
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Special Requests */}
          <Card>
            <div className="p-6">
              <h3 className="h4 mb-6">Özel İstekler</h3>
              <textarea
                name="specialRequests"
                value={formData.specialRequests}
                onChange={handleInputChange}
                placeholder="Hazırlanma talimatları, alerji uyarıları, vb."
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                rows={4}
              />
            </div>
          </Card>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3">
            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
              disabled={formData.items.length === 0}
            >
              Ön Sipariş Oluştur
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
