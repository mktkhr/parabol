export const extractGroups = (
  claims: Record<string, unknown> | undefined,
  claimName: string
): string[] => {
  const value = claims?.[claimName]
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}

export const isGroupAllowed = (groups: string[], allowedGroups: string[]) =>
  allowedGroups.length === 0 || groups.some((group) => allowedGroups.includes(group))
