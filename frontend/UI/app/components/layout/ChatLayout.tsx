'use client';

import { useState } from 'react';
import BusinessInfo from './BusinessInfo';
import MessageThread from './MessageThread';

export default function ChatLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#6C5DD3] via-[#A66DD4] to-[#FF6AD5]">
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-full bg-white/10 backdrop-blur-sm"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Left business info panel */}
      <div
        className={`fixed lg:static w-[85%] lg:w-[35%] h-full bg-white/10 backdrop-blur-md transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <BusinessInfo />
      </div>

      {/* Right chat panel */}
      <div className="flex-1 h-full">
        <MessageThread />
      </div>
    </div>
  );
}

export {}; 