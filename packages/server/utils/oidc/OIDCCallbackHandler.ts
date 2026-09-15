import type {HttpRequest, HttpResponse} from 'uWebSockets.js'
import * as client from 'openid-client'
import {getNewDataLoader} from '../../dataloader/getNewDataLoader'
import uWSAsyncHandler from '../../graphql/uWSAsyncHandler'
import {createCookieHeaders} from '../authCookie'
import {Logger} from '../Logger'
import {getOIDCClientConfig} from './getOIDCClientConfig'
import {getOIDCEnv} from './getOIDCEnv'
import {extractGroups, isGroupAllowed} from './oidcGroups'
import {clearOIDCStateCookieHeader, parseOIDCStateCookie} from './oidcStateCookie'
import {type OIDCUserError, resolveOIDCUser} from './resolveOIDCUser'

type OIDCError = OIDCUserError | 'invalid_state' | 'idp_error' | 'email_missing' | 'not_allowed'

const INVITATION_PATHS = ['/team-invitation/', '/invitation-link/']

const redirectOnError = (res: HttpResponse, error: OIDCError, returnTo?: string) => {
  const location = returnTo?.startsWith('/saml-redirect')
    ? `/saml-redirect?error=${error}`
    : `/?oidcError=${error}`
  res
    .writeStatus('302')
    .writeHeader('set-cookie', clearOIDCStateCookieHeader())
    .writeHeader('location', location)
    .end()
}

const pickString = (...values: unknown[]) =>
  values.find((value): value is string => typeof value === 'string' && value.length > 0)

const OIDCCallbackHandler = uWSAsyncHandler(async (res: HttpResponse, req: HttpRequest) => {
  const query = req.getQuery()
  const cookieHeader = req.getHeader('cookie')
  const env = getOIDCEnv()
  if (!env) {
    res.writeStatus('404').end()
    return
  }
  const stored = parseOIDCStateCookie(cookieHeader)
  if (!stored) {
    redirectOnError(res, 'invalid_state')
    return
  }

  let config: client.Configuration
  let tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
  try {
    config = await getOIDCClientConfig(env)
    tokens = await client.authorizationCodeGrant(config, new URL(`${env.redirectUri}?${query}`), {
      pkceCodeVerifier: stored.codeVerifier,
      expectedState: stored.state,
      expectedNonce: stored.nonce
    })
  } catch (error) {
    Logger.warn('OIDC token exchange failed', error)
    redirectOnError(res, 'idp_error', stored.returnTo)
    return
  }
  const claims = tokens.claims()
  if (!claims) {
    redirectOnError(res, 'idp_error', stored.returnTo)
    return
  }

  let userinfo: client.UserInfoResponse | undefined
  const needsUserInfo = Boolean(!claims.email || (env.groupsClaim && !(env.groupsClaim in claims)))
  if (needsUserInfo) {
    try {
      userinfo = await client.fetchUserInfo(config, tokens.access_token, claims.sub)
    } catch (error) {
      Logger.warn('OIDC userinfo request failed', error)
      redirectOnError(res, 'idp_error', stored.returnTo)
      return
    }
  }

  const email = pickString(claims.email, userinfo?.email)
  if (!email) {
    redirectOnError(res, 'email_missing', stored.returnTo)
    return
  }
  if (env.groupsClaim) {
    const groups = [
      ...extractGroups(claims, env.groupsClaim),
      ...extractGroups(userinfo, env.groupsClaim)
    ]
    if (!isGroupAllowed(groups, env.allowedGroups)) {
      redirectOnError(res, 'not_allowed', stored.returnTo)
      return
    }
  }

  const isOrganic = !INVITATION_PATHS.some((path) => stored.returnTo.startsWith(path))
  const dataLoader = getNewDataLoader('OIDCCallbackHandler')
  try {
    const result = await resolveOIDCUser(
      {
        sub: claims.sub,
        email,
        name: pickString(claims.name, userinfo?.name),
        preferredUsername: pickString(claims.preferred_username, userinfo?.preferred_username)
      },
      isOrganic,
      dataLoader
    )
    if ('error' in result) {
      redirectOnError(res, result.error, stored.returnTo)
      return
    }
    Logger.log(`OIDC login: ${result.isNewUser ? 'created' : 'signed in'} ${result.userId}`)
    const location = stored.returnTo.startsWith('/saml-redirect')
      ? `/saml-redirect?userId=${encodeURIComponent(result.userId)}&isNewUser=${result.isNewUser}`
      : stored.returnTo
    res.writeStatus('302')
    createCookieHeaders(result.authToken).forEach((header) => {
      res.writeHeader('set-cookie', header)
    })
    res
      .writeHeader('set-cookie', clearOIDCStateCookieHeader())
      .writeHeader('location', location)
      .end()
  } finally {
    dataLoader.dispose()
  }
})

export default OIDCCallbackHandler
