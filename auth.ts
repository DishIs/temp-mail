// auth.ts
import NextAuth, { type DefaultSession, type NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import type { OAuthConfig } from 'next-auth/providers';
// ✅ Fix 1: import JWT type first so TS can resolve the module before augmentation
import type { JWT } from 'next-auth/jwt';
import { fetchFromServiceAPI } from '@/lib/api';

// ─── Type Augmentation ────────────────────────────────────────────────────────

interface WYIProfile {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  isProUser: boolean;
  username: string;
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      plan: 'free' | 'pro';
    } & DefaultSession['user'];
  }
  interface User {
    plan?: 'free' | 'pro';
  }
}

// ✅ Fix 1 (cont): now this augmentation works because JWT was imported above
declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    plan: 'free' | 'pro';
  }
}

// ─── Helper Types for Custom Provider Contexts ───────────────────────────────
// ✅ Fix 2: explicit types for request() contexts so they're not implicitly any

interface TokenRequestContext {
  params: Record<string, string | undefined>;
  provider: {
    callbackUrl: string;
    clientId?: string;
    clientSecret?: string;
  };
}

interface UserinfoRequestContext {
  tokens: {
    access_token?: string;
  };
}

// ─── Backend Helper ───────────────────────────────────────────────────────────

async function upsertUser(user: { id: string; email?: string | null; name?: string | null }) {
  // GitHub users often have no public name; fall back to the local part of their
  // email, then to their provider ID so the server-side required check always passes.
  const resolvedName =
    user.name?.trim() ||
    user.email?.split('@')[0] ||
    user.id;

  // Same guard for email — some GitHub users expose no verified email.
  const resolvedEmail = user.email?.trim() || `${user.id}@provider.noemail`;

  try {
    await fetchFromServiceAPI('/auth/upsert-user', {
      method: 'POST',
      body: JSON.stringify({
        wyiUserId: user.id,
        email: resolvedEmail,
        name: resolvedName,
        plan: 'free',
      }),
    });
  } catch (e) {
    console.error('Upsert failed:', e);
  }
}

// ─── Auth Config ──────────────────────────────────────────────────────────────

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
      profile(profile, tokens) {
        return {
          id: String(profile.id),
          name: profile.name ?? profile.login, // login is always present
          email: profile.email,                // now populated by the scope
          image: profile.avatar_url,
        };
      },
    })
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
        token.plan = user.plan ?? 'free';
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