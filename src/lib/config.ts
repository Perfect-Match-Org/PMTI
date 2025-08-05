export const config = {
  apiBaseUrl: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api`,
} as const;
