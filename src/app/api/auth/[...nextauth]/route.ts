import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { dbConnect } from "@/lib/dbConnect";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

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
      if (!user.email || !isValidCornellEmail(user.email)) {
        return false;
      }

      try {
        const db = await dbConnect();

        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1);

        if (existingUser.length === 0) {
          await db.insert(users).values({
            email: user.email,
            name: user.name || user.email.split("@")[0],
          });
        }

        return true;
      } catch (error) {
        console.error("Error creating user:", error);
        return false;
      }
    },
    async redirect({ url, baseUrl }) {
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

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
