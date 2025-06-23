'use client';

import Image from 'next/image';
import UserAvatar from '../UserAvatar';

// 1. Define props interface
interface FloatingWelcomeMessageProps {
  onWelcomeSend: (message: string) => void;
}

// 2. Add props to the component signature
export default function FloatingWelcomeMessage({ onWelcomeSend }: FloatingWelcomeMessageProps) {
  // Avatar dimensions are w-32 h-32, which is 128px by 128px
  const avatarSizePx = 128;
  const gap = 16; // 1rem

  const quickReplies = [
    "Can I make an appointment?",
    "Any activities for kids?",
    "What are your opening hours?",
  ];

  return (
    <div className="absolute bottom-[calc(4rem+1rem)] right-6 pointer-events-auto animate-fade-in z-40"> {/* Changed to pointer-events-auto */}
      {/* Main relative container for avatar and bubble */}
      <div className="relative w-max h-max"> {/* Adjusted to wrap content tightly */}

        {/* ChatNap Avatar - anchored to the bottom-right of this relative container */}
        <div className="absolute bottom-0 right-0">
          <UserAvatar className="w-32 h-32 flex-shrink-0" src="/chatnap-avatar.png" />
        </div>

        {/* Welcome Message Bubble - positioned to the left-top of the avatar */}
        <div
          className="absolute bg-white/10 backdrop-blur-md rounded-2xl p-4 max-w-xs text-white text-lg relative z-10" // Increased max-w
          style={{
            right: `${avatarSizePx + gap}px`, // Offset from avatar's left edge + gap
            bottom: `40px`, // Adjusted bottom offset for better positioning
          }}
        >
          Hi, I am ChatChat, how can I help you today?
          <div className="mt-3 space-y-2">
            {quickReplies.map((reply, index) => (
              <button
                key={index}
                onClick={() => onWelcomeSend(reply)}
                className="w-full text-left text-sm bg-white/10 hover:bg-white/20 transition-colors duration-200 rounded-lg px-3 py-2"
              >
                {reply}
              </button>
            ))}
          </div>
          {/* Speech bubble tail: A small rotated square as a simple tail */} 
          <div
            className="absolute w-4 h-4 bg-white/10 rounded-sm transform rotate-45"
            style={{
              bottom: '0', // Position at the very bottom edge of the bubble
              right: '0', // Position at the very right edge of the bubble
              transform: 'translate(50%, 50%) rotate(45deg)', // Push half its width/height out, then rotate
            }}
          ></div>
        </div>
      </div>
    </div>
  );
} 