// apps/web/app/api/health/route.ts
export async function GET(request: Request) {
  try {
    const backendHealthUrl = process.env.BACKEND_REST_API_BASE_URL + '/api/health';

    const backendResponse = await fetch(backendHealthUrl, {
      method: 'GET',
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.text();
      console.error('Backend health proxy error:', backendResponse.status, errorData);
      return new Response(errorData, {
        status: backendResponse.status,
        headers: { 'Content-Type': backendResponse.headers.get('Content-Type') || 'text/plain' },
      });
    }

    const data = await backendResponse.text();
    return new Response(data, {
      status: 200,
      headers: { 'Content-Type': backendResponse.headers.get('Content-Type') || 'text/plain' },
    });

  } catch (error) {
    console.error('API route /api/health (proxy) caught an exception:', error);
    return new Response('Internal server error in proxy', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}