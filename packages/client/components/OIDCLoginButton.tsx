import {Button} from '../ui/Button/Button'
import getOIDCReturnTo from '../utils/getOIDCReturnTo'

const OIDCLoginButton = () => {
  const href = `/oidc/login?returnTo=${encodeURIComponent(getOIDCReturnTo())}`
  return (
    <Button asChild variant='dialogPrimary' size='lg' className='mt-4 w-full'>
      <a href={href}>{window.__ACTION__.OIDC_BUTTON_LABEL}</a>
    </Button>
  )
}

export default OIDCLoginButton
