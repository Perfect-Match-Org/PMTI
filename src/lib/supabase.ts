import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { config } from "./config";

declare global {
  var supabase: SupabaseClient | undefined;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabaseAnon = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

interface ClientCache {
  client: SupabaseClient;
  token: string;
  expiresAt: number;
}

let clientCache: ClientCache | null = null;

async function getSupabaseAuthClient(): Promise<SupabaseClient> {
  const now = Date.now();

  // Return cached client if token is still valid
  if (clientCache && clientCache.expiresAt > now) {
    return clientCache.client;
  }

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const res = await fetch(`${config.apiBaseUrl}/auth/supabase`);

  if (!res.ok) {
    console.error("Supabase Auth - Failed to fetch token from auth route");
    return supabaseAnon;
  }

  const data = await res.json();
  if (!data.token) {
    console.error("Supabase Auth - No token received from auth route");
    return supabaseAnon;
  }

  const token = data.token as string;

  // Create client with JWT for both database queries and realtime
  const supabaseAuthClient = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  // Set the access token for realtime authorization
  await supabaseAuthClient.realtime.setAuth(token);

  clientCache = {
    client: supabaseAuthClient,
    token,
    expiresAt: now + 50 * 60 * 1000, // Cache for 50 minutes (JWT expires in 24h)
  };

  console.log("Supabase Auth - Client configured with JWT");

  return supabaseAuthClient;
}

// Client-side Supabase instance (safe for browser)
export const supabase = global.supabase || (await getSupabaseAuthClient());
