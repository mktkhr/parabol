import {AuthIdentityTypeEnum} from '../../../client/types/constEnums'
import AuthIdentityOIDC from '../../database/types/AuthIdentityOIDC'
import AuthToken from '../../database/types/AuthToken'
import User from '../../database/types/User'
import generateUID from '../../generateUID'
import type {DataLoaderWorker} from '../../graphql/graphql'
import bootstrapNewUser from '../../graphql/mutations/helpers/bootstrapNewUser'
import {generateIdenticon} from '../../graphql/private/mutations/helpers/generateIdenticon'
import {USER_PREFERRED_NAME_LIMIT} from '../../postgres/constants'
import {getUserByEmail} from '../../postgres/queries/getUsersByEmails'
import updateUser from '../../postgres/queries/updateUser'

export interface OIDCProfile {
  sub: string
  email: string
  name?: string
  preferredUsername?: string
  emailVerified?: boolean
}

export type OIDCUserError = 'squatter' | 'email_too_long' | 'email_unverified'

export type ResolveOIDCUserResult =
  | {authToken: AuthToken; userId: string; isNewUser: boolean}
  | {error: OIDCUserError}

export const resolveOIDCUser = async (
  profile: OIDCProfile,
  isOrganic: boolean,
  dataLoader: DataLoaderWorker
): Promise<ResolveOIDCUserResult> => {
  const {sub, name, preferredUsername} = profile
  if (profile.emailVerified === false) return {error: 'email_unverified'}
  const email = profile.email.toLowerCase()
  const isEmailVerified = profile.emailVerified ?? true
  if (email.length > USER_PREFERRED_NAME_LIMIT) return {error: 'email_too_long'}

  const existingUser = await getUserByEmail(email)
  if (existingUser) {
    const {id: userId, identities, rol} = existingUser
    const hasOIDCIdentity = identities.some(
      (identity) => identity.type === AuthIdentityTypeEnum.OIDC
    )
    if (!hasOIDCIdentity) {
      const [bestIdentity] = identities
      if (bestIdentity && !bestIdentity.isEmailVerified) return {error: 'squatter'}
      identities.push(new AuthIdentityOIDC({id: sub, isEmailVerified}))
      await updateUser({identities: identities.map((identity) => JSON.stringify(identity))}, userId)
    }
    const tms = await dataLoader.get('teamIdsByUserId').load(userId)
    return {authToken: new AuthToken({sub: userId, rol, tms}), userId, isNewUser: false}
  }

  const userId = `oidc|${generateUID()}`
  const nickname = name || preferredUsername || email.substring(0, email.indexOf('@'))
  const preferredName = nickname.length === 1 ? nickname.repeat(2) : nickname
  const newUser = new User({
    id: userId,
    preferredName,
    picture: await generateIdenticon(userId, preferredName),
    email,
    identities: [new AuthIdentityOIDC({id: sub, isEmailVerified})]
  })
  const authToken = await bootstrapNewUser(newUser, isOrganic, dataLoader)
  return {authToken, userId, isNewUser: true}
}
