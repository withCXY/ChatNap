import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
    
    // 直接转发 FormData
    const formData = await req.formData();
    
    const res = await fetch(`${backendUrl}/api/portfolio/upload`, {
      method: 'POST',
      body: formData  // 直接发送 FormData，不设置 Content-Type
    });
    
    const data = await res.json();
    
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Portfolio upload error:', error);
    return new Response(JSON.stringify({ error: 'Upload failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 