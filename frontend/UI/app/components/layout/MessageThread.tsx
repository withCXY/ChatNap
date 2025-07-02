// MessageThread.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import ChatInput from '../features/ChatInput';
import FloatingWelcomeMessage from '../features/FloatingWelcomeMessage';
import UserInfoModal from '../features/UserInfoModal';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai' | 'merchant' | 'system';
  timestamp: Date;
  image?: string;
}

type HandledBy = 'ai' | 'merchant';

export default function MessageThread() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState('');
  const [handledBy] = useState<HandledBy>('ai');

  const [showFloatingWelcome, setShowFloatingWelcome] = useState(true);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [pendingUserMessage, setPendingUserMessage] = useState<{ content: string; image?: File } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = uuidv4();
      localStorage.setItem('userId', userId);
    }

    let sessionIdFromStorage = localStorage.getItem('sessionId');
    if (!sessionIdFromStorage) {
      sessionIdFromStorage = uuidv4();
      localStorage.setItem('sessionId', sessionIdFromStorage);
    }
    setSessionId(sessionIdFromStorage);

    // Create or initialize session using ADK API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    // First try to get existing session
    fetch(`${apiUrl}/apps/ai_customer_service/users/${userId}/sessions/${sessionIdFromStorage}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    }).then(res => {
      if (res.ok) {
        console.log('✅ Session found - using existing session');
      } else if (res.status === 404) {
        // Session doesn't exist, create new one
        return fetch(`${apiUrl}/apps/ai_customer_service/users/${userId}/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            state: {
              user_name: null,
              user_email: null,
              user_phone: null,
              user_platform: null,
              user_profile_complete: false,
              is_first_interaction: true
            }
          })
        }).then(createRes => {
          if (createRes.ok) {
            return createRes.json().then(sessionData => {
              // Update session ID with the one returned from backend
              const newSessionId = sessionData.id;
              localStorage.setItem('sessionId', newSessionId);
              setSessionId(newSessionId);
              console.log('✅ New session created:', newSessionId);
            });
          } else {
            throw new Error(`Failed to create session: ${createRes.status}`);
          }
        });
      } else {
        throw new Error(`Unexpected response: ${res.status}`);
      }
    }).catch(err => {
      console.error('❌ Failed to initialize session:', err);
      // Continue with existing sessionId as fallback
    });

    const info = localStorage.getItem('userInfo');
    if (info) setUserInfo(JSON.parse(info));
  }, []);

  useEffect(() => {
    if (messages.some(msg => msg.sender === 'user')) {
      setShowFloatingWelcome(false);
    }
  }, [messages]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUserInfoSubmit = async (info: any) => {
    try {
      const userId = localStorage.getItem('userId') || 'web_user';
      const sessionId = localStorage.getItem('sessionId') || 'session_001';

      // Send user info to backend
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/user-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: info.name,
          platform: info.platform,
          phone: info.phone || '',
          session_id: sessionId,
          user_id: userId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save user information');
      }

      const result = await response.json();
      console.log('User info saved successfully:', result);

      // Save to localStorage for local persistence
      localStorage.setItem('userInfo', JSON.stringify(info));
      setUserInfo(info);
      setShowUserInfoModal(false);

      if (pendingUserMessage) {
        handleSendMessage(pendingUserMessage.content, pendingUserMessage.image);
        setPendingUserMessage(null);
      }
    } catch (error) {
      console.error('Error saving user info:', error);
      // Still allow local operation even if backend fails
      localStorage.setItem('userInfo', JSON.stringify(info));
      setUserInfo(info);
      setShowUserInfoModal(false);

      if (pendingUserMessage) {
        handleSendMessage(pendingUserMessage.content, pendingUserMessage.image);
        setPendingUserMessage(null);
      }
    }
  };

  const handleSendMessage = async (content: string, image?: File) => {
    if (!userInfo) {
      setPendingUserMessage({ content, image });
      setShowUserInfoModal(true);
      return;
    }

    const userId = localStorage.getItem('userId') || 'web_user';
    const sessionId = localStorage.getItem('sessionId') || 'session_001';

    let imageBase64 = '';
    if (image) {
      try {
        imageBase64 = await fileToBase64(image);
      } catch (error) {
        console.error('Error converting image to base64:', error);
      }
    }

    setMessages(prev => [
      ...prev,
      {
        id: uuidv4(),
        content,
        sender: 'user',
        timestamp: new Date(),
        image: imageBase64 || undefined,
      },
    ]);

    try {
      console.log('🚀 Sending message to ADK /run endpoint...');
      
      // Build parts array correctly 
      const parts = [];
      if (content) {
        parts.push({ text: content });
      }
      if (imageBase64) {
        parts.push({ 
          inline_data: { 
            mime_type: 'image/png', 
            data: imageBase64.split(',')[1] 
          } 
        });
      }

      const requestBody = {
        appName: 'ai_customer_service',
        userId,
        sessionId,
        newMessage: {
          role: 'user',
          parts: parts
        }
      };

      console.log('📤 Request body:', requestBody);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const events = await response.json();
      console.log('📥 Received events:', events);
      
      // Ensure events is an array
      const eventsArray = Array.isArray(events) ? events : [events];
      
      // Find the AI's response in the events
      const modelReply = eventsArray.find(
        (e: any) => e.content?.role === 'model' && e.content.parts?.[0]?.text
      )?.content.parts[0].text;

      if (modelReply) {
        console.log('✅ AI response received:', modelReply);
        setMessages(prev => [
          ...prev,
          {
            id: uuidv4(),
            content: modelReply,
            sender: 'ai',
            timestamp: new Date(),
          },
        ]);
      } else {
        console.warn('⚠️ No valid AI response found in events');
        // Add a fallback message
        setMessages(prev => [
          ...prev,
          {
            id: uuidv4(),
            content: 'I received your message but had trouble generating a response. Please try again.',
            sender: 'ai',
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      // Add error message to chat
      setMessages(prev => [
        ...prev,
        {
          id: uuidv4(),
          content: 'Sorry, I encountered an error while processing your message. Please try again.',
          sender: 'ai',
          timestamp: new Date(),
        },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {showUserInfoModal && <UserInfoModal onSubmit={handleUserInfoSubmit} />}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-3 ${
              message.sender === 'user' ? 'justify-start' : 'items-end flex-row-reverse'
            }`}
          >
            {message.sender === 'system' ? (
              <div className="w-full text-center text-xs text-gray-400 py-2">
                <p>{message.content}</p>
              </div>
            ) : (
              <>
                {message.sender === 'ai' && (
                  <img
                    src="/chatnap-avatar.png"
                    className="w-10 h-10 rounded-full mr-2"
                    alt="AI avatar"
                  />
                )}
                <div className={`max-w-[70%] rounded-2xl p-4 ${
                  message.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/20 backdrop-blur-md text-white'
                }`}>
                  {message.image && (
                    <div className="mb-2">
                      <img
                        src={message.image}
                        alt="User uploaded image"
                        className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(message.image, '_blank')}
                      />
                    </div>
                  )}
                  {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}
                </div>
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-white/10">
        {showFloatingWelcome && <FloatingWelcomeMessage onWelcomeSend={handleSendMessage} />}
        <ChatInput onSend={handleSendMessage} />
      </div>
    </div>
  );
}
