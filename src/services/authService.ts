import type { LoginFormValues } from '../features/auth/login.schema';
import { Role, type User, type UserPermissions } from '../types/types';
import { apiRequest, setSessionRefresher, type ApiSuccessResponse } from '../utils/apiClient';
import { useAuthStore } from '../stores/authStore';

interface AuthUserResponse {
  id: string;
  username: string;
  email: string;
  role: Role;
  isActive: boolean;
  isApproved: boolean;
  permissions: UserPermissions | null;
  employeeId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthUserPayload {
  user: AuthUserResponse;
}

function mapAuthUserToUser(authUser: AuthUserResponse): User {
  return {
    id: authUser.id,
    username: authUser.username,
    email: authUser.email,
    role: authUser.role,
    isActive: authUser.isActive,
    isApproved: authUser.isApproved,
    createdAt: new Date(authUser.createdAt).getTime(),
    permissions: authUser.permissions ?? undefined,
    employeeId: authUser.employeeId ?? undefined,
  };
}

async function fetchCurrentUser(): Promise<User> {
  const response = await apiRequest<ApiSuccessResponse<AuthUserPayload>>('/auth/me');
  return mapAuthUserToUser(response.data.user);
}

let activeRefreshPromise: Promise<User> | null = null;

export const authService = {
  async login(credentials: LoginFormValues): Promise<User> {
    const response = await apiRequest<ApiSuccessResponse<AuthUserPayload>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      skipAuthRefresh: true,
    });

    return mapAuthUserToUser(response.data.user);
  },

  async logout(): Promise<void> {
    await apiRequest<ApiSuccessResponse<{ message?: string }>>('/auth/logout', {
      method: 'POST',
      skipAuthRefresh: true,
    });
  },

  async refreshSession(): Promise<User> {
    if (activeRefreshPromise) {
      return activeRefreshPromise;
    }

    activeRefreshPromise = (async () => {
      try {
        const response = await apiRequest<ApiSuccessResponse<AuthUserPayload>>('/auth/refresh', {
          method: 'POST',
          skipAuthRefresh: true,
        });

        const user = mapAuthUserToUser(response.data.user);
        useAuthStore.getState().setUser(user);
        return user;
      } finally {
        activeRefreshPromise = null;
      }
    })();

    return activeRefreshPromise;
  },

  async getCurrentUser(): Promise<User> {
    return fetchCurrentUser();
  },

  async restoreSession(): Promise<User | null> {
    try {
      return await fetchCurrentUser();
    } catch {
      try {
        return await authService.refreshSession();
      } catch {
        useAuthStore.getState().clearAuth();
        return null;
      }
    }
  },

  async changePassword(payload: { currentPassword: string; newPassword: string }): Promise<void> {
    await apiRequest<ApiSuccessResponse<{ message?: string }>>('/auth/password', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
};

setSessionRefresher(async () => {
  try {
    await authService.refreshSession();
    return true;
  } catch {
    useAuthStore.getState().clearAuth();
    return false;
  }
});

