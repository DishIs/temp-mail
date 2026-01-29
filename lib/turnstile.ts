export async function verifyTurnstileToken(token: string): Promise<boolean> {
  if (!token) return false;

  try {
    const formData = new FormData();
    formData.append('secret', process.env.TURNSTILE_SECRET_KEY || '');
    formData.append('response', token);

    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    const outcome = await result.json();
    return outcome.success;
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return false;
  }
}