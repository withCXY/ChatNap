import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const merchant_email = searchParams.get('merchant_email');
  
  if (!merchant_email) {
    return new Response(JSON.stringify({ error: 'merchant_email is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
  const res = await fetch(`${backendUrl}/api/portfolio?merchant_email=${encodeURIComponent(merchant_email)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
} 