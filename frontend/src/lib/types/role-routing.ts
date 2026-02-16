export const ROLE_ROUTE_MAP: Record<string, string> = {
  admin: 'admin',
  first_responder: 'responder',
  volunteer: 'volunteer',
  affected_individual: 'individual',
  responder: 'responder',
  individual: 'individual',
};

type MaybeRoleCarrier = {
  role_id?: string | null;
  role?: string | null;
} | null | undefined;

export const getDashboardRouteSlug = (
  roleId?: string | null,
  fallbackRole?: string | null,
) => {
  if (roleId && ROLE_ROUTE_MAP[roleId]) {
    return ROLE_ROUTE_MAP[roleId];
  }

  if (fallbackRole && ROLE_ROUTE_MAP[fallbackRole]) {
    return ROLE_ROUTE_MAP[fallbackRole];
  }

  if (fallbackRole) {
    return fallbackRole;
  }

  return 'individual';
};

export const getDashboardRoute = (user?: MaybeRoleCarrier) => {
  const slug = getDashboardRouteSlug(user?.role_id ?? undefined, user?.role ?? undefined);
  return `/dashboard/${slug}`;
};
