import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
  const res = await fetch(`${backendUrl}/api/merchant/upload-document`, {
    method: 'POST',
    headers: {
      ...Object.fromEntries(req.headers.entries())
      // 不要手动设置Content-Type，否则boundary丢失
    },
    body: req.body,
    duplex: 'half'
  } as any);
  const data = await res.arrayBuffer();
  return new Response(data, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
  });
} 