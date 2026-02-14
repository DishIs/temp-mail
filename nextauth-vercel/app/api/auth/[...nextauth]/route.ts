import NextAuth, { DefaultSession, User, type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GithubProvider from 'next-auth/providers/github';

export const runtime = 'nodejs';

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
    id: string;
    plan: 'free' | 'pro';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    plan: 'free' | 'pro';
  }
}

// ---- Backend helper
async function fetchFromServiceAPI(path: string, options: RequestInit = {}) {
  const url = `${process.env.SERVICE_API_URL}${path}`;

  // Securely add the internal API key to the request headers.
  const headers = {
    'Content-Type': 'application/json',
    'x-internal-api-key': process.env.INTERNAL_API_KEY!,
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });

    // Handle non-ok responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'An unknown API error occurred.' }));
      // Re-throw an error with a message from the service API if available
      throw new Error(errorData.message || `Service API request failed with status ${response.status}`);
    }

    // Handle successful but empty responses (e.g., for a DELETE request)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return { success: true };
    }

    return await response.json();
  } catch (error) {
    console.error(`Service API fetch error for path ${path}:`, error);
    // Ensure we always throw an Error object
    throw error instanceof Error ? error : new Error('A network or parsing error occurred.');
  }
}
async function upsertUser(user: {
  id: string;
  email?: string | null;
  name?: string | null;
}) {
  try {
    await fetchFromServiceAPI("/auth/upsert-user", {
      method: "POST",
      body: JSON.stringify({
        wyiUserId: user.id,
        email: user.email,
        name: user.name,
        plan: "free",
      }),
    });
  } catch (e) {
    console.error("Upsert failed:", e);
  }
}

// ---- keep this NOT exported
const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    {
      id: 'wyi',
      name: 'WhatsYourInfo',
      type: 'oauth',
      authorization: {
        url: 'https://whatsyour.info/oauth/authorize',
        params: { scope: 'profile:read email:read' },
      },
      token: {
        url: 'https://whatsyour.info/api/v1/oauth/token',
        async request(context) {
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
        async request(context) {
          const { tokens } = context;
          const response = await fetch('https://whatsyour.info/api/v1/me', {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
              'User-Agent': 'freecustom-email-app',
            },
          });
          if (!response.ok) throw new Error(await response.text());
          return await response.json();
        },
      },
      clientId: process.env.WYI_CLIENT_ID,
      clientSecret: process.env.WYI_CLIENT_SECRET,
      profile(profile: WYIProfile): User {
        return {
          id: profile._id,
          name: `${profile.firstName} ${profile.lastName}`.trim(),
          email: profile.email,
          image: `https://whatsyour.info/api/v1/avatar/${profile.username}`,
          plan: 'free',
        };
      },
    },

  ],

  cookies: {
    sessionToken: {
      name: "__Secure-next-auth.session-token",
      options: {
        domain: ".freecustom.email",
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: true,
      },
    },
    state: {
      name: "__Secure-next-auth.state",
      options: {
        domain: ".freecustom.email",
        path: "/",
        sameSite: "lax",
        secure: true,
        httpOnly: true,
      },
    },
  },


  callbacks: {
    async signIn({ user }) {
      await upsertUser(user);
      return true;
    },

    async redirect({ url, baseUrl }) {
      // Allow internal callbackUrl
      if (url.startsWith("https://www.freecustom.email")) return url;

      return "https://www.freecustom.email";
    },


    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.plan = "free";
      }

      if (token.id) {
        try {
          const updatedUser = await fetchFromServiceAPI("/user/status", {
            method: "POST",
            body: JSON.stringify({ userId: token.id }),
          });

          if (updatedUser?.plan) {
            token.plan = updatedUser.plan;
          }
        } catch (e) {
          console.error("JWT sync failed:", e);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).plan = token.plan || "free";
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
