import {AuthIdentityTypeEnum} from '../../../client/types/constEnums'
import AuthIdentity from './AuthIdentity'

interface Input {
  isEmailVerified?: boolean
  id: string
}

export default class AuthIdentityOIDC extends AuthIdentity {
  type = 'OIDC' as const
  constructor(input: Input) {
    super({...input, type: AuthIdentityTypeEnum.OIDC})
  }
}
