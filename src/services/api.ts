/**
 * Clean API Service - Built from scratch for reliable backend integration
 * Date: 8 Oct 2025
 * 
 * Key principles:
 * 1. Validate every response
 * 2. Log all requests for debugging
 * 3. Handle errors consistently
 * 4. Type everything properly
 */

const rawApiUrl = import.meta.env.VITE_API_URL?.trim();
const API_BASE_URL = rawApiUrl
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/+$/, '')}/api`)
  : '/api';

// Response types matching backend exactly
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
  user?: UserData;
  accessToken?: string;
  refreshToken?: string;
  users?: UserData[];
  posts?: PostData[];
  jobs?: JobData[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UserData {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'super_admin';
  status: 'pending' | 'active' | 'suspended' | 'deleted';
  isVerified?: boolean;
  admissionNumber?: string;
  graduationYear?: string;
  profileImage?: string;
  bio?: string;
  company?: string;
  jobTitle?: string;
  location?: string;
}

export interface PostData {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  likes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface JobData {
  id: string;
  title: string;
  company: string | { name: string; logo?: string };
  location: string;
  type: string;
  description: string;
  postedDate?: string;
  createdAt: string;
}

export interface RegistrationData {
  email: string;
  password: string;
  name: string;
  admissionNumber?: string;
  graduationYear?: string;
  needsManualVerification?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

class ApiService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Load tokens from localStorage on init
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  /**
   * Store authentication tokens
   */
  private setTokens(accessToken: string, refreshToken?: string) {
    this.accessToken = accessToken;
    localStorage.setItem('accessToken', accessToken);
    
    if (refreshToken) {
      this.refreshToken = refreshToken;
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  /**
   * Clear all auth data
   */
  clearAuth() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  /**
   * Make HTTP request with automatic token refresh
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Build headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth token if available
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    console.log(`[API] ${config.method || 'GET'} ${endpoint}`);

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      console.log(`[API] Response ${response.status}:`, data);

      // Handle 401 - try to refresh token
      if (response.status === 401 && this.refreshToken && endpoint !== '/auth/refresh-token') {
        console.log('[API] Access token expired, attempting refresh...');
        const refreshed = await this.refreshAccessToken();
        
        if (refreshed) {
          // Retry original request with new token
          return this.request<T>(endpoint, options);
        } else {
          // Refresh failed, clear auth and throw
          this.clearAuth();
          throw new Error('Session expired. Please login again.');
        }
      }

      // Return response (even if not ok - let caller handle business logic errors)
      return data as ApiResponse<T>;
    } catch (error) {
      console.error('[API] Request failed:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection.');
      }
      
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.accessToken) {
        this.setTokens(data.accessToken, data.refreshToken);
        return true;
      }
    } catch (error) {
      console.error('[API] Token refresh failed:', error);
    }

    return false;
  }

  // ==================== AUTH METHODS ====================

  async register(userData: RegistrationData): Promise<ApiResponse<UserData>> {
    const response = await this.request<UserData>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    // Auto-login for super admins
    if (response.success && response.accessToken) {
      this.setTokens(response.accessToken, response.refreshToken);
      
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
      }
    }

    return response;
  }

  async login(credentials: LoginCredentials): Promise<ApiResponse<UserData>> {
    const response = await this.request<UserData>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.accessToken) {
      this.setTokens(response.accessToken, response.refreshToken);
      
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
      }
    }

    return response;
  }

  async logout(): Promise<ApiResponse> {
    try {
      const response = await this.request('/auth/logout', {
        method: 'POST',
      });
      return response;
    } finally {
      // Always clear local auth regardless of API response
      this.clearAuth();
    }
  }

  async getCurrentUser(): Promise<ApiResponse<UserData>> {
    return this.request<UserData>('/auth/me');
  }

  // ==================== USER METHODS ====================

  async getAlumniDirectory(): Promise<ApiResponse<UserData[]>> {
    return this.request<UserData[]>('/users/directory');
  }

  async getUserProfile(userId: string): Promise<ApiResponse<UserData>> {
    return this.request<UserData>(`/users/${userId}`);
  }

  async updateProfile(profileData: Partial<UserData>): Promise<ApiResponse<UserData>> {
    return this.request<UserData>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });
  }

  // ==================== JOB METHODS ====================

  async getJobs(params?: {
    page?: number;
    limit?: number;
    search?: string;
    location?: string;
  }): Promise<ApiResponse<JobData[]>> {
    const query = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.append(key, String(value));
        }
      });
    }

    const endpoint = `/jobs${query.toString() ? `?${query.toString()}` : ''}`;
    return this.request<JobData[]>(endpoint);
  }

  async getJob(jobId: string): Promise<ApiResponse<JobData>> {
    return this.request<JobData>(`/jobs/${jobId}`);
  }

  async createJob(jobData: unknown): Promise<ApiResponse<JobData>> {
    return this.request<JobData>('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  }

  async saveJob(jobId: string): Promise<ApiResponse> {
    return this.request(`/jobs/${jobId}/save`, {
      method: 'POST',
    });
  }

  async unsaveJob(jobId: string): Promise<ApiResponse> {
    return this.request(`/jobs/${jobId}/save`, {
      method: 'DELETE',
    });
  }

  async applyToJob(jobId: string): Promise<ApiResponse> {
    return this.request(`/jobs/${jobId}/apply`, {
      method: 'POST',
    });
  }

  async getSavedJobs(): Promise<ApiResponse<JobData[]>> {
    return this.request<JobData[]>('/jobs/saved');
  }

  async getAppliedJobs(): Promise<ApiResponse<JobData[]>> {
    return this.request<JobData[]>('/jobs/applied');
  }

  // ==================== POST METHODS ====================

  async getPosts(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PostData[]>> {
    const query = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.append(key, String(value));
        }
      });
    }

    const endpoint = `/posts${query.toString() ? `?${query.toString()}` : ''}`;
    return this.request<PostData[]>(endpoint);
  }

  async createPost(postData: { content: string; visibility?: string }): Promise<ApiResponse<PostData>> {
    return this.request<PostData>('/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  async likePost(postId: string): Promise<ApiResponse> {
    return this.request(`/posts/${postId}/like`, {
      method: 'POST',
    });
  }

  async bookmarkPost(postId: string): Promise<ApiResponse> {
    return this.request(`/posts/${postId}/bookmark`, {
      method: 'POST',
    });
  }
}

// Export singleton instance
const api = new ApiService();
export default api;
