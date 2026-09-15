import * as client from 'openid-client'
import type {OIDCEnv} from './getOIDCEnv'

let configPromise: Promise<client.Configuration> | null = null

export const getOIDCClientConfig = (env: OIDCEnv) => {
  if (!configPromise) {
    configPromise = client
      .discovery(new URL(env.issuer), env.clientId, env.clientSecret)
      .catch((error) => {
        configPromise = null
        throw error
      })
  }
  return configPromise
}
