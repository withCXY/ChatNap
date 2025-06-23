'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import ChatLayout from '../layout/ChatLayout';

export default function LeadingPageAnimation() {
  const [mounted, setMounted] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [avatarSize, setAvatarSize] = useState('h-64 w-64'); // Initial large size
  const [introOpacity, setIntroOpacity] = useState('opacity-100'); // State for fading out intro screen
  const [showMainChat, setShowMainChat] = useState(false);

  // Drag states (no longer needed for floating avatar, but keeping for now if related logic is dependent)
  // const [isDragging, setIsDragging] = useState(false);
  // const [dragStartX, setDragStartX] = useState(0);
  // const [dragStartY, setDragStartY] = useState(0);
  // const [avatarX, setAvatarX] = useState(0);
  // const [avatarY, setAvatarY] = useState(0);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // After 3 seconds, start shrink and fade-out animation for the intro screen
    const shrinkAndFadeOutTimer = setTimeout(() => {
      setAvatarSize('h-14 w-14'); // Target size for visual transition to chat avatar
      setIntroOpacity('opacity-0'); // Start fading out the entire intro screen
    }, 3000);

    // After animation and fade-out, hide intro and show main chat
    const showMainChatTimer = setTimeout(() => {
      setShowIntro(false);
      setShowMainChat(true);
    }, 3000 + 500); // 3 seconds delay + 0.5 seconds for fade-out transition

    return () => {
      clearTimeout(shrinkAndFadeOutTimer);
      clearTimeout(showMainChatTimer);
    };
  }, [mounted]);

  // Dragging logic is removed from here

  // const handleMouseDown = (e: React.MouseEvent) => {
  //   if (!showMainChat) return;
  //   setIsDragging(true);
  //   setDragStartX(e.clientX - avatarX);
  //   setDragStartY(e.clientY - avatarY);
  // };

  if (!mounted) {
    return null;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-[#6C5DD3] via-[#A66DD4] to-[#FF6AD5]">
      {showIntro && (
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-500 ${introOpacity}`}
        >
          <div
            ref={avatarRef}
            className={`transition-all duration-500 ease-in-out ${avatarSize} bg-white/20 rounded-full flex items-center justify-center overflow-hidden shadow-lg mb-10`}
          >
            <Image
              src="/chatnap-avatar.png"
              alt="ChatNap 3D Avatar"
              width={256}
              height={256}
              priority
              className="w-full h-full object-cover"
            />
          </div>
          <div
            className="text-center"
            style={{ 
              fontSize: '54px',
              fontWeight: '600',
              fontFamily: 'Poppins, Inter, system-ui, sans-serif',
              lineHeight: '1.2',
              maxWidth: '90vw',
              wordWrap: 'break-word',
              background: 'linear-gradient(to right, #ff9acb, #b082ff)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent'
            }}
          >
            Because every seller deserves their own AI agent.
          </div>
        </div>
      )}

      {showMainChat && (
        <div className="w-full h-full animate-fade-in">
          <ChatLayout />
        </div>
      )}
    </div>
  );
} 