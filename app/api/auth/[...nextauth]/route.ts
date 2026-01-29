// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from 'next-auth';
import type { DefaultSession, User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import GoogleProvider from "next-auth/providers/google"; // ➕ Added
import GithubProvider from "next-auth/providers/github"; // ➕ Added
import EmailProvider from "next-auth/providers/email";   // ➕ Added
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
// 2️⃣ Module Augmentation for NextAuth Types
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
        throw new Error("Could not sync user with backend.");
    }
}

// --------------------
// 4️⃣ Auth Options with Strict Typing
// --------------------
export const authOptions: NextAuthOptions = {
    session: {
        strategy: 'jwt',
    },
    providers: [
        // 🔹 1. WhatsYourInfo (Existing)
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
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            grant_type: "authorization_code",
                            code: context.params.code,
                            redirect_uri: context.provider.callbackUrl,
                            client_id: context.provider.clientId,
                            client_secret: context.provider.clientSecret,
                        }),
                    });

                    const tokens = await response.json();
                    if (!response.ok) {
                        console.error("Token request failed:", tokens);
                        throw new Error(tokens.error_description || "Token request failed");
                    }
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

                    if (!response.ok) {
                        const text = await response.text();
                        throw new Error(`Userinfo request failed: ${text}`);
                    }

                    const profile: WYIProfile = await response.json();
                    return profile;
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
        // 🔹 2. Google Provider (New)
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            profile(profile) {
                return {
                    id: profile.sub,
                    name: profile.name,
                    email: profile.email,
                    image: profile.picture,
                    plan: 'free', // Default plan for Google users
                };
            },
        }),
        // 🔹 3. GitHub Provider (New)
        GithubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
            profile(profile) {
                return {
                    id: profile.id.toString(),
                    name: profile.name || profile.login,
                    email: profile.email,
                    image: profile.avatar_url,
                    plan: 'free', // Default plan for GitHub users
                };
            },
        }),
        // 🔹 4. Magic Link / Email (New)
        EmailProvider({
            server: {
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT || 587,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD
                }
            },
            from: process.env.EMAIL_FROM
            // Note: Since EmailProvider creates a user dynamically, 
            // the `plan` defaults are handled in the JWT callback below.
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            // 🛑 Logic to Block Specific Temp Mail Domains for Magic Link
            if (account?.provider === 'email' && user.email) {
                const blockedDomains = [
                    // TODO: Add your own temp mail domains here
                    "areueally.info", "ditapi.info",
                    "ditcloud.info", "ditdrive.info", "ditgame.info", "ditlearn.info",
                    "ditpay.info", "ditplay.info", "ditube.info", "junkstopper.info"
                ];

                const emailDomain = user.email.split('@')[1];
                if (blockedDomains.includes(emailDomain)) {
                    return false; // Blocks sign-in
                }
            }

            // ✅ Existing Logic for WYI Backend Sync
            if (account?.provider === 'wyi' && profile) {
                try {
                    await upsertUserInBackend(profile as WYIProfile);
                    return true;
                } catch (error) {
                    console.error("Sign-in aborted due to backend error:", error);
                    return false;
                }
            }
            return true;
        },

        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                // Use user.plan if available (WYI/Google/GitHub), otherwise default to 'free' (Email)
                token.plan = user.plan || 'free';
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

// --------------------
// 5️⃣ Export Handler
// --------------------
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };