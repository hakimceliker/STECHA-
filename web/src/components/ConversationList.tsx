'use client';

import { Button } from './Button';
import { LoadingSkeleton } from './LoadingSkeleton';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export default function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onRefresh,
  isLoading,
}: ConversationListProps) {
  const sortedConversations = [...conversations].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  return (
    <div className="w-64 bg-gray-50 border-r flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-gray-900 mb-3">Conversations</h2>
        <Button
          onClick={onRefresh}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white hover:bg-blue-700"
        >
          {isLoading ? 'Loading...' : 'New Chat'}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && !conversations.length ? (
          <div className="p-4">
            <LoadingSkeleton lines={3} />
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            <p>No conversations yet</p>
            <p className="text-xs mt-2">Start a new chat to begin</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sortedConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSelect(conversation.id)}
                className={`w-full text-left px-3 py-2 rounded-lg truncate text-sm transition-colors ${
                  selectedId === conversation.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
                title={conversation.title}
              >
                {conversation.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
