import { Role, type AuditLog, type User, type UserPermissions } from '../types/types';
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

interface UsersPayload {
  users: AuthUserResponse[];
}

interface UserPayload {
  user: AuthUserResponse;
}

interface AuditLogsPayload {
  logs: AuditLog[];
}

export interface CreateStaffUserInput {
  username: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'HR';
  permissions?: UserPermissions;
}

function mapUser(authUser: AuthUserResponse): User {
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

export const adminService = {
  async listUsers(): Promise<User[]> {
    const response = await apiRequest<ApiSuccessResponse<UsersPayload>>('/users');
    return response.data.users.map(mapUser);
  },

  async listAuditLogs(): Promise<AuditLog[]> {
    const response = await apiRequest<ApiSuccessResponse<AuditLogsPayload>>('/users/audit-logs');
    return response.data.logs;
  },

  async createStaffUser(payload: CreateStaffUserInput): Promise<User> {
    const response = await apiRequest<ApiSuccessResponse<UserPayload>>('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapUser(response.data.user);
  },

  async approveUser(id: string): Promise<User> {
    const response = await apiRequest<ApiSuccessResponse<UserPayload>>(
      `/users/${encodeURIComponent(id)}/approve`,
      { method: 'PATCH' },
    );
    return mapUser(response.data.user);
  },

  async updateUserStatus(id: string, isActive: boolean): Promise<User> {
    const response = await apiRequest<ApiSuccessResponse<UserPayload>>(
      `/users/${encodeURIComponent(id)}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      },
    );
    return mapUser(response.data.user);
  },

  async updateUserPermissions(id: string, permissions: UserPermissions): Promise<User> {
    const response = await apiRequest<ApiSuccessResponse<UserPayload>>(
      `/users/${encodeURIComponent(id)}/permissions`,
      {
        method: 'PATCH',
        body: JSON.stringify({ permissions }),
      },
    );
    return mapUser(response.data.user);
  },

  async updateUserPassword(id: string, password: string): Promise<User> {
    const response = await apiRequest<ApiSuccessResponse<UserPayload>>(
      `/users/${encodeURIComponent(id)}/password`,
      {
        method: 'PATCH',
        body: JSON.stringify({ password }),
      },
    );
    return mapUser(response.data.user);
  },

  async deleteUser(id: string): Promise<{ id: string }> {
    const response = await apiRequest<ApiSuccessResponse<{ id: string }>>(
      `/users/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    );
    return response.data;
  },
};
