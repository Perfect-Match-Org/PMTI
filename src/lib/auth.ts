import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createOrUpdateUser } from "@/db/services/userService";

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error(
    "Please define the GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables inside .env.local"
  );
}

/**
 * Checks if the given email is a valid Cornell University email.
 * @param {string} email - The email to validate.
 * @returns {boolean} - True if it's a Cornell email, false otherwise.
 */
const isValidCornellEmail = (email: string): boolean => {
  const domain = email.split("@")[1];
  return domain === "cornell.edu" || email === "cornell.perfectmatch@gmail.com";
};

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email || !user.name || !isValidCornellEmail(user.email)) {
        return false;
      }

      try {
        await createOrUpdateUser(user.email, user.name, user.image);
        return true;
      } catch (error) {
        console.error("Error creating/updating user:", error);
        return false;
      }
    },
    async redirect({ baseUrl }) {
      return baseUrl;
    },
  },
  pages: { error: "/auth/error" },
  cookies: {
    pkceCodeVerifier: {
      name: "next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production", // Use secure cookie only in production (avoid HTTP warnings in dev)
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
