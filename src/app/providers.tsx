"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";
import { GuestProvider } from "@/lib/GuestContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <GuestProvider>
        {children}
      </GuestProvider>
    </SessionProvider>
  );
}