import type {CustomFetchOptions} from 'openid-client'

const oidcFetch = async (url: string, options: CustomFetchOptions) => {
  const upstream = await fetch(url, {
    method: options.method,
    headers: options.headers,
    body:
      options.body instanceof URLSearchParams
        ? options.body.toString()
        : (options.body as BodyInit | null | undefined),
    redirect: options.redirect,
    signal: options.signal
  })
  return new Response(await upstream.arrayBuffer(), {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: new Headers([...upstream.headers.entries()])
  })
}

export default oidcFetch
