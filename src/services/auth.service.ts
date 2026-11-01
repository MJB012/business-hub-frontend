import { apiRequest } from './api.config';

export interface LoginResponse {
  access_token: string;
  user?: any;
}

export const authService = {
  async login(email: string, pass: string): Promise<LoginResponse> {
    const res = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      data: { email, password: pass },
    });
    if (res.access_token) {
      localStorage.setItem('token', res.access_token);
      if (res.user) {
        localStorage.setItem('user', JSON.stringify(res.user));
      }
      window.dispatchEvent(new Event('storage'));
    }
    return res;
  },

  async signup(data: any): Promise<any> {
    return apiRequest('/auth/signup', {
      method: 'POST',
      data,
    });
  },

  async getProfile(): Promise<any> {
    return apiRequest('/auth/me', {
      method: 'GET',
    });
  },

  async forgotPassword(email: string): Promise<{ message: string; verification_code?: string; email: string }> {
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      data: { email },
    });
  },

  async verifyResetCode(email: string, code: string): Promise<{ message: string; valid: boolean; email: string }> {
    return apiRequest('/auth/verify-code', {
      method: 'POST',
      data: { email, code },
    });
  },

  async resetPassword(
    email: string,
    code: string,
    new_password: string
  ): Promise<{ message: string }> {
    return apiRequest('/auth/reset-password', {
      method: 'POST',
      data: { email, code, new_password },
    });
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('storage'));
  },
};
