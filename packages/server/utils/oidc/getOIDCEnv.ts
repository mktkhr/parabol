import makeAppURL from '../../../client/utils/makeAppURL'
import appOrigin from '../../appOrigin'

export interface OIDCEnv {
  issuer: string
  clientId: string
  clientSecret: string
  scopes: string
  groupsClaim: string | null
  allowedGroups: string[]
  redirectUri: string
}

export const getOIDCEnv = (): OIDCEnv | null => {
  const {OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET} = process.env
  if (!OIDC_ISSUER || !OIDC_CLIENT_ID || !OIDC_CLIENT_SECRET) return null
  const allowedGroups = (process.env.OIDC_ALLOWED_GROUPS ?? '')
    .split(',')
    .map((group) => group.trim())
    .filter(Boolean)
  return {
    issuer: OIDC_ISSUER,
    clientId: OIDC_CLIENT_ID,
    clientSecret: OIDC_CLIENT_SECRET,
    scopes: process.env.OIDC_SCOPES || 'openid email profile',
    groupsClaim: process.env.OIDC_GROUPS_CLAIM || null,
    allowedGroups,
    redirectUri: makeAppURL(appOrigin, 'oidc/callback')
  }
}
