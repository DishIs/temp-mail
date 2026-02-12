// lib/blog-client.ts

import { DITBlogsClient } from '@dishistech/blogs-sdk';

const globalForClient = globalThis as unknown as {
  ditBlogsClient?: DITBlogsClient;
};

const apiKey = process.env.DITBLOGS_API_KEY;

// no key → don't crash the worker, just complain loudly
if (!apiKey) {
  console.error("DITBLOGS_API_KEY is missing (Cloudflare env?)");
}

export const blogClient =
  globalForClient.ditBlogsClient ??
  (apiKey ? new DITBlogsClient(apiKey) : (null as any));

if (process.env.NODE_ENV !== 'production' && apiKey) {
  globalForClient.ditBlogsClient = blogClient;
}
