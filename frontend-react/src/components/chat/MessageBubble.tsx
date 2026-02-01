/**
 * MessageBubble Component
 * Individual chat message display
 */

import React from 'react';
import type { ChatMessage } from '../../types/chat';

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`
          max-w-[70%] rounded-lg px-4 py-3
          ${
            isUser
              ? 'bg-blue-500 text-white'
              : isSystem
              ? 'bg-gray-800 text-gray-300 border border-gray-700'
              : 'bg-gray-900 text-gray-100 border border-gray-800'
          }
        `}
      >
        {/* Agent Badge (for assistant messages) */}
        {!isUser && !isSystem && message.agentName && (
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-700">
            <span className="text-lg">{message.agentIcon}</span>
            <span className="text-sm font-semibold text-gray-300">
              {message.agentName}
            </span>
          </div>
        )}

        {/* Message Content */}
        <div className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </div>

        {/* Timestamp */}
        <div
          className={`
            text-xs mt-2
            ${isUser ? 'text-blue-200' : 'text-gray-500'}
          `}
        >
          {message.timestamp.toLocaleTimeString()}
          {message.status === 'sending' && ' • Sending...'}
          {message.status === 'error' && ' • Failed'}
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded border border-gray-700"
              >
                <span className="text-lg">
                  {attachment.type === 'document' ? '📄' :
                   attachment.type === 'diagram' ? '📊' : '📎'}
                </span>
                <span className="text-sm text-gray-300">{attachment.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
