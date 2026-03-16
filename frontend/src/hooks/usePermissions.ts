import { useAuth } from './useAuth'

// TODO: load permissions from API and cache them
export function usePermissions() {
  const { user } = useAuth()

  function hasPermission(_permission: string): boolean {
    // TODO: check against user's actual permissions
    return !!user
  }

  return { hasPermission }
}
