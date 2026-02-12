import NextAuth, { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GithubProvider from 'next-auth/providers/github';

export const runtime = 'nodejs';

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

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],

  cookies: {
    sessionToken: {
      name: "__Secure-next-auth.session-token",
      options: {
        domain: ".yourdomain.com",
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: true,
      },
    },
  },

  callbacks: {
    async signIn({ user }) {
      await upsertUser(user);
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.plan = 'free';
      }

      if (token.id) {
        try {
          const updatedUser = await fetchFromServiceAPI('/user/status', {
            method: 'POST',
            body: JSON.stringify({ userId: token.id }),
          });

          if (updatedUser?.plan) {
            token.plan = updatedUser.plan;
          }
        } catch (e) {
          console.error('JWT sync failed:', e);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).plan = token.plan || 'free';
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
