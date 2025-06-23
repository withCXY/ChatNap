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

// Mock chat data based on customer ID
const getMockChatHistory = (customerId: string): ChatMessage[] => {
  const chatData: Record<string, ChatMessage[]> = {
    'cus_mock_shopify_test': [
      {
        id: '1',
        sender: 'user',
        message: 'Hi, I want to know about your new product features.',
        timestamp: '2024-01-15T09:00:00Z'
      },
      {
        id: '2',
        sender: 'bot',
        message: 'Hello! I\'d be happy to tell you about our new features. We\'ve recently added advanced analytics and improved user interface.',
        timestamp: '2024-01-15T09:01:00Z',
        avatar: '/api/placeholder/32/32'
      },
      {
        id: '3',
        sender: 'user',
        message: 'That sounds interesting! Can you give me more details?',
        timestamp: '2024-01-15T09:02:00Z'
      },
      {
        id: '4',
        sender: 'bot',
        message: 'Certainly! Our new analytics dashboard provides real-time insights into customer behavior, and the new UI is more intuitive and responsive.',
        timestamp: '2024-01-15T09:03:00Z',
        avatar: '/api/placeholder/32/32'
      }
    ],
    'cus_henry_evans': [
      {
        id: '1',
        sender: 'user',
        message: 'What\'s your return policy? I need to return an item.',
        timestamp: '2024-01-14T14:30:00Z'
      },
      {
        id: '2',
        sender: 'bot',
        message: 'Our return policy allows returns within 30 days of purchase. Items must be in original condition with tags attached.',
        timestamp: '2024-01-14T14:31:00Z',
        avatar: '/api/placeholder/32/32'
      },
      {
        id: '3',
        sender: 'user',
        message: 'I bought this item 2 weeks ago but lost the receipt. Can I still return it?',
        timestamp: '2024-01-14T14:32:00Z'
      },
      {
        id: '4',
        sender: 'bot',
        message: 'If you have the order number or purchased online, we can look up your purchase. Let me transfer you to our returns specialist.',
        timestamp: '2024-01-14T14:33:00Z',
        avatar: '/api/placeholder/32/32'
      },
      {
        id: '5',
        sender: 'user',
        message: 'Thank you, I\'ll wait for the specialist.',
        timestamp: '2024-01-14T14:34:00Z'
      }
    ],
    'cus_grace_wilson': [
      {
        id: '1',
        sender: 'user',
        message: 'I want to confirm my order and provide shipping details.',
        timestamp: '2024-01-13T16:15:00Z'
      },
      {
        id: '2',
        sender: 'bot',
        message: 'Perfect! I can help you confirm your order. Could you please provide your order number?',
        timestamp: '2024-01-13T16:16:00Z',
        avatar: '/api/placeholder/32/32'
      },
      {
        id: '3',
        sender: 'user',
        message: 'Order #12345. I need it shipped to 123 Main St, New York, NY 10001',
        timestamp: '2024-01-13T16:17:00Z'
      },
      {
        id: '4',
        sender: 'bot',
        message: 'Great! I\'ve updated your shipping address. Your order will be shipped within 2-3 business days. You\'ll receive a tracking number via email.',
        timestamp: '2024-01-13T16:18:00Z',
        avatar: '/api/placeholder/32/32'
      },
      {
        id: '5',
        sender: 'user',
        message: 'Perfect! Thank you for your help.',
        timestamp: '2024-01-13T16:19:00Z'
      }
    ],
    'cus_frank_miller': [
      {
        id: '1',
        sender: 'user',
        message: 'I received a defective product. The quality is terrible!',
        timestamp: '2024-01-12T11:00:00Z'
      },
      {
        id: '2',
        sender: 'bot',
        message: 'I\'m very sorry to hear about the quality issue. This is definitely not up to our standards. Let me escalate this to our quality team.',
        timestamp: '2024-01-12T11:01:00Z',
        avatar: '/api/placeholder/32/32'
      },
      {
        id: '3',
        sender: 'user',
        message: 'I want a full refund and compensation for my time!',
        timestamp: '2024-01-12T11:02:00Z'
      },
      {
        id: '4',
        sender: 'bot',
        message: 'I completely understand your frustration. I\'m escalating this to our senior management team who will contact you within 24 hours to resolve this properly.',
        timestamp: '2024-01-12T11:03:00Z',
        avatar: '/api/placeholder/32/32'
      }
    ],
    'cus_emily_clark': [
      {
        id: '1',
        sender: 'user',
        message: 'Hi, I\'m a loyal customer. Can I get a discount on my next purchase?',
        timestamp: '2024-01-11T13:45:00Z'
      },
      {
        id: '2',
        sender: 'bot',
        message: 'Hello! We really appreciate your loyalty. Let me check what discounts we can offer you.',
        timestamp: '2024-01-11T13:46:00Z',
        avatar: '/api/placeholder/32/32'
      },
      {
        id: '3',
        sender: 'user',
        message: 'I\'ve been shopping with you for over 2 years now.',
        timestamp: '2024-01-11T13:47:00Z'
      },
      {
        id: '4',
        sender: 'bot',
        message: 'That\'s wonderful! I\'m connecting you with our manager who can provide special pricing for valued customers like yourself.',
        timestamp: '2024-01-11T13:48:00Z',
        avatar: '/api/placeholder/32/32'
      }
    ],
    'cus_david_brown': [
      {
        id: '1',
        sender: 'user',
        message: 'Hello, I\'m interested in placing a large order for my business.',
        timestamp: '2024-01-10T10:20:00Z'
      },
      {
        id: '2',
        sender: 'bot',
        message: 'Hello! That\'s great to hear. We love working with business customers. What type of products are you looking for?',
        timestamp: '2024-01-10T10:21:00Z',
        avatar: '/api/placeholder/32/32'
      },
      {
        id: '3',
        sender: 'user',
        message: 'I need about 500 units of your premium product line.',
        timestamp: '2024-01-10T10:22:00Z'
      },
      {
        id: '4',
        sender: 'bot',
        message: 'Excellent! For bulk orders like this, we offer special pricing and dedicated support. Let me get you connected with our business sales team.',
        timestamp: '2024-01-10T10:23:00Z',
        avatar: '/api/placeholder/32/32'
      }
    ],
    'cus_cathy_lee': [
      {
        id: '1',
        sender: 'user',
        message: 'My order hasn\'t arrived yet and it\'s been 2 weeks. Where is it?',
        timestamp: '2024-01-09T15:30:00Z'
      },
      {
        id: '2',
        sender: 'bot',
        message: 'I apologize for the delay. Let me track your shipment immediately. Can you provide your order number?',
        timestamp: '2024-01-09T15:31:00Z',
        avatar: '/api/placeholder/32/32'
      },
      {
        id: '3',
        sender: 'user',
        message: 'Order #67890. This is unacceptable!',
        timestamp: '2024-01-09T15:32:00Z'
      },
      {
        id: '4',
        sender: 'bot',
        message: 'I see the issue - there was a shipping delay from our carrier. I\'m escalating this to our logistics supervisor to resolve immediately and provide compensation.',
        timestamp: '2024-01-09T15:33:00Z',
        avatar: '/api/placeholder/32/32'
      }
    ],
    'cus_bob_smith': [
      {
        id: '1',
        sender: 'user',
        message: 'Hi, I want to confirm my order is ready for pickup.',
        timestamp: '2024-01-08T12:00:00Z'
      },
      {
        id: '2',
        sender: 'bot',
        message: 'Hello! I can help you with that. Your order has been confirmed and is pending shipment.',
        timestamp: '2024-01-08T12:01:00Z',
        avatar: '/api/placeholder/32/32'
      },
      {
        id: '3',
        sender: 'user',
        message: 'Great! When will it be ready?',
        timestamp: '2024-01-08T12:02:00Z'
      },
      {
        id: '4',
        sender: 'bot',
        message: 'Your order will be ready for pickup tomorrow after 2 PM. We\'ll send you a notification when it\'s ready.',
        timestamp: '2024-01-08T12:03:00Z',
        avatar: '/api/placeholder/32/32'
      }
    ],
    'cus_alice_johnson': [
      {
        id: '1',
        sender: 'user',
        message: 'Can you tell me more about this product? I need detailed specifications.',
        timestamp: '2024-01-07T14:15:00Z'
      },
      {
        id: '2',
        sender: 'bot',
        message: 'Of course! I\'d be happy to provide detailed product information. Which specific product are you interested in?',
        timestamp: '2024-01-07T14:16:00Z',
        avatar: '/api/placeholder/32/32'
      },
      {
        id: '3',
        sender: 'user',
        message: 'The premium model X1. I need dimensions and technical specs.',
        timestamp: '2024-01-07T14:17:00Z'
      },
      {
        id: '4',
        sender: 'bot',
        message: 'Here\'s a detailed quote for the X1 model including all specifications. The dimensions are 24"x18"x12" and it includes advanced features like wireless connectivity.',
        timestamp: '2024-01-07T14:18:00Z',
        avatar: '/api/placeholder/32/32'
      },
      {
        id: '5',
        sender: 'user',
        message: 'Perfect! This is exactly what I was looking for.',
        timestamp: '2024-01-07T14:19:00Z'
      }
    ],
    '9': [
      {
        id: '1',
        sender: 'user',
        message: 'Hi! I saw your product in a viral TikTok video. It looks amazing!',
        timestamp: '2024-01-16T11:30:00Z'
      },
      {
        id: '2',
        sender: 'bot',
        message: 'Hello! That\'s wonderful to hear! TikTok has been great for showcasing our products. Which specific product caught your attention?',
        timestamp: '2024-01-16T11:31:00Z',
        avatar: '/api/placeholder/32/32'
      },
      {
        id: '3',
        sender: 'user',
        message: 'The wireless earbuds! The video showed how good the sound quality is. I want to order in bulk for my store.',
        timestamp: '2024-01-16T11:32:00Z'
      },
      {
        id: '4',
        sender: 'bot',
        message: 'Excellent choice! Our wireless earbuds have been very popular on TikTok. For bulk orders, we offer special wholesale pricing. How many units are you looking to purchase?',
        timestamp: '2024-01-16T11:33:00Z',
        avatar: '/api/placeholder/32/32'
      },
      {
        id: '5',
        sender: 'user',
        message: 'I\'m thinking around 200-300 units to start with. What kind of discount can you offer?',
        timestamp: '2024-01-16T11:34:00Z'
      },
      {
        id: '6',
        sender: 'bot',
        message: 'For orders of 200+ units, we can offer a 25% wholesale discount. I\'ll connect you with our bulk sales team to finalize the details and arrange shipping.',
        timestamp: '2024-01-16T11:35:00Z',
        avatar: '/api/placeholder/32/32'
      }
    ]
  };

  // Return specific chat history for the customer, or default if not found
  return chatData[customerId] || [
    {
      id: '1',
      sender: 'user',
      message: 'Hello, I have a question about your services.',
      timestamp: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      sender: 'bot',
      message: 'Hello! I\'d be happy to help you. What can I assist you with today?',
      timestamp: '2024-01-15T10:01:00Z',
      avatar: '/api/placeholder/32/32'
    }
  ];
};

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

  useEffect(() => {
    if (isOpen && customerId) {
      // Reset state when opening modal
      setIsTakenOver(false);
      setNewMessage('');
      
      // Simulate API call to fetch conversation history based on customer ID
      setLoading(true);
      setTimeout(() => {
        const customerChatHistory = getMockChatHistory(customerId);
        setMessages(customerChatHistory);
        setLoading(false);
      }, 500);
    }
  }, [isOpen, customerId]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    if (isTakenOver && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isTakenOver]);

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

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const merchantMessage: ChatMessage = {
        id: `merchant_${Date.now()}`,
        sender: 'merchant',
        message: newMessage.trim(),
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, merchantMessage]);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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