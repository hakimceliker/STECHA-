'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Input, Badge } from '@/components'
import axios from 'axios'

export default function DocumentUploadPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState('other')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
      setError('')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError('Please select a file to upload')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('file', file)
      formData.append('document_type', documentType)

      const response = await axios.post(
        '/api/v1/documents/upload',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      setSuccess(true)
      setFile(null)

      setTimeout(() => {
        router.push('/documents')
      }, 2000)
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || 'Failed to upload document. Please try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="text-5xl mb-4">✓</div>
          <h2 className="h2 mb-2">Document Uploaded</h2>
          <p className="body-sm text-slate-600 dark:text-slate-400 mb-4">
            Your document has been successfully uploaded and is being processed.
          </p>
          <Badge variant="success" className="mx-auto">
            Upload Complete
          </Badge>
          <p className="body-xs text-slate-500 dark:text-slate-500 mt-6">
            Redirecting to documents page...
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8">
        <div className="mb-8">
          <h1 className="h1 mb-2">Upload Document</h1>
          <p className="body-sm text-slate-600 dark:text-slate-400">
            Upload documents for processing and storage
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Drag and drop area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-input"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.docx,.xlsx,.txt"
              disabled={loading}
            />
            <label htmlFor="file-input" className="cursor-pointer">
              <div className="text-3xl mb-2">📄</div>
              {file ? (
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {file.name}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    Drop your file here
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    or click to browse
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                    Supported: PDF, DOCX, XLSX, TXT (max 50 MB)
                  </p>
                </div>
              )}
            </label>
          </div>

          {/* Document type selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Document Type
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="other">Other</option>
              <option value="invoice">Invoice</option>
              <option value="receipt">Receipt</option>
              <option value="contract">Contract</option>
            </select>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !file}
          >
            {loading ? 'Uploading...' : 'Upload Document'}
          </Button>

          <p className="text-xs text-slate-500 dark:text-slate-400 text-center pt-2">
            Files are encrypted and stored securely
          </p>
        </form>
      </Card>
    </div>
  )
}
