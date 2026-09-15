export type AuthMethod = 'INTERNAL' | 'GOOGLE' | 'MICROSOFT' | 'SSO'

export const isOIDCEnabled = () =>
  !!(process.env.OIDC_ISSUER && process.env.OIDC_CLIENT_ID && process.env.OIDC_CLIENT_SECRET)

export const isAuthMethodDisabled = (method: AuthMethod) =>
  isOIDCEnabled() || process.env[`AUTH_${method}_DISABLED`] === 'true'
