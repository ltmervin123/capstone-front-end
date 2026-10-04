# Front-End Navigation & Access Control

Navigation, route management, and role-based access validation for the NMC-HR personnel system.

## Language

**Route Permission Manifest**:
A declarative mapping specifying each route's path, display label, icon, authorized roles, and required permission keys.
_Avoid_: Route list, menu config

**Route Guard**:
A module at the routing navigation seam that intercepts route transitions, evaluating caller authorization against the route's permission specification and rendering an in-place access limitation screen when unauthorized.
_Avoid_: Auth middleware, route wrapper, permission checker

**Default Landing Policy**:
The rule-set that computes a user's initial accessible destination based on their role and granular permissions upon authentication or root path traversal.
_Avoid_: Home route, redirect logic, default view calculator

**Access Limitation Notice**:
The security presentation rendered when an authenticated user attempts to access a subsystem prohibited by their account permissions.
_Avoid_: 403 page, error banner, forbidden screen
