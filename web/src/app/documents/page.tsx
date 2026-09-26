'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Input, Badge } from '@/components'
import axios from 'axios'

interface Document {
  id: number
  filename: string
  size: number
  document_type: string
  created_at: string
  updated_at: string
}

export default function DocumentsPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const params = new URLSearchParams()
      if (filterType !== 'all') {
        params.append('document_type', filterType)
      }

      const response = await axios.get('/api/v1/documents/', {
        headers: { Authorization: `Bearer ${token}` },
        params: Object.fromEntries(params),
      })

      setDocuments(response.data)
      setError('')
    } catch (err: any) {
      console.error('Failed to load documents:', err)
      const message =
        err.response?.data?.detail || 'Failed to load documents'
      setError(message)
      if (err.response?.status === 403) {
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }, [filterType, router])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    loadDocuments()
  }, [router, loadDocuments])

  const handleDelete = async (docId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return
    }

    try {
      setDeleting(true)
      const token = localStorage.getItem('token')
      await axios.delete(`/api/v1/documents/${docId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setDocuments((prev) => prev.filter((d) => d.id !== docId))
      setSelectedDoc(null)
      setShowDetails(false)
    } catch (err: any) {
      console.error('Failed to delete document:', err)
      setError(err.response?.data?.detail || 'Failed to delete document')
    } finally {
      setDeleting(false)
    }
  }

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term)
  }, [])

  const filteredDocuments = documents.filter((doc) => {
    if (searchTerm && !doc.filename.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    return true
  })

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'invoice':
        return 'primary'
      case 'receipt':
        return 'success'
      case 'contract':
        return 'warning'
      default:
        return 'secondary'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'invoice':
        return 'Invoice'
      case 'receipt':
        return 'Receipt'
      case 'contract':
        return 'Contract'
      default:
        return 'Other'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p>Loading documents...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/documents/upload')}
            className="text-blue-600 dark:text-blue-400 hover:underline mb-4"
          >
            ← Back to Upload
          </button>
          <h1 className="h1 mb-2">My Documents</h1>
          <p className="body-sm text-slate-600 dark:text-slate-400">
            Manage your uploaded documents and files
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

        {/* Filters and Controls */}
        <Card className="mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Input
              label="Search by filename"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Document Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="all">All Types</option>
                <option value="invoice">Invoice</option>
                <option value="receipt">Receipt</option>
                <option value="contract">Contract</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Total: {filteredDocuments.length}
              </label>
              <Button onClick={loadDocuments} variant="outline" className="w-full">
                Refresh
              </Button>
            </div>
          </div>
        </Card>

        {/* Documents List */}
        <div className="space-y-4">
          {filteredDocuments.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-4xl mb-4">📋</p>
              <h3 className="h4 mb-2">No Documents Found</h3>
              <p className="body-sm text-slate-600 dark:text-slate-400 mb-4">
                Start by uploading your first document
              </p>
              <Button onClick={() => router.push('/documents/upload')}>
                Upload Document
              </Button>
            </Card>
          ) : (
            filteredDocuments.map((doc) => (
              <Card key={doc.id} className="p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex gap-2 items-start mb-3">
                      <div className="text-2xl">📄</div>
                      <div className="flex-1">
                        <h3 className="h4 text-slate-900 dark:text-white">
                          {doc.filename}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {(doc.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Badge variant={getTypeBadgeVariant(doc.document_type) as any}>
                        {getTypeLabel(doc.document_type)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-2 gap-4 py-4 border-y border-slate-200 dark:border-slate-700">
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                          Uploaded
                        </p>
                        <p className="font-medium text-slate-900 dark:text-white text-sm">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                          Updated
                        </p>
                        <p className="font-medium text-slate-900 dark:text-white text-sm">
                          {new Date(doc.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedDoc(doc)
                        setShowDetails(true)
                      }}
                    >
                      View
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && selectedDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full p-6">
            <h2 className="h3 mb-4">Document Details</h2>

            <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {selectedDoc.filename}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {(selectedDoc.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Type: {getTypeLabel(selectedDoc.document_type)}
              </p>
            </div>

            <div className="mt-6 space-y-2">
              <Button
                className="w-full"
                variant="outline"
                onClick={() => {
                  setShowDetails(false)
                  setSelectedDoc(null)
                }}
              >
                Close
              </Button>

              <Button
                className="w-full"
                variant="outline"
                onClick={() => handleDelete(selectedDoc.id)}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Document'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
