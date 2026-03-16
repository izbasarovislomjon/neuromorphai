import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Prefer env vars, but fall back to known public project values
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://jkhxuzsvzthhacpabend.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpraHh1enN2enRoaGFjcGFiZW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMDA5NzAsImV4cCI6MjA4NzY3Njk3MH0.ak1rNx44lhl9inbBjHjnXa-dDmvAhoAHNyv6LU7Zuos";

let client: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (!client) {
    client = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return client;
}

// Backwards compatibility: default client export
export const supabase = getSupabaseClient();