import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
  const res = await fetch(`${backendUrl}/api/business-info`);
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
