import getValidRedirectParam from './getValidRedirectParam'

const AUTH_PATHNAMES = ['/', '/signin', '/create-account']

const getOIDCReturnTo = () => {
  const redirectTo = getValidRedirectParam()
  if (redirectTo) return redirectTo
  const {pathname} = window.location
  return AUTH_PATHNAMES.includes(pathname) ? '/meetings' : pathname
}

export default getOIDCReturnTo
