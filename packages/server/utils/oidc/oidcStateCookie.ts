import {type CookieListItem, getCookieString, parse} from '@whatwg-node/cookie-store'

export interface OIDCState {
  state: string
  nonce: string
  codeVerifier: string
  returnTo: string
}

const COOKIE_NAME = '__Host-oidc'
const COOKIE_LIFESPAN_MS = 10 * 60 * 1000
const DEFAULT_RETURN_TO = '/meetings'

export const sanitizeReturnTo = (raw: string | null | undefined) =>
  raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : DEFAULT_RETURN_TO

const buildCookie = (value: string, expires: number) =>
  getCookieString({
    name: COOKIE_NAME,
    value,
    expires,
    domain: null,
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: true
  } as CookieListItem)

export const createOIDCStateCookieHeader = (state: OIDCState) =>
  buildCookie(
    Buffer.from(JSON.stringify(state)).toString('base64url'),
    Date.now() + COOKIE_LIFESPAN_MS
  )

export const clearOIDCStateCookieHeader = () => buildCookie('', Date.now())

export const parseOIDCStateCookie = (cookieHeader: string | undefined): OIDCState | null => {
  const value = parse(cookieHeader || '').get(COOKIE_NAME)?.value
  if (!value) return null
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString()) as Partial<OIDCState>
    const {state, nonce, codeVerifier, returnTo} = parsed
    if (!state || !nonce || !codeVerifier || !returnTo) return null
    return {state, nonce, codeVerifier, returnTo: sanitizeReturnTo(returnTo)}
  } catch {
    return null
  }
}
