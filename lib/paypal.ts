// lib/paypal.ts
const PAYPAL_API = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const SECRET = process.env.PAYPAL_CLIENT_SECRET;

export async function getPayPalAccessToken() {
  const auth = Buffer.from(`${CLIENT_ID}:${SECRET}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const data = await response.json();
  return data.access_token;
}

export const PAYPAL_PLANS = {
  weekly: process.env.PAYPAL_PLAN_ID_WEEKLY,
  monthly: process.env.PAYPAL_PLAN_ID_MONTHLY,
  yearly: process.env.PAYPAL_PLAN_ID_YEARLY,
};