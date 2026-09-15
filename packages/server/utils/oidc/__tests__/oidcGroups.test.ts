import {extractGroups, isGroupAllowed} from '../oidcGroups'

test('extractGroups reads a string array claim', () => {
  expect(extractGroups({groups: ['dev', 'ops']}, 'groups')).toEqual(['dev', 'ops'])
})

test('extractGroups splits a comma separated string claim', () => {
  expect(extractGroups({groups: 'dev, ops'}, 'groups')).toEqual(['dev', 'ops'])
})

test('extractGroups ignores missing or non-string values', () => {
  expect(extractGroups(undefined, 'groups')).toEqual([])
  expect(extractGroups({groups: [1, 'dev']}, 'groups')).toEqual(['dev'])
})

test('isGroupAllowed passes everyone when no allow list is configured', () => {
  expect(isGroupAllowed([], [])).toBe(true)
})

test('isGroupAllowed requires at least one match', () => {
  expect(isGroupAllowed(['dev'], ['ops', 'dev'])).toBe(true)
  expect(isGroupAllowed(['qa'], ['ops', 'dev'])).toBe(false)
  expect(isGroupAllowed([], ['ops'])).toBe(false)
})
