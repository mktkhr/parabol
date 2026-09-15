import {rule} from 'graphql-shield'
import {type AuthMethod, isAuthMethodDisabled} from '../../../utils/isAuthMethodDisabled'

const isAuthMethodEnabled = (method: AuthMethod) =>
  rule(`isAuthMethodEnabled-${method}`, {cache: 'contextual'})(() => {
    return isAuthMethodDisabled(method) ? new Error(`AUTH_${method} is disabled`) : true
  })

export default isAuthMethodEnabled
