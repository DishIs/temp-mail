import NextAuth, { type NextAuthOptions } from 'next-auth';
import type { DefaultSession, User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import { fetchFromServiceAPI } from '@/lib/api';

export const runtime = 'edge'; // Cloudflare mode

// --------------------
// Types
// --------------------
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

// --------------------
// Helpers
// --------------------
async function upsertUser(profile: {
    id: string;
    email?: string | null;
    name?: string | null;
}) {
    try {
        await fetchFromServiceAPI('/auth/upsert-user', {
            method: 'POST',
            body: JSON.stringify({
                wyiUserId: profile.id,
                email: profile.email,
                name: profile.name,
                plan: 'free',
            }),
        });
    } catch (e) {
        console.error('Upsert failed:', e);
    }
}

// --------------------
// Providers (Cloudflare safe)
// --------------------
const GoogleCFProvider = {
    id: 'google',
    name: 'Google',
    type: 'oauth',

    authorization: {
        url: 'https://accounts.google.com/o/oauth2/v2/auth',
        params: {
            scope: 'openid email profile',
            response_type: 'code',
        },
    },

    token: {
        async request(context: any) {
            const body = new URLSearchParams({
                code: context.params.code,
                client_id: context.provider.clientId,
                client_secret: context.provider.clientSecret,
                redirect_uri: context.provider.callbackUrl,
                grant_type: 'authorization_code',
            });

            const res = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body,
            });

            const tokens = await res.json();
            if (!res.ok) throw new Error(tokens.error || 'Google token failed');
            return { tokens };
        },
    },

    userinfo: {
        async request({ tokens }: any) {
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: {
                    Authorization: `Bearer ${tokens.access_token}`,
                },
            });

            if (!res.ok) throw new Error('Google userinfo failed');
            return res.json();
        },
    },

    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,

    profile(profile: any): User {
        return {
            id: profile.sub,
            name: profile.name,
            email: profile.email,
            image: profile.picture,
            plan: 'free',
        };
    },
};

const GithubCFProvider = {
    id: 'github',
    name: 'GitHub',
    type: 'oauth',

    authorization: {
        url: 'https://github.com/login/oauth/authorize',
        params: { scope: 'read:user user:email' },
    },

    token: {
        async request(context: any) {
            const res = await fetch('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    client_id: context.provider.clientId,
                    client_secret: context.provider.clientSecret,
                    code: context.params.code,
                    redirect_uri: context.provider.callbackUrl,
                }),
            });

            const tokens = await res.json();
            if (!res.ok) throw new Error('GitHub token failed');
            return { tokens };
        },
    },

    userinfo: {
        async request({ tokens }: any) {
            const res = await fetch('https://api.github.com/user', {
                headers: {
                    Authorization: `Bearer ${tokens.access_token}`,
                    'User-Agent': 'cf-worker',
                },
            });

            const profile = await res.json();
            if (!res.ok) throw new Error('GitHub user failed');
            return profile;
        },
    },

    clientId: process.env.GITHUB_ID,
    clientSecret: process.env.GITHUB_SECRET,

    profile(profile: any): User {
        return {
            id: profile.id.toString(),
            name: profile.name || profile.login,
            email: profile.email,
            image: profile.avatar_url,
            plan: 'free',
        };
    },
};

// --------------------
// Auth Options
// --------------------
export const authOptions: NextAuthOptions = {
    session: { strategy: 'jwt' },

    providers: [
        // ---- WhatsYourInfo (already CF safe)
        {
            id: 'wyi',
            name: 'WhatsYourInfo',
            type: 'oauth',
            authorization: {
                url: 'https://whatsyour.info/oauth/authorize',
                params: { scope: 'profile:read email:read' },
            },
            token: {
                async request(context: any) {
                    const res = await fetch('https://whatsyour.info/api/v1/oauth/token', {
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

                    const tokens = await res.json();
                    if (!res.ok) throw new Error('WYI token failed');
                    return { tokens };
                },
            },
            userinfo: {
                async request({ tokens }: any) {
                    const res = await fetch('https://whatsyour.info/api/v1/me', {
                        headers: {
                            Authorization: `Bearer ${tokens.access_token}`,
                        },
                    });

                    if (!res.ok) throw new Error('WYI user failed');
                    return res.json();
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

        GoogleCFProvider,
        GithubCFProvider,
    ],

    callbacks: {
        async signIn({ user }) {
            await upsertUser(user);
            return true;
        },

        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.plan = user.plan || 'free';
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
                session.user.id = token.id as string;
                session.user.plan = token.plan as 'free' | 'pro';
            }
            return session;
        },
    },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
