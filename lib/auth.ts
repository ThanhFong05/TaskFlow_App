import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createClient as createBrowserSupabase } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

export async function syncUserToPrisma(user: { id: string; email?: string; user_metadata?: Record<string, any> }) {
  if (!user.email) return null;
  const name = user.user_metadata?.name || user.email.split('@')[0];

  return await prisma.user.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email,
      name,
    },
    update: {
      email: user.email,
      name: name || undefined,
    },
  });
}

export async function getAuthUser(req?: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mhkhsdnrllnqmudjqbys.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // 1. Check Bearer token from Authorization header if present
  if (req) {
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (token && supabaseAnonKey) {
        const client = createBrowserSupabase(supabaseUrl, supabaseAnonKey);
        const { data: { user }, error } = await client.auth.getUser(token);
        if (user && !error) {
          await syncUserToPrisma(user);
          return user;
        }
      }
    }
  }

  // 2. Check cookies via server supabase client
  if (supabaseAnonKey) {
    try {
      const supabase = await createServerSupabase();
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user && !error) {
        await syncUserToPrisma(user);
        return user;
      }
    } catch {
      // Cookies not available or expired
    }
  }

  return null;
}
