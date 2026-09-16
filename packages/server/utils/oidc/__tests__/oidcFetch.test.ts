import oidcFetch from '../oidcFetch'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

test('serializes a URLSearchParams body to a string for the patched global fetch', async () => {
  const seen: RequestInit[] = []
  globalThis.fetch = (async (_input, init) => {
    seen.push(init ?? {})
    return new Response('{"ok":true}', {status: 200, headers: {'content-type': 'application/json'}})
  }) as typeof fetch
  const res = await oidcFetch('https://idp.example.com/token', {
    method: 'POST',
    headers: {'content-type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({grant_type: 'authorization_code', code: 'abc'}),
    redirect: 'manual',
    signal: new AbortController().signal
  })
  expect(seen[0]?.body).toBe('grant_type=authorization_code&code=abc')
  expect(res).toBeInstanceOf(Response)
  expect(res.status).toBe(200)
  expect(await res.json()).toEqual({ok: true})
})

test('passes a string body through unchanged', async () => {
  const seen: RequestInit[] = []
  globalThis.fetch = (async (_input, init) => {
    seen.push(init ?? {})
    return new Response(null, {status: 200})
  }) as typeof fetch
  await oidcFetch('https://idp.example.com/x', {
    method: 'POST',
    headers: {},
    body: 'a=1',
    redirect: 'manual',
    signal: new AbortController().signal
  })
  expect(seen[0]?.body).toBe('a=1')
})
