import {useLocation} from 'react-router'
import StyledError from './StyledError'

const ERROR_COPY: Record<string, string> = {
  not_allowed: 'Your account is not allowed to access this workspace',
  email_missing: 'Your identity provider did not share an email address',
  squatter: 'An unverified account already exists for this email. Contact your administrator',
  email_too_long: 'Email is too long',
  invalid_state: 'Login session expired. Please try again',
  idp_error: 'Error signing in. Please try again'
}

const OIDCErrorMessage = () => {
  const {search} = useLocation()
  const code = new URLSearchParams(search).get('oidcError')
  if (!code) return null
  return <StyledError>{ERROR_COPY[code] ?? ERROR_COPY.idp_error}</StyledError>
}

export default OIDCErrorMessage
