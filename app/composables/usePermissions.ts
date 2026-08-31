export const usePermissions = () => {
  const user = useCurrentUser();

  const permissions = computed<string[]>(() => {
    return user.value?.data?.permissions ?? []
  })

  const roles = computed<string[]>(() => {
    return user.value?.data?.roles ?? []
  })

  const hasPermission = (permission: string): boolean => {
    return permissions.value.includes(permission)
  }

  const hasAnyPermission = (requiredPermissions: string[]): boolean => {
    return requiredPermissions.some(permission =>
      permissions.value.includes(permission)
    )
  }

  const hasAllPermissions = (requiredPermissions: string[]): boolean => {
    return requiredPermissions.every(permission =>
      permissions.value.includes(permission)
    )
  }

  const hasRole = (role: string): boolean => {
    return roles.value.includes(role)
  }

  const hasAnyRole = (requiredRoles: string[]): boolean => {
    return requiredRoles.some(role =>
      roles.value.includes(role)
    )
  }

  return {
    permissions,
    roles,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole
  }
}