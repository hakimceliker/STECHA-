'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Input, Badge } from '@/components'
import axios from 'axios'

interface WaitlistEntry {
  id: number
  email: string
  phone?: string
  name: string
  source: string
  campaign_source?: string
  consent_marketing: boolean
  consent_terms: boolean
  status: string
  created_at: string
  updated_at: string
}

export default function AdminWaitlistPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [notes, setNotes] = useState('')

  const loadWaitlistEntries = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const params = new URLSearchParams()
      if (filterStatus !== 'all') {
        params.append('status', filterStatus)
      }

      const response = await axios.get('/api/v1/waitlist', {
        headers: { Authorization: `Bearer ${token}` },
        params: Object.fromEntries(params),
      })

      setEntries(response.data)
      setError('')
    } catch (err: any) {
      console.error('Failed to load waitlist:', err)
      const message =
        err.response?.data?.detail || 'Failed to load waitlist entries'
      setError(message)
      if (err.response?.status === 403) {
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }, [filterStatus, router])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    loadWaitlistEntries()
  }, [router, loadWaitlistEntries])

  const handleStatusChange = async (
    entry: WaitlistEntry,
    newStatus: string
  ) => {
    try {
      const token = localStorage.getItem('token')
      await axios.patch(
        `/api/v1/waitlist/${entry.id}`,
        {
          status: newStatus,
          notes: notes || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      setEntries((prev) =>
        prev.map((e) =>
          e.id === entry.id ? { ...e, status: newStatus } : e
        )
      )
      setSelectedEntry(null)
      setNotes('')
      setShowDetails(false)
    } catch (err: any) {
      console.error('Failed to update entry:', err)
      setError(err.response?.data?.detail || 'Failed to update entry')
    }
  }

  const filteredEntries = entries.filter((entry) => {
    if (filterStatus !== 'all' && entry.status !== filterStatus) {
      return false
    }
    if (
      searchTerm &&
      !entry.email.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !entry.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false
    }
    return true
  })

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'warning'
      case 'converted':
        return 'success'
      case 'inactive':
        return 'secondary'
      default:
        return 'primary'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'converted':
        return 'Converted'
      case 'inactive':
        return 'Inactive'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p>Loading waitlist entries...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="text-blue-600 dark:text-blue-400 hover:underline mb-4"
          >
            ← Admin Dashboard
          </button>
          <h1 className="h1 mb-2">Waitlist Management</h1>
          <p className="body-sm text-slate-600 dark:text-slate-400">
            Manage early access waitlist registrations and track conversions
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 p-6 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <div className="flex justify-between items-start">
              <p className="text-red-800 dark:text-red-200">{error}</p>
              <button
                onClick={() => setError('')}
                className="text-red-600 dark:text-red-400 hover:text-red-800"
              >
                ✕
              </button>
            </div>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Input
              label="Search by email or name"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="converted">Converted</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Total: {filteredEntries.length}
              </label>
              <Button onClick={loadWaitlistEntries} variant="outline" className="w-full">
                Refresh
              </Button>
            </div>
          </div>
        </Card>

        {/* Entries List */}
        <div className="space-y-4">
          {filteredEntries.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-4xl mb-4">📋</p>
              <h3 className="h4 mb-2">No Entries Found</h3>
              <p className="body-sm text-slate-600 dark:text-slate-400">
                No waitlist entries match your search criteria
              </p>
            </Card>
          ) : (
            filteredEntries.map((entry) => (
              <Card key={entry.id} className="p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex gap-2 items-start mb-3">
                      <div>
                        <h3 className="h4 text-slate-900 dark:text-white">
                          {entry.name}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {entry.email}
                        </p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(entry.status) as any}>
                        {getStatusLabel(entry.status)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-slate-200 dark:border-slate-700">
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                          Phone
                        </p>
                        <p className="font-medium text-slate-900 dark:text-white text-sm">
                          {entry.phone || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                          Source
                        </p>
                        <p className="font-medium text-slate-900 dark:text-white text-sm">
                          {entry.source}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                          Campaign
                        </p>
                        <p className="font-medium text-slate-900 dark:text-white text-sm">
                          {entry.campaign_source || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                          Joined
                        </p>
                        <p className="font-medium text-slate-900 dark:text-white text-sm">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                        Consents
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {entry.consent_terms && (
                          <Badge variant="success" className="text-xs">
                            ✓ Terms
                          </Badge>
                        )}
                        {entry.consent_marketing && (
                          <Badge variant="success" className="text-xs">
                            ✓ Marketing
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedEntry(entry)
                        setNotes('')
                        setShowDetails(true)
                      }}
                    >
                      Details
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && selectedEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full p-6">
            <h2 className="h3 mb-4">Update Entry Status</h2>

            <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {selectedEntry.name}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {selectedEntry.email}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Notes
              </label>
              <textarea
                placeholder="Add internal notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="mt-6 space-y-2">
              <Button
                className="w-full"
                variant={selectedEntry.status === 'converted' ? 'primary' : 'outline'}
                onClick={() => handleStatusChange(selectedEntry, 'converted')}
              >
                Mark as Converted
              </Button>

              <Button
                className="w-full"
                variant={selectedEntry.status === 'inactive' ? 'secondary' : 'outline'}
                onClick={() => handleStatusChange(selectedEntry, 'inactive')}
              >
                Mark as Inactive
              </Button>

              <Button
                className="w-full"
                variant={selectedEntry.status === 'active' ? 'primary' : 'outline'}
                onClick={() => handleStatusChange(selectedEntry, 'active')}
              >
                Mark as Active
              </Button>

              <Button
                className="w-full"
                variant="outline"
                onClick={() => {
                  setShowDetails(false)
                  setSelectedEntry(null)
                  setNotes('')
                }}
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
