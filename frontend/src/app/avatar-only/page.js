'use client';
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const AvatarChat = dynamic(() => import('@/components/avatar/AvatarChat'), { ssr: false });

export default function AvatarOnlyPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="min-h-screen bg-transparent" />;

  return (
    <div className="min-h-screen w-full bg-transparent overflow-hidden" style={{ background: 'transparent' }}>
      <style jsx global>{`
        body, html {
          background-color: transparent !important;
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
        /* Hide all UI elements from AvatarChat except the 3D canvas and the mic button if desired */
        .chat-panel {
          display: none !important;
        }
        .avatar-viewport {
          border: none !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          background-color: transparent !important;
        }
      `}</style>
      <div className="h-screen w-screen absolute inset-0">
        <AvatarChat />
      </div>
    </div>
  );
}
