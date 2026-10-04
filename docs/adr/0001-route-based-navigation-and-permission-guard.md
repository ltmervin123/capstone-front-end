# Route-Based Navigation and Deep Route Guard Module

## Context
The application previously rendered all views conditionally inside a monolithic `App.tsx` component using an in-memory `activeView` string state. Authorization checks were triplicated across `App.tsx` view-switching, `Sidebar.tsx` menu item filtering, and the `getDefaultView` helper. This prevented URL bookmarking, browser back/forward history, and deep-linking while leaking access-control logic across unrelated modules.

## Decision
We decided to:
1. Adopt `react-router-dom` to establish a standard browser URL seam.
2. Unify all route specifications, authorized roles, and granular permission keys in a central **Route Permission Manifest** module.
3. Enforce access control at the routing seam using a **Route Guard** module that renders an in-place **Access Limitation Notice** within the authenticated shell layout when unauthorized access is attempted.
4. Resolve initial authentication landing routes dynamically via a **Default Landing Policy** rather than hardcoding landing paths.
5. Decouple views (such as `Dashboard`) and the `Sidebar` from navigation callback props by leveraging router hooks (`useNavigate`, `useLocation`) and the auth store.

## Consequences
- Single point of maintenance for navigation paths and security rules (high locality).
- All screens become bookmarkable and shareable with valid browser history.
- Downstream view interfaces shrink significantly as `setActiveView` callback props are eliminated.
