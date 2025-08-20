import type { Metadata } from "next";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Providers } from "./providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "DocOS - Practice Management System",
  description: "A comprehensive practice management system for healthcare providers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <Providers>
            {children}
            <ToastContainer position="bottom-right" />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
