'use client';

import React, { useEffect, useRef, useState } from 'react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'merchant';
  message: string;
  timestamp: string;
  avatar?: string;
}

interface ChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
}

export default function ChatHistoryModal({ isOpen, onClose, customerId, customerName }: ChatHistoryModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTakenOver, setIsTakenOver] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 查询聊天记录
  async function fetchChatHistory(sessionId: string) {
    const res = await fetch(`/api/chat-history?session_id=${sessionId}`)
    if (!res.ok) throw new Error('Failed to fetch chat history')
    const data = await res.json()
    
    // 转换数据格式以匹配ChatMessage接口
    return data.map((msg: any) => ({
      id: msg.id,
      sender: msg.sender === 'user' ? 'user' : 'bot',
      message: msg.content,
      timestamp: msg.created_at
    }))
  }

  // 发送新消息
  async function postChatMessage(msg: Omit<ChatMessage, 'id' | 'timestamp'> & { user_id: string }) {
    const res = await fetch('/api/chat-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg)
    })
    if (!res.ok) throw new Error('Failed to send message')
    return await res.json()
  }

  useEffect(() => {
    if (isOpen && customerId) {
      setIsTakenOver(false);
      setNewMessage('');
      setLoading(true);
      fetchChatHistory(customerId)
        .then((data) => setMessages(data))
        .catch(() => setMessages([]))
        .finally(() => setLoading(false));
    }
  }, [isOpen, customerId]);

  useEffect(() => { if (messages.length > 0) scrollToBottom(); }, [messages]);
  useEffect(() => { if (isTakenOver && inputRef.current) inputRef.current.focus(); }, [isTakenOver]);

  // Handle escape key and outside click
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleTakeOver = () => {
    setIsTakenOver(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 发送消息逻辑
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !customerId) return;
    const msg: Omit<ChatMessage, 'id' | 'timestamp'> & { user_id: string } = {
      sender: 'merchant',
      message: newMessage,
      user_id: customerId
    };
    setLoading(true);
    try {
      await postChatMessage(msg);
      setNewMessage('');
      // 重新拉取聊天记录
      const data = await fetchChatHistory(customerId);
      setMessages(data);
    } catch (e) {
      // 可加错误提示
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with glassmorphism effect */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className="relative w-full max-w-2xl mx-4 h-[80vh] bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/80 to-purple-50/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Chat History</h2>
              <p className="text-sm text-gray-600">{customerName}</p>
              <p className="text-xs text-gray-500">Session ID: {customerId}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-200/50 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-br from-blue-50/30 via-white/50 to-purple-50/30 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-600">Loading conversation...</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-start' : 'justify-end'} mb-4`}
                >
                  {message.sender === 'user' ? (
                    /* User message - left aligned with light blue bubble */
                    <div className="flex items-end space-x-2 max-w-xs">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-2xl rounded-bl-sm shadow-sm">
                        <p className="text-sm">{message.message}</p>
                        <p className="text-xs text-blue-100 mt-1">{formatTime(message.timestamp)}</p>
                      </div>
                    </div>
                  ) : message.sender === 'bot' ? (
                    /* Bot message - right aligned with blurred white bubble and avatar */
                    <div className="flex items-end space-x-2 max-w-xs">
                      <div className="bg-white/70 backdrop-blur-sm border border-white/30 text-gray-800 px-4 py-2 rounded-2xl rounded-br-sm shadow-sm">
                        <p className="text-sm">{message.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatTime(message.timestamp)}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center shadow-sm">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Merchant message - right aligned with gray bubble and merchant tag */
                    <div className="flex items-end space-x-2 max-w-xs">
                      <div className="bg-gray-100 border border-gray-200 text-gray-800 px-4 py-2 rounded-2xl rounded-br-sm shadow-sm">
                        <div className="flex items-center mb-1">
                          <span className="text-xs font-medium text-gray-600 bg-gray-200 px-2 py-0.5 rounded-full">Merchant</span>
                        </div>
                        <p className="text-sm">{message.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatTime(message.timestamp)}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center shadow-sm">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Footer - Take Over Button or Message Input */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200/50 bg-gray-50/80 backdrop-blur-sm">
          {!isTakenOver ? (
            /* Take Over Button */
            <div className="flex justify-center">
              <button
                onClick={handleTakeOver}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Take Over
              </button>
            </div>
          ) : (
            /* Message Input Area */
            <div className="space-y-2">
              <p className="text-xs text-center text-gray-600">You are now replying as the merchant</p>
              <div className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 