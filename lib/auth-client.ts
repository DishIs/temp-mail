"use client";

export function signIn(provider: string, options?: { callbackUrl?: string }) {
  const callbackUrl = options?.callbackUrl ?? "/dashboard";

  window.location.href =
    `/api/auth/signin/${provider}?callbackUrl=${encodeURIComponent(callbackUrl)}`;
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