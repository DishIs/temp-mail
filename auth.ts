import NextAuth, { type DefaultSession, type NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';
import type { JWT } from 'next-auth/jwt';
import { fetchFromServiceAPI } from '@/lib/api';

declare module 'next-auth' {
  interface Session {
    user: { id: string; plan: 'free' | 'pro' } & DefaultSession['user'];
  }
  interface User { plan?: 'free' | 'pro' }
}
declare module 'next-auth/jwt' {
  interface JWT { id: string; plan: 'free' | 'pro' }
}

async function upsertUser(user: { id: string; email?: string | null; name?: string | null }) {
  const resolvedName = user.name?.trim() || user.email?.split('@')[0] || user.id;
  const resolvedEmail = user.email?.trim() || `${user.id}@provider.noemail`;
  try {
    await fetchFromServiceAPI('/auth/upsert-user', {
      method: 'POST',
      body: JSON.stringify({ wyiUserId: user.id, email: resolvedEmail, name: resolvedName, plan: 'free' }),
    });
  } catch (e) {
    console.error('Upsert failed:', e);
  }
}

const config: NextAuthConfig = {
  // ✅ No adapter — JWT only, no KV recursion
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

    // ✅ Magic link sign-in — token already verified by /api/auth/magic/verify
    //    This provider is ONLY called from that route, never directly by users
    Credentials({
      id: 'magic-link',
      name: 'Magic Link',
      credentials: {
        email: { type: 'text' },
        magicVerified: { type: 'text' },
      },
      async authorize(credentials) {
        // Extra guard: only accept if our verify route set the flag
        if (credentials?.magicVerified !== 'true' || !credentials?.email) {
          return null;
        }
        const email = credentials.email as string;
        return {
          id: email, // use email as stable ID for magic-link users
          email,
          name: email.split('@')[0],
        };
      },
    }),
  ],

  secret: process.env.AUTH_SECRET,
  trustHost: true,

  callbacks: {
    async signIn({ user }) {
      await upsertUser({ id: user.id!, email: user.email, name: user.name });
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.plan = (user as any).plan ?? 'free';
      }
      if (token.id) {
        try {
          const updatedUser = await fetchFromServiceAPI('/user/status', {
            method: 'POST',
            body: JSON.stringify({ userId: token.id }),
          });
          if (updatedUser?.plan) token.plan = updatedUser.plan;
        } catch (e) {
          console.error('JWT sync failed:', e);
        }
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id;
      session.user.plan = token.plan ?? 'free';
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);