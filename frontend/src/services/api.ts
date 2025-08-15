import type { ApiResponse } from '@/types';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  requireAuth?: boolean;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: Response
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  private async request<T>(
    url: string, 
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      body,
      headers = {},
      requireAuth = true
    } = options;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
      ...(requireAuth ? this.getAuthHeaders() : {})
    };

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.error || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          response
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'Network request failed',
        0
      );
    }
  }

  // GET request
  async get<T>(url: string, requireAuth = true): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'GET', requireAuth });
  }

  // POST request
  async post<T>(
    url: string, 
    body?: any, 
    requireAuth = true
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'POST', body, requireAuth });
  }

  // PUT request
  async put<T>(
    url: string, 
    body?: any, 
    requireAuth = true
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'PUT', body, requireAuth });
  }

  // DELETE request
  async delete<T>(url: string, requireAuth = true): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'DELETE', requireAuth });
  }

  // PATCH request
  async patch<T>(
    url: string, 
    body?: any, 
    requireAuth = true
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'PATCH', body, requireAuth });
  }
}

export const apiService = new ApiService();
export default apiService;