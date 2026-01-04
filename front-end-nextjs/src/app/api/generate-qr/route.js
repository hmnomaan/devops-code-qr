import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request) {
  // Accept either JSON body { url } or ?url=... query param
  let url;
  try {
    const body = await request.json().catch(() => null);
    if (body && body.url) url = body.url;
  } catch (e) {}

  if (!url) {
    const { searchParams } = new URL(request.url);
    url = searchParams.get('url');
  }

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  const backend = process.env.QR_API_URL || 'http://localhost:8000';

  try {
    const response = await axios.post(
      `${backend.replace(/\/+$/,'')}/generate-qr/`,
      { url: String(url) },
      { timeout: 10000 }
    );
    return NextResponse.json(response.data, { status: response.status });
  } catch (err) {
    if (err.response) {
      return NextResponse.json(err.response.data || { error: 'Backend error' }, { status: err.response.status || 502 });
    }
    console.error('Error generating QR Code:', err?.message || err);
    return NextResponse.json({ error: 'Failed to generate QR Code' }, { status: 500 });
  }
}