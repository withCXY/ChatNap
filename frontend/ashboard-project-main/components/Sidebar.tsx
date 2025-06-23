'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-br from-[#6C5DD3] via-[#A66DD4] to-[#FF6AD5] text-white p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">ChatNap</h1>
      </div>
      <nav className="space-y-4">
        <Link href="/" className={`flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 ${pathname === '/' ? 'bg-white/10' : ''}`}>
          <Image src="/customers.svg" alt="Customers" width={20} height={20} />
          <span>Customers</span>
        </Link>
        {/* Conditionally render Link or div based on current path */}
        {pathname === '/calendar' ? (
          <div className="flex items-center gap-3 p-2 rounded-lg bg-white/10">
            <Image src="/calendar.svg" alt="Calendar" width={20} height={20} />
            <span>Calendar</span>
          </div>
        ) : (
          <Link href="/calendar" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10">
            <Image src="/calendar.svg" alt="Calendar" width={20} height={20} />
            <span>Calendar</span>
          </Link>
        )}
        {/* Settings Link */}
        {pathname === '/settings' ? (
          <div className="flex items-center gap-3 p-2 rounded-lg bg-white/10">
            <Image src="/settings.svg" alt="Settings" width={20} height={20} />
            <span>Settings</span>
          </div>
        ) : (
          <Link href="/settings" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10">
            <Image src="/settings.svg" alt="Settings" width={20} height={20} />
            <span>Settings</span>
          </Link>
        )}
        {/* Portfolio Link */}
        {pathname === '/portfolio' ? (
          <div className="flex items-center gap-3 p-2 rounded-lg bg-white/10">
            <Image src="/portfolio.svg" alt="Portfolio" width={20} height={20} />
            <span>Portfolio</span>
          </div>
        ) : (
          <Link href="/portfolio" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10">
            <Image src="/portfolio.svg" alt="Portfolio" width={20} height={20} />
            <span>Portfolio</span>
          </Link>
        )}
      </nav>
    </aside>
  );
} 