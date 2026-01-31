// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from 'next-auth';
import type { DefaultSession, User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import { fetchFromServiceAPI } from '@/lib/api';

// --------------------
// 1️⃣ Custom Profile Type
// --------------------
interface WYIProfile {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    isProUser: boolean;
    username: string;
}

// --------------------
// 2️⃣ Module Augmentation
// --------------------
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
// 3️⃣ Helper: Upsert User in Backend
// --------------------
async function upsertUserInBackend(profile: WYIProfile): Promise<void> {
    try {
        await fetchFromServiceAPI('/auth/upsert-user', {
            method: 'POST',
            body: JSON.stringify({
                wyiUserId: profile._id,
                email: profile.email,
                name: `${profile.firstName} ${profile.lastName}`.trim(),
                plan: 'free',
            }),
        });
    } catch (error) {
        console.error("Failed to upsert user in backend:", error);
        // Don't throw here, allow login to proceed even if sync fails momentarily
    }
}

// --------------------
// 4️⃣ Auth Options
// --------------------
export const authOptions: NextAuthOptions = {
    session: {
        strategy: 'jwt',
    },
    providers: [
        // 🔹 1. WhatsYourInfo
        {
            id: 'wyi',
            name: 'WhatsYourInfo',
            type: 'oauth',
            authorization: {
                url: "https://whatsyour.info/oauth/authorize",
                params: { scope: "profile:read email:read" },
            },
            token: {
                url: "https://whatsyour.info/api/v1/oauth/token",
                async request(context) {
                    const response = await fetch("https://whatsyour.info/api/v1/oauth/token", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            grant_type: "authorization_code",
                            code: context.params.code,
                            redirect_uri: context.provider.callbackUrl,
                            client_id: context.provider.clientId,
                            client_secret: context.provider.clientSecret,
                        }),
                    });
                    const tokens = await response.json();
                    if (!response.ok) throw new Error(tokens.error_description || "Token request failed");
                    return { tokens };
                },
            },
            userinfo: {
                url: "https://whatsyour.info/api/v1/me",
                async request(context) {
                    const { tokens } = context;
                    const response = await fetch("https://whatsyour.info/api/v1/me", {
                        headers: {
                            Authorization: `Bearer ${tokens.access_token}`,
                            "User-Agent": "freecustom-email-app",
                        }
                    });
                    if (!response.ok) throw new Error(await response.text());
                    return await response.json();
                }
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
        // 🔹 2. Google
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            profile(profile) {
                return {
                    id: profile.sub,
                    name: profile.name,
                    email: profile.email,
                    image: profile.picture,
                    plan: 'free',
                };
            },
        }),
        // 🔹 3. GitHub
        GithubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
            profile(profile) {
                return {
                    id: profile.id.toString(),
                    name: profile.name || profile.login,
                    email: profile.email,
                    image: profile.avatar_url,
                    plan: 'free',
                };
            },
        }),
    ],
    callbacks: {
        async signIn({ account, profile }) {
            if (account?.provider === 'wyi' && profile) {
                await upsertUserInBackend(profile as WYIProfile);
            }
            return true;
        },

        async jwt({ token, user, trigger }) {
            // 1. Initial Sign In: Set defaults
            if (user) {
                token.id = user.id;
                token.plan = user.plan || 'free';
            }

            // 2. TRIGGER UPDATE: Securely fetch latest plan from backend
            // This runs when the client calls update() or when we force a refresh
            if (trigger === "update" && token.id) {
                try {
                    // Fetch the user's latest status from your backend service
                    // Adjust endpoint '/user/status' to whatever your backend uses to get user details
                    const updatedUser = await fetchFromServiceAPI('/user/status', {
                        method: 'POST',
                        body: JSON.stringify({ userId: token.id })
                    });

                    // If backend confirms they are pro, update the token immediately
                    if (updatedUser && updatedUser.plan) {
                        token.plan = updatedUser.plan;
                    }
                } catch (error) {
                    console.error("Failed to refresh user plan from backend:", error);
                    // On error, we keep the existing token.plan to prevent locking them out
                }
            }

            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id;
                session.user.plan = token.plan;
            }
            return session;
        },
    },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };