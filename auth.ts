import NextAuth, { type DefaultSession, type NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';
import type { JWT } from 'next-auth/jwt';
import { fetchFromServiceAPI } from '@/lib/api';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      plan: 'free' | 'pro';
      deletion_status?: 'none' | 'scheduled' | 'permanent';
      deletion_scheduled_at?: string | null;
      can_restore_until?: string | null;
    } & DefaultSession['user'];
  }
  interface User { plan?: 'free' | 'pro' }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    plan: 'free' | 'pro';
    deletion_status?: 'none' | 'scheduled' | 'permanent';
    deletion_scheduled_at?: string | null;
    can_restore_until?: string | null;
    last_synced_at?: number; // Add this timestamp
  }
}

function upsertUser(user: { id: string; email?: string | null; name?: string | null }) {
  const resolvedName = user.name?.trim() || user.email?.split('@')[0] || user.id;
  const resolvedEmail = user.email?.trim() || `${user.id}@provider.noemail`;
  
  // HIT AND FORGET: Does not block sign-in
  fetchFromServiceAPI('/auth/upsert-user', {
    method: 'POST',
    body: JSON.stringify({ wyiUserId: user.id, email: resolvedEmail, name: resolvedName, plan: 'free' }),
  }).catch(e => console.error('Upsert failed:', e));
}

const config: NextAuthConfig = {
  session: { strategy: 'jwt' },

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: { params: { scope: 'read:user user:email' } },
      profile(profile) {
        return {
          id: String(profile.id),
          name: profile.name ?? profile.login,
          email: profile.email,
          image: profile.avatar_url,
        };
      },
    }),
    Credentials({
      id: 'magic-link',
      name: 'Magic Link',
      credentials: { email: { type: 'text' }, magicVerified: { type: 'text' } },
      async authorize(credentials) {
        if (credentials?.magicVerified !== 'true' || !credentials?.email) return null;
        const email = credentials.email as string;
        return { id: email, email, name: email.split('@')[0] };
      },
    }),
  ],

  secret: process.env.AUTH_SECRET,
  trustHost: true,

  callbacks: {
    async signIn({ user }) {
      upsertUser({ id: user.id!, email: user.email, name: user.name });
      return true;
    },

    async jwt({ token, user, trigger }) {
      // 1. Map initial user data to token
      if (user) {
        token.id = user.id!;
        token.plan = (user as any).plan ?? 'free';
      }

      const now = Date.now();
      const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 Minutes
      
      // 2. Decide if we should block and fetch. 
      // If none of these are true, we return the cached token INSTANTLY (0 Latency).
      const needsSync = 
        trigger === 'signIn' ||           // Always sync on first login
        trigger === 'update' ||           // Always sync when manually triggered
        !token.last_synced_at ||          // First time check
        (now - token.last_synced_at > CACHE_DURATION_MS); // Cache expired

      if (token.id && needsSync) {
        try {
          const updatedUser = await fetchFromServiceAPI('/user/status', {
            method: 'POST',
            body: JSON.stringify({ userId: token.id }),
          });
          
          if (updatedUser?.plan) token.plan = updatedUser.plan;
          token.deletion_status = updatedUser?.deletion_status ?? 'none';
          token.deletion_scheduled_at = updatedUser?.deletion_scheduled_at ?? null;
          token.can_restore_until = updatedUser?.can_restore_until ?? null;
          
          // Mark the token as fresh
          token.last_synced_at = now; 
        } catch (e) {
          console.error('JWT sync failed:', e);
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id;
      session.user.plan = token.plan ?? 'free';
      session.user.deletion_status = token.deletion_status ?? 'none';
      session.user.deletion_scheduled_at = token.deletion_scheduled_at ?? null;
      session.user.can_restore_until = token.can_restore_until ?? null;
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);