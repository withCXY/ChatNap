import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
  const body = await req.text();
  const res = await fetch(`${backendUrl}/api/merchant/business-hours`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body
  });
  const data = await res.text();
  return new Response(data, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
} 