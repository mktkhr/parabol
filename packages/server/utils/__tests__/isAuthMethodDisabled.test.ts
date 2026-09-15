import {isAuthMethodDisabled, isOIDCEnabled} from '../isAuthMethodDisabled'

const ENV_KEYS = ['OIDC_ISSUER', 'AUTH_INTERNAL_DISABLED', 'AUTH_SSO_DISABLED'] as const

beforeEach(() => {
  ENV_KEYS.forEach((key) => {
    delete process.env[key]
  })
})

test('nothing is disabled by default', () => {
  expect(isOIDCEnabled()).toBe(false)
  expect(isAuthMethodDisabled('INTERNAL')).toBe(false)
  expect(isAuthMethodDisabled('SSO')).toBe(false)
})

test('AUTH_*_DISABLED=true disables only that method', () => {
  process.env.AUTH_INTERNAL_DISABLED = 'true'
  expect(isAuthMethodDisabled('INTERNAL')).toBe(true)
  expect(isAuthMethodDisabled('GOOGLE')).toBe(false)
})

test('OIDC_ISSUER disables every other method', () => {
  process.env.OIDC_ISSUER = 'https://gitlab.example.com'
  expect(isOIDCEnabled()).toBe(true)
  expect(isAuthMethodDisabled('INTERNAL')).toBe(true)
  expect(isAuthMethodDisabled('GOOGLE')).toBe(true)
  expect(isAuthMethodDisabled('MICROSOFT')).toBe(true)
  expect(isAuthMethodDisabled('SSO')).toBe(true)
})
