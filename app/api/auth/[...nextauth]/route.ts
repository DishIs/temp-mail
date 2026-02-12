const AUTH_ORIGIN = process.env.AUTH_ORIGIN!;

// simple tunnel to Vercel auth
async function proxy(req: Request, params: { nextauth: string[] }) {
  const path = params?.nextauth?.join('/') || '';
  const search = new URL(req.url).search;

  const url = `${AUTH_ORIGIN}/api/auth/${path}${search}`;

  const res = await fetch(url, {
    method: req.method,
    headers: req.headers,
    body:
      req.method === 'GET' || req.method === 'HEAD'
        ? undefined
        : req.body,
    redirect: 'manual',
  });

  return new Response(res.body, {
    status: res.status,
    headers: res.headers,
  });
}

export async function GET(
  req: Request,
  { params }: { params: { nextauth: string[] } }
) {
  return proxy(req, params);
}

export async function POST(
  req: Request,
  { params }: { params: { nextauth: string[] } }
) {
  return proxy(req, params);
}
