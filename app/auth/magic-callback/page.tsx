import { redirect } from 'next/navigation';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { signIn } from '@/auth';
import { AutoSubmitForm } from './auto-submit-form';

interface Props {
  searchParams: Promise<{ code?: string }>;
}

export default async function MagicCallbackPage({ searchParams }: Props) {
  const { code } = await searchParams;
  if (!code) redirect('/auth?error=missing');

  const ctx = await getCloudflareContext<{ AUTH_KV: KVNamespace }>();
  const kv = ctx.env.AUTH_KV;

  const email = await kv.get(`magic:exchange:${code}`);
  if (!email) redirect('/auth?error=expired');

  // ✅ Server Action — this is where cookies can be written
  async function completeSignIn() {
    'use server';
    const ctx2 = await getCloudflareContext<{ AUTH_KV: KVNamespace }>();
    const kv2 = ctx2.env.AUTH_KV;

    const verifiedEmail = await kv2.get(`magic:exchange:${code}`);
    if (!verifiedEmail) redirect('/auth?error=expired');

    await kv2.delete(`magic:exchange:${code}`);

    await signIn('magic-link', {
      email: verifiedEmail,
      magicVerified: 'true',
      redirectTo: '/dashboard',
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 text-muted-foreground text-sm">
        {/* Hidden form — auto-submitted by the client component below */}
        <AutoSubmitForm action={completeSignIn} />
        <p>Signing you in…</p>
      </div>
    </div>
  );
}