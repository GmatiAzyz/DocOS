"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface GuestContextType {
  isGuest: boolean;
  setIsGuest: (value: boolean) => void;
}

const GuestContext = createContext<GuestContextType>({
  isGuest: false,
  setIsGuest: () => {},
});

export function GuestProvider({ children }: { children: React.ReactNode }) {
  const [isGuest, setIsGuest] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check URL parameter
    const guestParam = searchParams?.get("guest");
    
    // Check sessionStorage
    const storedGuestMode = typeof window !== 'undefined' ? sessionStorage.getItem("guestMode") : null;
    
    if (guestParam === "true" || storedGuestMode === "true") {
      setIsGuest(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem("guestMode", "true");
      }
    }
  }, [searchParams]);

  return (
    <GuestContext.Provider value={{ isGuest, setIsGuest }}>
      {children}
    </GuestContext.Provider>
  );
}

export function useGuest() {
  const context = useContext(GuestContext);
  return context;
}