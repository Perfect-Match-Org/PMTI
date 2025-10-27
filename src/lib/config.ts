export const config = {
  apiBaseUrl: `${
    process.env.NEXT_PUBLIC_API_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"
  }/api`,
} as const;
