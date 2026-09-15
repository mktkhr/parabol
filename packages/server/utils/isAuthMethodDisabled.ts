export type AuthMethod = 'INTERNAL' | 'GOOGLE' | 'MICROSOFT' | 'SSO'

export const isOIDCEnabled = () => !!process.env.OIDC_ISSUER

export const isAuthMethodDisabled = (method: AuthMethod) =>
  isOIDCEnabled() || process.env[`AUTH_${method}_DISABLED`] === 'true'
