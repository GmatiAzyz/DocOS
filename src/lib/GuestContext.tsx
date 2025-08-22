"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface GuestContextType {
  isGuest: boolean;
  setIsGuest: (value: boolean) => void;
  exitGuestMode: () => void;
}

const GuestContext = createContext<GuestContextType | undefined>(undefined);

export function GuestProvider({ children }: { children: ReactNode }) {
  const [isGuest, setIsGuest] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check URL parameter first
    const guestParam = searchParams?.get("guest");
    
    // Check sessionStorage for persistence (more secure than localStorage)
    const storedGuestMode = typeof window !== 'undefined' ? sessionStorage.getItem("guestMode") : null;
    
    // Only allow guest mode if explicitly requested
    if (guestParam === "true" || storedGuestMode === "true") {
      setIsGuest(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem("guestMode", "true");
      }
    }
  }, [searchParams]);

  const exitGuestMode = () => {
    setIsGuest(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem("guestMode");
    }
    router.push('/login');
  };

  return (
    <GuestContext.Provider value={{ isGuest, setIsGuest, exitGuestMode }}>
      {children}
    </GuestContext.Provider>
  );
}

export function useGuestMode() {
  const context = useContext(GuestContext);
  if (context === undefined) {
    throw new Error('useGuestMode must be used within a GuestProvider');
  }
  return context;
}