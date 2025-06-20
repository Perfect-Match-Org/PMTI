import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

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
      if (user.email && isValidCornellEmail(user.email)) {
        return true;
      }
      return false;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
