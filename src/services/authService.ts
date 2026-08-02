import type { LoginFormValues } from '../features/auth/login.schema';
import { Role, type User, type UserPermissions } from '../types/types';
import { apiRequest, type ApiSuccessResponse } from '../utils/apiClient';

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

export const authService = {
  async login(credentials: LoginFormValues): Promise<User> {
    const response = await apiRequest<ApiSuccessResponse<AuthUserPayload>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    return mapAuthUserToUser(response.data.user);
  },

  async logout(): Promise<void> {
    await apiRequest<ApiSuccessResponse<{ message?: string }>>('/auth/logout', {
      method: 'POST',
    });
  },

  async refreshSession(): Promise<User> {
    const response = await apiRequest<ApiSuccessResponse<AuthUserPayload>>('/auth/refresh', {
      method: 'POST',
    });

    return mapAuthUserToUser(response.data.user);
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
        return null;
      }
    }
  },
};
