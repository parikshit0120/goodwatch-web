'use client';

import { useState, useEffect, useRef } from 'react';
import { TabName } from '@/types';
import { getProactiveSuggestion, generateChatResponse } from '@/lib/aiResponses';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatProps {
  activeTab: TabName;
}

export default function AIChat({ activeTab }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Send proactive suggestion when tab changes
    if (messages.length === 0) {
      sendProactiveSuggestion();
    }
  }, [activeTab]);

  const sendProactiveSuggestion = () => {
    setLoading(true);
    try {
      const suggestion = getProactiveSuggestion(activeTab);
      setMessages([
        {
          role: 'assistant',
          content: suggestion,
        },
      ]);
    } catch (error) {
      console.error('Failed to get proactive suggestion:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = generateChatResponse(userMessage.content, activeTab);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response },
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1a1a1f] border border-[#2a2a2f] rounded-lg flex flex-col h-[calc(100vh-300px)]">
      <div className="p-4 border-b border-[#2a2a2f]">
        <h3 className="font-bold text-[#e8e6e3]">AI Assistant</h3>
        <p className="text-xs text-[#a8a6a3] mt-1">
          Context-aware suggestions for {activeTab}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="text-center text-[#6a6a6f] text-sm py-8">
            Ask me anything about your {activeTab} strategy, tasks, or metrics.
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-3 text-sm ${
                message.role === 'user'
                  ? 'bg-[#d4a843] text-[#0a0a0f]'
                  : 'bg-[#0a0a0f] border border-[#2a2a2f] text-[#e8e6e3]'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#0a0a0f] border border-[#2a2a2f] rounded-lg p-3 text-sm text-[#a8a6a3]">
              Thinking...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-[#2a2a2f]">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for suggestions..."
            className="flex-1 px-3 py-2 bg-[#0a0a0f] border border-[#2a2a2f] rounded text-[#e8e6e3] text-sm focus:outline-none focus:border-[#d4a843]"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-[#d4a843] text-[#0a0a0f] rounded font-medium hover:bg-[#c49833] transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
