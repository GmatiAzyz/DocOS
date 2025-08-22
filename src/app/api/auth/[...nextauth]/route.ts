import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Simple in-memory rate limiting for login attempts
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Check rate limiting
        const now = Date.now();
        const attempts = loginAttempts.get(credentials.email) || { count: 0, lastAttempt: 0 };
        
        // Reset count if lockout period has passed
        if (now - attempts.lastAttempt > LOCKOUT_TIME) {
          attempts.count = 0;
        }
        
        // Check if account is locked
        if (attempts.count >= MAX_ATTEMPTS) {
          throw new Error("Account temporarily locked due to too many failed attempts. Please try again later.");
        }

        try {
          const doctor = await prisma.doctor.findUnique({
            where: {
              email: credentials.email,
            },
          });

          if (!doctor) {
            // Increment failed attempts
            loginAttempts.set(credentials.email, {
              count: attempts.count + 1,
              lastAttempt: now
            });
            return null;
          }

          const passwordMatch = await bcrypt.compare(
            credentials.password,
            doctor.passwordHash
          );

          if (!passwordMatch) {
            // Increment failed attempts
            loginAttempts.set(credentials.email, {
              count: attempts.count + 1,
              lastAttempt: now
            });
            return null;
          }

          // Reset attempts on successful login
          loginAttempts.delete(credentials.email);

          return {
            id: doctor.id,
            email: doctor.email,
            name: doctor.clinicName,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          throw new Error("Authentication service temporarily unavailable");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Add debug logging in development
  ...(process.env.NODE_ENV === 'development' && {
    debug: true,
  }),
};

import NextAuth from "next-auth/next";
export const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };