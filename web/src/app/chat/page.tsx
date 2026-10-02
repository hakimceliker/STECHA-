'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ChatInterface from '@/components/ChatInterface';
import ConversationList from '@/components/ConversationList';
import { useAuth } from '@/hooks/useAuth';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export default function ChatPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [conversationsLoading, setConversationsLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    try {
      setConversationsLoading(true);
      const response = await fetch('/api/v1/conversations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
    }
  }, [isAuthenticated, loadConversations]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-white">
      <ConversationList
        conversations={conversations}
        selectedId={selectedConversationId}
        onSelect={setSelectedConversationId}
        onRefresh={loadConversations}
        isLoading={conversationsLoading}
      />
      <ChatInterface
        conversationId={selectedConversationId}
        onConversationChange={loadConversations}
      />
    </div>
  );
}
