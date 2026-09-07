import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { auth } from '@clerk/nextjs/server';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { getToken } = await auth();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const supabaseKey = secretKey || anonKey;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase URL or Key missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.'
    );
  }

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
      global: {
        fetch: async (url, options = {}) => {
          let clerkToken: string | null = null;
          try {
            clerkToken = await getToken({ template: 'supabase' });
          } catch {
            // Clerk JWT template 'supabase' may not be configured in Clerk dashboard
          }

          const headers = new Headers(options.headers);
          if (clerkToken) {
            headers.set('Authorization', `Bearer ${clerkToken}`);
          } else if (secretKey) {
            headers.set('Authorization', `Bearer ${secretKey}`);
          }

          return fetch(url, {
            ...options,
            headers,
          });
        },
      },
    }
  );
}