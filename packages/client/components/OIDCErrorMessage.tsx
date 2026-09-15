import {useLocation} from 'react-router'
import StyledError from './StyledError'

type OIDCErrorCode =
  | 'not_allowed'
  | 'email_missing'
  | 'email_unverified'
  | 'squatter'
  | 'email_too_long'
  | 'invalid_state'
  | 'idp_error'

const ERROR_COPY: Record<OIDCErrorCode, string> = {
  not_allowed: 'Your account is not allowed to access this workspace',
  email_missing: 'Your identity provider did not share an email address',
  email_unverified: 'Your identity provider reports this email as unverified',
  squatter: 'An unverified account already exists for this email. Contact your administrator',
  email_too_long: 'Email is too long',
  invalid_state: 'Login session expired. Please try again',
  idp_error: 'Error signing in. Please try again'
}

const OIDCErrorMessage = () => {
  const {search} = useLocation()
  const code = new URLSearchParams(search).get('oidcError')
  if (!code) return null
  const copy = Object.hasOwn(ERROR_COPY, code)
    ? ERROR_COPY[code as OIDCErrorCode]
    : ERROR_COPY.idp_error
  return <StyledError>{copy}</StyledError>
}

export default OIDCErrorMessage
