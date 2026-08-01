const ASSET_PATH_PREFIX = '/assets/'

export async function onRequest(context) {
  const pathname = new URL(context.request.url).pathname
  if (!pathname.startsWith(ASSET_PATH_PREFIX)) return context.next()

  const response = await context.env.ASSETS.fetch(context.request)
  if (!isHtmlResponse(response)) return response

  return new Response(response.ok ? 'SKeyDB asset not found.' : 'SKeyDB asset service error.', {
    headers: {
      'cache-control': 'no-store',
      'content-type': 'text/plain; charset=utf-8',
      'x-content-type-options': 'nosniff',
    },
    status: response.ok ? 404 : response.status,
  })
}

function isHtmlResponse(response) {
  const contentType = response.headers.get('content-type')
  return contentType?.split(';', 1)[0]?.trim().toLowerCase() === 'text/html'
}
