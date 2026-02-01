/**
 * MessageInput Component
 * Premium input field with @agent mention autocomplete
 */

import React, { useState, useRef } from 'react';
import { useChatStore } from '../../store/chatStore';
import { AGENTS } from '../../types/agent';
import { getAuthHeader } from '../../services/auth';
import { config } from '../../config/api';

export const MessageInput: React.FC = () => {
  const [input, setInput] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const addMessage = useChatStore((state) => state.addMessage);

  // Available agents for mentions
  const availableAgents = Object.values(AGENTS);

  // Filter agents based on mention input
  const filteredAgents = availableAgents.filter((agent) =>
    agent.name.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);

    // Check for @ mention trigger
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setMentionFilter(mentionMatch[1]);
      setShowMentions(true);
      setSelectedMentionIndex(0);
    } else {
      setShowMentions(false);
    }
  };

  // Insert mention
  const insertMention = (agentName: string) => {
    const cursorPosition = inputRef.current?.selectionStart || 0;
    const textBeforeCursor = input.slice(0, cursorPosition);
    const textAfterCursor = input.slice(cursorPosition);

    // Replace @partial with @agentname
    const newTextBefore = textBeforeCursor.replace(/@\w*$/, `@${agentName.toLowerCase()} `);
    const newInput = newTextBefore + textAfterCursor;

    setInput(newInput);
    setShowMentions(false);

    // Focus back on input
    setTimeout(() => {
      inputRef.current?.focus();
      const newCursorPos = newTextBefore.length;
      inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Handle keyboard navigation in mentions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions && filteredAgents.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex((prev) =>
          prev < filteredAgents.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex((prev) =>
          prev > 0 ? prev - 1 : filteredAgents.length - 1
        );
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        insertMention(filteredAgents[selectedMentionIndex].name);
        return;
      } else if (e.key === 'Escape') {
        setShowMentions(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
      e.preventDefault();
      handleSend();
    }
  };

  // Send message
  const handleSend = () => {
    if (!input.trim() || isSending) return;

    // Extract mentioned agents
    const mentionMatches = input.match(/@(\w+)/g);
    const mentions = mentionMatches
      ? mentionMatches.map((m) => m.slice(1).toLowerCase())
      : [];

    console.log('[Chat] Sending message:', input);

    // Add user message
    addMessage({
      role: 'user',
      content: input,
      mentions
    });
    console.log('[Chat] User message added to store');

    // Clear input immediately for better UX
    const messageToSend = input;
    setInput('');
    setIsSending(true);

    // Send to backend API
    (async () => {
      try {
        console.log('[Chat] Getting auth header...');
        const authHeader = await getAuthHeader();
        console.log('[Chat] Auth header obtained');

        console.log('[Chat] Calling API...');
        const response = await fetch(config.api.chat.agent, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify({
            message: messageToSend,
            mentions: mentions.length > 0 ? mentions : undefined
          })
        });

        console.log('[Chat] API response status:', response.status);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('[Chat] Response data:', data);

        // Add agent response
        const agentInfo = availableAgents.find(a => a.id === data.agentId);
        console.log('[Chat] Agent info:', agentInfo);

        const messageToAdd = {
          role: 'assistant' as const,
          content: data.message,
          agentId: data.agentId,
          agentName: agentInfo?.name || data.agentId,
          agentIcon: agentInfo?.icon || '🤖'
        };
        console.log('[Chat] Adding agent message:', messageToAdd);

        addMessage(messageToAdd);
        console.log('[Chat] Agent message added to store');
      } catch (error) {
        console.error('[Chat] Error sending message:', error);

        // Add error message
        addMessage({
          role: 'system',
          content: `Error: Failed to send message. ${error instanceof Error ? error.message : 'Please try again.'}`
        });
      } finally {
        setIsSending(false);
      }
    })();
  };

  return (
    <div className="relative glass-subtle border-t border-white/5 p-6">
      {/* Mention Suggestions */}
      {showMentions && filteredAgents.length > 0 && (
        <div className="mention-dropdown absolute bottom-full left-6 right-6 mb-3 max-h-64 overflow-y-auto animate-scale-in">
          <div className="p-2">
            <div className="text-xs text-white/40 px-3 py-2 font-medium uppercase tracking-wider">
              Mention an agent
            </div>
            {filteredAgents.map((agent, index) => (
              <button
                key={agent.id}
                onClick={() => insertMention(agent.name)}
                className={`mention-item w-full rounded-lg ${
                  index === selectedMentionIndex ? 'selected' : ''
                }`}
              >
                <div className="text-2xl">{agent.icon}</div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-white">{agent.name}</div>
                  <div className="text-xs text-white/40">{agent.description}</div>
                </div>
                <svg className="w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Container */}
      <div className="flex items-end gap-4">
        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... Use @ to mention an agent"
            className="input-premium w-full px-5 py-4 resize-none max-h-32"
            rows={1}
            style={{
              minHeight: '56px',
              height: 'auto'
            }}
          />
          {/* @ Hint */}
          {!input && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-white/20">
              <kbd className="text-xs px-1.5 py-0.5 rounded bg-white/5 border border-white/10">@</kbd>
              <span className="text-xs">mention</span>
            </div>
          )}
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!input.trim() || isSending}
          className="btn-primary px-6 py-4 rounded-xl flex items-center gap-2 min-w-[100px] justify-center"
        >
          {isSending ? (
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <>
              <span className="font-medium">Send</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </button>
      </div>

      {/* Hints */}
      <div className="mt-3 flex items-center gap-4 text-xs text-white/30">
        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono">Enter</kbd>
          <span>send</span>
        </div>
        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono">Shift+Enter</kbd>
          <span>new line</span>
        </div>
      </div>
    </div>
  );
};
