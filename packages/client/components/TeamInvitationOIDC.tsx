import useDocumentTitle from '../hooks/useDocumentTitle'
import DialogContent from './DialogContent'
import DialogTitle from './DialogTitle'
import InvitationDialogCopy from './InvitationDialogCopy'
import InviteDialog from './InviteDialog'
import OIDCErrorMessage from './OIDCErrorMessage'
import OIDCLoginButton from './OIDCLoginButton'

const TeamInvitationOIDC = () => {
  useDocumentTitle('SSO Login | Team Invitation', 'Team Invitation')
  return (
    <InviteDialog>
      <DialogTitle>SSO Login</DialogTitle>
      <DialogContent>
        <InvitationDialogCopy>
          Log in with your identity provider to join the team
        </InvitationDialogCopy>
        <OIDCErrorMessage />
        <OIDCLoginButton />
      </DialogContent>
    </InviteDialog>
  )
}

export default TeamInvitationOIDC
