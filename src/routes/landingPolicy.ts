import { Role, type User } from '../types/types';
import { type RouteItem, ROUTE_MANIFEST } from './manifest';

/**
 * Evaluates whether an authenticated user has permission to access a given route.
 */
export function canAccessRoute(user: User | null, routeItem: RouteItem): boolean {
  if (!user) return false;

  // Administrators bypass permission checks
  if (user.role === Role.ADMIN) return true;

  // Check role constraints (e.g. /administration is ADMIN only)
  if (routeItem.roles && !routeItem.roles.includes(user.role)) {
    return false;
  }

  // Check granular permission flags
  if (routeItem.permissionKey) {
    if (!user.permissions || user.permissions[routeItem.permissionKey] !== true) {
      return false;
    }
  }

  return true;
}

/**
 * Determines the primary default landing destination for a user upon authentication.
 */
export function getDefaultRouteForUser(user: User | null): string {
  if (!user) return '/login';

  // Admin always lands on the Dashboard
  if (user.role === Role.ADMIN) return '/dashboard';

  // Dynamically find the first permitted module route defined in the manifest
  const firstPermitted = ROUTE_MANIFEST.find((item) => canAccessRoute(user, item));
  if (firstPermitted) {
    return firstPermitted.path;
  }

  // Fallback for users with no assigned module permissions
  return '/access-restricted';
}

/**
 * Returns all top-level routes visible to the given user in navigation menus.
 */
export function getSidebarRoutes(user: User | null): RouteItem[] {
  if (!user) return [];

  return ROUTE_MANIFEST.filter((item) => {
    // Check specific sidebar visibility rule if defined
    if (item.showInSidebar && !item.showInSidebar(user)) {
      return false;
    }

    // Check general route access permission
    return canAccessRoute(user, item);
  });
}
