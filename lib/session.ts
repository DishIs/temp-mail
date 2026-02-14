import { jwtDecrypt } from "jose";
import { hkdf } from "@panva/hkdf";
import { cookies } from "next/headers";

export interface SessionToken {
  id: string;
  email: string;
  name?: string;
  image?: string;
  plan?: string;
  sub?: string;
  iat?: number;
  exp?: number;
}

async function getDerivedEncryptionKey(secret: string): Promise<Uint8Array> {
  return hkdf(
    "sha256",
    secret,
    "",
    "NextAuth.js Generated Encryption Key",
    32
  );
}

function getSessionCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k, v.join("=")];
    })
  );
  return (
    cookies["__Secure-next-auth.session-token"] ||
    cookies["next-auth.session-token"] ||
    null
  );
}

async function decryptToken(token: string): Promise<SessionToken | null> {
  try {
    const secret = process.env.NEXTAUTH_SECRET!;
    const encryptionKey = await getDerivedEncryptionKey(secret);
    const { payload } = await jwtDecrypt(token, encryptionKey, {
      clockTolerance: 15,
    });
    return payload as unknown as SessionToken;
  } catch {
    return null;
  }
}

/** For API routes — pass the raw Request */
export async function getToken(req: Request): Promise<SessionToken | null> {
  const cookieHeader = req.headers.get("cookie");
  const token = getSessionCookie(cookieHeader);
  if (!token) return null;
  return decryptToken(token);
}

/** For Server Components — uses next/headers */
export async function getSession(): Promise<SessionToken | null> {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("__Secure-next-auth.session-token")?.value ||
    cookieStore.get("next-auth.session-token")?.value;
  if (!token) return null;
  return decryptToken(token);
}