process.env.PROTO = 'https'
process.env.HOST = 'parabol.example.com'
process.env.PORT = '3000'

import AuthToken from '../../../database/types/AuthToken'
import type {DataLoaderWorker} from '../../../graphql/graphql'
import bootstrapNewUser from '../../../graphql/mutations/helpers/bootstrapNewUser'
import {getUserByEmail} from '../../../postgres/queries/getUsersByEmails'
import updateUser from '../../../postgres/queries/updateUser'
import {resolveOIDCUser} from '../resolveOIDCUser'

jest.mock('../../../postgres/queries/getUsersByEmails', () => ({getUserByEmail: jest.fn()}))
jest.mock('../../../postgres/queries/updateUser', () => ({__esModule: true, default: jest.fn()}))
jest.mock('../../../graphql/mutations/helpers/bootstrapNewUser', () => ({
  __esModule: true,
  default: jest.fn()
}))
jest.mock('../../../graphql/private/mutations/helpers/generateIdenticon', () => ({
  generateIdenticon: jest.fn(async () => 'data:image/svg+xml;base64,AAA')
}))

const mockedGetUserByEmail = jest.mocked(getUserByEmail)
const mockedUpdateUser = jest.mocked(updateUser)
const mockedBootstrap = jest.mocked(bootstrapNewUser)

const dataLoader = {
  get: () => ({load: async () => ['team1']})
} as unknown as DataLoaderWorker

const profile = {sub: 'sub-1', email: 'jane@example.com', name: 'Jane'}

beforeEach(() => {
  jest.clearAllMocks()
  process.env.PROTO = 'https'
  process.env.HOST = 'parabol.example.com'
  process.env.PORT = '3000'
})

test('creates a new user with an OIDC identity when the email is unknown', async () => {
  mockedGetUserByEmail.mockResolvedValue(null)
  mockedBootstrap.mockImplementation(async (newUser) => new AuthToken({sub: newUser.id, tms: []}))
  const result = await resolveOIDCUser(profile, true, dataLoader)
  expect(result).toMatchObject({isNewUser: true})
  const [newUser, isOrganic] = mockedBootstrap.mock.calls[0]!
  expect(newUser.id.startsWith('oidc|')).toBe(true)
  expect(newUser.preferredName).toBe('Jane')
  expect(newUser.identities).toEqual([{type: 'OIDC', id: 'sub-1', isEmailVerified: true}])
  expect(isOrganic).toBe(true)
})

test('falls back to preferred_username then email local part for the name', async () => {
  mockedGetUserByEmail.mockResolvedValue(null)
  mockedBootstrap.mockImplementation(async (newUser) => new AuthToken({sub: newUser.id, tms: []}))
  await resolveOIDCUser(
    {sub: 's', email: 'jo@example.com', preferredUsername: 'jo_dev'},
    true,
    dataLoader
  )
  expect(mockedBootstrap.mock.calls[0]![0].preferredName).toBe('jo_dev')
  await resolveOIDCUser({sub: 's', email: 'jo@example.com'}, true, dataLoader)
  expect(mockedBootstrap.mock.calls[1]![0].preferredName).toBe('jo')
})

test('links an OIDC identity to an existing verified user', async () => {
  mockedGetUserByEmail.mockResolvedValue({
    id: 'google-oauth2|abc',
    rol: null,
    identities: [{type: 'GOOGLE', id: 'g1', isEmailVerified: true}]
  } as never)
  const result = await resolveOIDCUser(profile, true, dataLoader)
  expect(result).toMatchObject({userId: 'google-oauth2|abc', isNewUser: false})
  expect(mockedUpdateUser).toHaveBeenCalledTimes(1)
  const [update] = mockedUpdateUser.mock.calls[0]!
  expect(update.identities).toHaveLength(2)
  expect(mockedBootstrap).not.toHaveBeenCalled()
})

test('does not write when the OIDC identity already exists', async () => {
  mockedGetUserByEmail.mockResolvedValue({
    id: 'oidc|abc',
    rol: null,
    identities: [{type: 'OIDC', id: 'sub-1', isEmailVerified: true}]
  } as never)
  const result = await resolveOIDCUser(profile, true, dataLoader)
  expect(result).toMatchObject({userId: 'oidc|abc', isNewUser: false})
  expect(mockedUpdateUser).not.toHaveBeenCalled()
})

test('rejects an unverified local account (squatter)', async () => {
  mockedGetUserByEmail.mockResolvedValue({
    id: 'local|abc',
    rol: null,
    identities: [{type: 'LOCAL', id: 'jane@example.com', isEmailVerified: false}]
  } as never)
  const result = await resolveOIDCUser(profile, true, dataLoader)
  expect(result).toEqual({error: 'squatter'})
  expect(mockedUpdateUser).not.toHaveBeenCalled()
})
