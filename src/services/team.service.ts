import { apiRequest } from './api.config';
import { UserRoleEnum } from '../enums/UserRoleEnum';

export interface TeamMember {
  _id: string;
  id?: string;
  full_name: string;
  email: string;
  role: UserRoleEnum;
  permissions?: string[];
  business?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTeamMemberPayload {
  full_name: string;
  email: string;
  password: string;
  role: UserRoleEnum;
  permissions?: string[];
}

export interface UpdateTeamMemberPayload {
  full_name?: string;
  role?: UserRoleEnum;
  password?: string;
  permissions?: string[];
}

export const teamService = {
  async getMembers(): Promise<TeamMember[]> {
    return apiRequest<TeamMember[]>('/users', {
      method: 'GET',
    });
  },

  async createMember(data: CreateTeamMemberPayload): Promise<TeamMember> {
    return apiRequest<TeamMember>('/users', {
      method: 'POST',
      data,
    });
  },

  async updateMember(id: string, data: UpdateTeamMemberPayload): Promise<TeamMember> {
    return apiRequest<TeamMember>(`/users/${id}`, {
      method: 'PATCH',
      data,
    });
  },

  async deleteMember(id: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};
