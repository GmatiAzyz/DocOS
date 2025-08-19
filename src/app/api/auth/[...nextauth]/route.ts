import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
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

        const doctor = await prisma.doctor.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!doctor) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          doctor.passwordHash
        );

        if (!passwordMatch) {
          return null;
        }

        return {
          id: doctor.id,
          email: doctor.email,
          name: doctor.clinicName,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
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
};

import NextAuth from "next-auth/next";
export const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };