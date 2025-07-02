import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
  const url = new URL(req.url);
  const user_id = url.searchParams.get('user_id');
  const session_id = url.searchParams.get('session_id');
  let query = '';
  if (user_id) query = `?user_id=${encodeURIComponent(user_id)}`;
  else if (session_id) query = `?session_id=${encodeURIComponent(session_id)}`;
  const res = await fetch(`${backendUrl}/api/chat-history${query}`);
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req: NextRequest) {
  const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
  const body = await req.json();
  const res = await fetch(`${backendUrl}/api/chat-history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
} 