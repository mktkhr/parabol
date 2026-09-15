import {
  clearOIDCStateCookieHeader,
  createOIDCStateCookieHeader,
  parseOIDCStateCookie,
  sanitizeReturnTo
} from '../oidcStateCookie'

const state = {state: 's1', nonce: 'n1', codeVerifier: 'v1', returnTo: '/meetings'}

test('sanitizeReturnTo only allows same-origin absolute paths', () => {
  expect(sanitizeReturnTo('/team-invitation/abc')).toBe('/team-invitation/abc')
  expect(sanitizeReturnTo('//evil.example.com')).toBe('/meetings')
  expect(sanitizeReturnTo('https://evil.example.com')).toBe('/meetings')
  expect(sanitizeReturnTo('')).toBe('/meetings')
  expect(sanitizeReturnTo(null)).toBe('/meetings')
  expect(sanitizeReturnTo('/\\evil.example.com')).toBe('/meetings')
  expect(sanitizeReturnTo('/\\/evil.example.com')).toBe('/meetings')
  expect(sanitizeReturnTo('/x\r\nSet-Cookie: a=b')).toBe('/meetings')
  expect(sanitizeReturnTo('/x\nfoo')).toBe('/meetings')
  expect(sanitizeReturnTo('/a b')).toBe('/meetings')
  expect(sanitizeReturnTo('/team-invitation/abc?x=1#y')).toBe('/team-invitation/abc?x=1#y')
})

test('state survives a cookie round trip', () => {
  const header = createOIDCStateCookieHeader(state)
  expect(header).toContain('__Host-oidc=')
  expect(header).toContain('HttpOnly')
  expect(header).toContain('Secure')
  const cookieValue = header.split(';')[0]
  expect(parseOIDCStateCookie(cookieValue)).toEqual(state)
})

test('parse returns null for missing or malformed cookies', () => {
  expect(parseOIDCStateCookie(undefined)).toBeNull()
  expect(parseOIDCStateCookie('__Host-oidc=not-base64-json')).toBeNull()
  expect(parseOIDCStateCookie('other=1')).toBeNull()
})

test('clear header expires the cookie', () => {
  expect(clearOIDCStateCookieHeader()).toContain('__Host-oidc=;')
})
