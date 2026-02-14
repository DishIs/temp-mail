"use client";

export async function signIn(provider: string, options?: { callbackUrl?: string }) {
  const callbackUrl = options?.callbackUrl ?? "/dashboard";

  // Step 1: Get CSRF token (next-auth requires this for the POST)
  const { csrfToken } = await fetch("/api/auth/csrf").then(r => r.json());

  // Step 2: POST to signin endpoint — next-auth responds with a redirect to the OAuth provider
  const res = await fetch(`/api/auth/signin/${provider}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      csrfToken,
      callbackUrl,
      json: "true", // tells next-auth to return JSON with the redirect URL instead of HTML
    }),
    redirect: "follow",
  });

  const data = await res.json();

  // Step 3: Redirect to the OAuth provider URL next-auth gives us
  if (data?.url) {
    window.location.href = data.url;
  }
}

export function signOut(options?: { callbackUrl?: string }) {
  const callbackUrl = options?.callbackUrl ?? "/";

  fetch("/api/auth/csrf")
    .then(r => r.json())
    .then(({ csrfToken }) => {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/api/auth/signout";

      const fields = { csrfToken, callbackUrl };
      for (const [name, value] of Object.entries(fields)) {
        const input = document.createElement("input");
        input.name = name;
        input.value = value;
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit();
    });
}