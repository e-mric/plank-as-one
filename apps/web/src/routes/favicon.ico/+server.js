export const prerender = true;

export function GET() {
  return new Response(null, {
    status: 307,
    headers: {
      location: '/favicon.svg',
      'cache-control': 'public, max-age=86400',
    },
  });
}
