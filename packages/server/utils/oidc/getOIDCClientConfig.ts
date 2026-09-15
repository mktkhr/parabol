import * as client from 'openid-client'
import type {OIDCEnv} from './getOIDCEnv'
import oidcFetch from './oidcFetch'

let configPromise: Promise<client.Configuration> | null = null

export const getOIDCClientConfig = (env: OIDCEnv) => {
  if (!configPromise) {
    configPromise = client
      .discovery(new URL(env.issuer), env.clientId, env.clientSecret, undefined, {
        [client.customFetch]: oidcFetch
      })
      .then((config) => {
        config[client.customFetch] = oidcFetch
        return config
      })
      .catch((error) => {
        configPromise = null
        throw error
      })
  }
  return configPromise
}
