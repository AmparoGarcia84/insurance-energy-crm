import { useAuth } from '../auth/AuthContext'

/**
 * Returns permission flags derived from the current user's role.
 *
 * OWNER  — full access including delete.
 * EMPLOYEE — view, create, edit; no delete anywhere.
 */
export function usePermissions() {
  const { user } = useAuth()
  const isOwner = user?.role === 'OWNER'

  return {
    canDelete: isOwner,
    canEdit:   true,
    canCreate: true,
  }
}
