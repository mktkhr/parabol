import type {AuthIdentityOidcResolvers} from '../resolverTypes'

const AuthIdentityOIDC: AuthIdentityOidcResolvers = {
  __isTypeOf: ({type}) => type === 'OIDC'
}

export default AuthIdentityOIDC
