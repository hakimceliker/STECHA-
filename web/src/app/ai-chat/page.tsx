'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Input } from '@/components'
import axios from 'axios'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  model?: string
  provider: string
  created_at: string
}

export default function AIChatPage() {
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [conversationId, setConversationId] = useState<number>(1)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [provider, setProvider] = useState('openai')
  const [model, setModel] = useState('gpt-3.5-turbo')

  const models: Record<string, string[]> = {
    openai: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo-preview'],
    anthropic: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'claude-3-opus-20240229'],
    cohere: ['cohere'],
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadHistory = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await axios.get(
        `/api/v1/ai/conversations/${conversationId}/history`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      setMessages(response.data.messages)
      setError('')
    } catch (err: any) {
      console.error('Failed to load conversation history:', err)
      if (err.response?.status === 401) {
        router.push('/login')
      }
    }
  }, [conversationId, router])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    loadHistory()
  }, [router, conversationId, loadHistory])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim()) {
      return
    }

    const userMessage = input
    setInput('')
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(
        '/api/v1/ai/chat',
        {
          conversation_id: conversationId,
          content: userMessage,
          provider,
          model,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      setMessages(response.data.messages)
      // Add the reply
      setMessages((prev) => [...prev, response.data.reply])
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || 'Failed to send message. Please try again.'
      setError(errorMessage)
      console.error('Error sending message:', err)
      if (err.response?.status === 401) {
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 flex flex-col">
      <div className="max-w-2xl mx-auto w-full flex flex-col h-screen">
        {/* Header */}
        <div className="mb-6 pt-4">
          <button
            onClick={() => router.push('/chat')}
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm mb-3"
          >
            ← Back to Chat
          </button>
          <h1 className="h1">AI Assistant</h1>
          <p className="body-sm text-slate-400">Multi-provider AI chat with context awareness</p>
        </div>

        {/* Provider and Model Selection */}
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Provider
              </label>
              <select
                value={provider}
                onChange={(e) => {
                  setProvider(e.target.value)
                  setModel(models[e.target.value][0])
                }}
                disabled={loading}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="cohere">Cohere</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
              >
                {models[provider].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="p-4 mb-4 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </Card>
        )}

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto mb-6 space-y-4">
          {messages.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-slate-600 dark:text-slate-400">
                Start a conversation with the AI assistant
              </p>
            </Card>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <Card
                  className={`max-w-sm p-4 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-100'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-xs mt-2 opacity-70">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </p>
                </Card>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <Card className="p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
              className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6"
            >
              {loading ? '...' : 'Send'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
