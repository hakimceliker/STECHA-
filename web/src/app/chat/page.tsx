'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Button, Input, Card } from '@/components'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  created_at: string
}

export default function ChatPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    setIsAuthenticated(true)
    loadConversations()
  }, [router])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadConversations = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        'http://localhost:8000/api/v1/conversations',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      setConversations(response.data.conversations || [])
      if (response.data.conversations && response.data.conversations.length > 0) {
        loadConversation(response.data.conversations[0].id)
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }

  const loadConversation = async (conversationId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        `http://localhost:8000/api/v1/conversations/${conversationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      setCurrentConversation(response.data)
      setMessages(response.data.messages || [])
    } catch (error) {
      console.error('Failed to load conversation:', error)
    }
  }

  const createNewConversation = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(
        'http://localhost:8000/api/v1/conversations',
        { title: 'Yeni Sohbet' },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      setCurrentConversation(response.data)
      setMessages([])
      setConversations(prev => [response.data, ...prev])
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || !currentConversation) return

    setIsLoading(true)
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')

    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(
        `http://localhost:8000/api/v1/chat`,
        {
          conversation_id: currentConversation.id,
          message: inputValue,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(prev =>
        prev.filter(m => m.id !== userMessage.id)
      )
      setInputValue(inputValue)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-white dark:bg-slate-900">
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-200 dark:border-slate-700 flex flex-col bg-slate-50 dark:bg-slate-800">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <Button fullWidth onClick={createNewConversation} variant="primary" size="sm">
            + Yeni Sohbet
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => loadConversation(conv.id)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                currentConversation?.id === conv.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-600'
              }`}
            >
              <p className="truncate text-sm font-medium">{conv.title}</p>
              <p className="text-xs mt-1 opacity-70">
                {new Date(conv.created_at).toLocaleDateString('tr-TR')}
              </p>
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <Button
            fullWidth
            variant="outline"
            onClick={() => {
              localStorage.removeItem('token')
              localStorage.removeItem('user')
              router.push('/login')
            }}
            size="sm"
          >
            Çıkış Yap
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-slate-200 dark:border-slate-700 flex items-center px-6">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
            {currentConversation?.title || 'Stech AI'}
          </h1>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <Card className="text-center py-12 max-w-md">
                <p className="text-4xl mb-4">💬</p>
                <h3 className="h4 mb-2">Yeni Sohbete Hoş Geldin!</h3>
                <p className="body-sm text-slate-600 dark:text-slate-400">
                  Stech AI'a sorularını sor, rezervasyon yap, ön sipariş ver veya sohbet et.
                </p>
              </Card>
            </div>
          ) : (
            <>
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xl px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.role === 'user'
                          ? 'text-blue-100'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString('tr-TR')}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-200 dark:bg-slate-700 rounded-lg rounded-bl-none px-4 py-3">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <form onSubmit={sendMessage} className="flex gap-3">
            <Input
              type="text"
              placeholder="Mesaj gönder..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              disabled={isLoading || !currentConversation}
            />
            <Button
              type="submit"
              size="lg"
              isLoading={isLoading}
              disabled={!inputValue.trim() || !currentConversation}
            >
              Gönder
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
