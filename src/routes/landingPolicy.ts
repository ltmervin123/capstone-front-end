import { Role, type User } from '../types/types';
import { type RouteItem, ROUTE_MANIFEST } from './manifest';

/**
 * Evaluates whether an authenticated user has permission to access a given route.
 */
export function canAccessRoute(user: User | null, routeItem: RouteItem): boolean {
  if (!user) return false;

  // Administrators bypass permission checks
  if (user.role === Role.ADMIN) return true;

  // Check role constraints
  if (routeItem.roles && !routeItem.roles.includes(user.role)) {
    return false;
  }

  // Check granular permission flags
  if (routeItem.permissionKey && user.permissions) {
    if (user.permissions[routeItem.permissionKey] === false) {
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

  if (user.role === Role.EMPLOYEE) {
    const permissions = user.permissions;
    if (!permissions || permissions.attendance !== false) return '/attendance';
    if (permissions.leaves !== false) return '/leaves';
    if (permissions.payroll !== false) return '/payroll';
    return '/attendance';
  }

  if (user.role !== Role.ADMIN && user.permissions?.dashboard === false) {
    const permissions = user.permissions;
    if (permissions.employees !== false) return '/employees';
    if (permissions.attendance !== false) return '/attendance';
    if (permissions.leaves !== false) return '/leaves';
    return '/employees';
  }

  return '/dashboard';
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
