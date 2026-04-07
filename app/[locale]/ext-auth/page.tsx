import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ExtAuthClient } from "./ext-auth-client";
import { SignJWT } from "jose";

export default async function ExtAuthPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/api/auth/signin?callbackUrl=/ext-auth");
  }

  const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET);
  const plan = session.user.plan || "free";

  const extToken = await new SignJWT({ 
    userId: session.user.id, 
    id: session.user.id, // For compatibility
    plan, 
    isExtension: true 
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d") // Extension token valid for 30 days
    .sign(jwtSecret);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
      <ExtAuthClient extToken={extToken} />
    </div>
  );
}
