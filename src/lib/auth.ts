import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";

// Determine the base URL based on environment
const getBaseUrl = () => {
  if (process.env.NODE_ENV === "production") {
    return "https://videographic.vercel.app";
  }
  return process.env.NEXTAUTH_URL || "http://localhost:3000";
};

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async session({ session, user }) {
      // Add user ID to session (database strategy)
      if (user && session.user) {
        session.user.id = user.id;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      const actualBaseUrl = getBaseUrl();
      // Redirect to dashboard after sign in
      if (url.startsWith("/")) return `${actualBaseUrl}${url}`;
      if (new URL(url).origin === baseUrl || new URL(url).origin === actualBaseUrl) return url;
      return `${actualBaseUrl}/dashboard`;
    },
  },
  session: {
    strategy: "database", // Use database sessions
  },
  // Explicitly set the NEXTAUTH_URL based on environment
  ...(process.env.NODE_ENV === "production" && {
    url: "https://videographic.vercel.app",
  }),
});
