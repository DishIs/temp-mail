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
  try {
    await fetchFromServiceAPI('/auth/upsert-user', {
      method: 'POST',
      body: JSON.stringify({
        wyiUserId: user.id,
        email: user.email,
        name: user.name,
        plan: 'free',
      }),
    });
  } catch (e) {
    console.error('Upsert failed:', e);
  }
}

// ─── Custom WYI Provider ──────────────────────────────────────────────────────

const WYIProvider: OAuthConfig<WYIProfile> = {
  id: 'wyi',
  name: 'WhatsYourInfo',
  type: 'oauth',
  authorization: {
    url: 'https://whatsyour.info/oauth/authorize',
    params: { scope: 'profile:read email:read' },
  },
  token: {
    url: 'https://whatsyour.info/api/v1/oauth/token',
    // ✅ Fix 2: explicit context type
    async request(context: TokenRequestContext) {
      const response = await fetch('https://whatsyour.info/api/v1/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code: context.params.code,
          redirect_uri: context.provider.callbackUrl,
          client_id: context.provider.clientId,
          client_secret: context.provider.clientSecret,
        }),
      });
      const tokens = await response.json();
      if (!response.ok) throw new Error(tokens.error_description || 'Token request failed');
      return { tokens };
    },
  },
  userinfo: {
    url: 'https://whatsyour.info/api/v1/me',
    // ✅ Fix 2: explicit context type
    async request(context: UserinfoRequestContext) {
      const response = await fetch('https://whatsyour.info/api/v1/me', {
        headers: {
          Authorization: `Bearer ${context.tokens.access_token}`,
          'User-Agent': 'freecustom-email-app',
        },
      });
      if (!response.ok) throw new Error(await response.text());
      return await response.json();
    },
  },
  clientId: process.env.WYI_CLIENT_ID,
  clientSecret: process.env.WYI_CLIENT_SECRET,
  profile(profile: WYIProfile) {
    return {
      // ✅ Fix 3: profile._id is string per our interface, but TS sees JSON as
      // unknown — String() cast guarantees the id field is always a string
      id: String(profile._id),
      name: `${profile.firstName} ${profile.lastName}`.trim(),
      email: profile.email,
      image: `https://whatsyour.info/api/v1/avatar/${profile.username}`,
      plan: 'free' as const,
    };
  },
};

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
    }),
    WYIProvider,
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