import type {HttpRequest, HttpResponse} from 'uWebSockets.js'
import * as client from 'openid-client'
import uWSAsyncHandler from '../../graphql/uWSAsyncHandler'
import {getOIDCClientConfig} from './getOIDCClientConfig'
import {getOIDCEnv} from './getOIDCEnv'
import {createOIDCStateCookieHeader, sanitizeReturnTo} from './oidcStateCookie'

const OIDCLoginHandler = uWSAsyncHandler(async (res: HttpResponse, req: HttpRequest) => {
  const returnTo = sanitizeReturnTo(new URLSearchParams(req.getQuery()).get('returnTo'))
  const env = getOIDCEnv()
  if (!env) {
    res.writeStatus('404').end()
    return
  }
  const config = await getOIDCClientConfig(env)
  const codeVerifier = client.randomPKCECodeVerifier()
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier)
  const state = client.randomState()
  const nonce = client.randomNonce()
  const authorizationUrl = client.buildAuthorizationUrl(config, {
    redirect_uri: env.redirectUri,
    scope: env.scopes,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
    nonce
  })
  res
    .writeStatus('302')
    .writeHeader('set-cookie', createOIDCStateCookieHeader({state, nonce, codeVerifier, returnTo}))
    .writeHeader('location', authorizationUrl.href)
    .end()
})

export default OIDCLoginHandler
