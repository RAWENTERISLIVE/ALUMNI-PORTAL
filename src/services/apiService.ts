const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  user?: any;
  accessToken?: string;
  refreshToken?: string;
  users?: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats?: any;
  errors?: any[];
}

class ApiService {
  private baseURL: string;
  private accessToken: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.accessToken = localStorage.getItem('accessToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.accessToken && { Authorization: `Bearer ${this.accessToken}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log('API Request:', { url, method: config.method || 'GET' });
      
      // Check network connectivity first
      if (!navigator.onLine) {
        throw new Error('No internet connection. Please check your network and try again.');
      }
      
      const response = await fetch(url, config);
      
      // Handle non-JSON responses
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.indexOf('application/json') !== -1) {
        try {
          data = await response.json();
        } catch (e) {
          console.error('Failed to parse JSON response:', e);
          throw new Error('Invalid response from server');
        }
      } else {
        const textData = await response.text();
        try {
          // Try to parse as JSON anyway in case Content-Type is wrong
          data = JSON.parse(textData);
        } catch (e) {
          // Not JSON, create an error object
          data = { success: false, message: textData || 'Unknown server error' };
        }
      }
      
      console.log('API Response:', { 
        status: response.status, 
        url: response.url, 
        method: config.method || 'GET',
        response: typeof data === 'object' ? JSON.stringify(data).substring(0, 200) + '...' : String(data).substring(0, 200) + '...',
        ...(config.method !== 'GET' && { requestPath: endpoint })
      });

      if (!response.ok) {
        // Handle token expiration
        if (response.status === 401 && this.accessToken) {
          console.log('Token expired, attempting refresh...');
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // Retry the original request with new token
            console.log('Token refreshed, retrying request');
            return this.request(endpoint, options);
          } else {
            console.log('Token refresh failed, logging out');
            this.handleLogout();
            throw new Error('Session expired. Please login again.');
          }
        }
        
        // Handle other error responses
        const errorMessage = (data && (data.message || data.error)) || 
          `Server error (${response.status})`;
        throw new Error(errorMessage);
      }

      return data;
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.error('Network error:', error);
        throw new Error('Unable to connect to server. Please check your connection and try again.');
      }
      
      console.error('API request failed:', error);
      throw error;
    }
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return false;

      const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.setTokens(data.accessToken, data.refreshToken);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    return false;
  }

  private setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  private handleLogout() {
    this.accessToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  // Auth endpoints
  async register(userData: {
    email: string;
    password: string;
    name: string;
    admissionNumber?: string;
    needsManualVerification?: boolean;
    verificationDetails?: string;
    graduationYear?: string;
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(email: string, password: string) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.accessToken && response.refreshToken) {
      this.setTokens(response.accessToken, response.refreshToken);
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
      }
    }

    return response;
  }

  async logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      await this.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      this.handleLogout();
    }
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  // User management endpoints
  async getAllUsers(params: {
    page?: number;
    limit?: number;
    status?: string;
    role?: string;
    search?: string;
  } = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.role) queryParams.append('role', params.role);
    if (params.search) queryParams.append('search', params.search);

    return this.request(`/users?${queryParams.toString()}`);
  }

  async getPendingUsers() {
    return this.request('/users/pending');
  }

  async getUserStats() {
    return this.request('/users/stats');
  }

  async approveUser(userId: string) {
    return this.request(`/users/${userId}/approve`, {
      method: 'PATCH',
    });
  }

  async rejectUser(userId: string) {
    return this.request(`/users/${userId}/reject`, {
      method: 'PATCH',
    });
  }

  async suspendUser(userId: string) {
    return this.request(`/users/${userId}/suspend`, {
      method: 'PATCH',
    });
  }

  async reactivateUser(userId: string) {
    return this.request(`/users/${userId}/reactivate`, {
      method: 'PATCH',
    });
  }

  async promoteToAdmin(userId: string) {
    return this.request(`/users/${userId}/promote`, {
      method: 'PATCH',
    });
  }

  async demoteAdmin(userId: string) {
    return this.request(`/users/${userId}/demote`, {
      method: 'PATCH',
    });
  }

  async deleteUser(userId: string) {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async getUserById(userId: string) {
    return this.request(`/users/${userId}`);
  }

  async updateUserProfile(userId: string, profileData: any) {
    return this.request(`/users/${userId}/profile`, {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });
  }

  // Post API methods
  async createPost(postData: any) {
    return this.request('/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  async getAllPosts(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/posts${queryString}`);
  }

  async getPostById(postId: string) {
    return this.request(`/posts/${postId}`);
  }

  async updatePost(postId: string, postData: any) {
    return this.request(`/posts/${postId}`, {
      method: 'PATCH',
      body: JSON.stringify(postData),
    });
  }

  async deletePost(postId: string) {
    return this.request(`/posts/${postId}`, {
      method: 'DELETE',
    });
  }

  async likePost(postId: string) {
    return this.request(`/posts/${postId}/like`, {
      method: 'PATCH',
    });
  }

  async toggleFeaturePost(postId: string) {
    return this.request(`/posts/${postId}/feature`, {
      method: 'PATCH',
    });
  }

  async getFeaturedPosts(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/posts/featured${queryString}`);
  }

  async getSchoolUpdates(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/posts/school-updates${queryString}`);
  }

  // Job endpoints
  async getJobs(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/jobs${queryString}`);
  }

  async getJobById(jobId: string) {
    return this.request(`/jobs/${jobId}`);
  }

  async createJob(jobData: {
    title: string;
    company: string;
    location: string;
    type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance';
    salaryRange?: {
      min: number;
      max: number;
      currency: string;
    };
    description: string;
    requirements?: string[];
    benefits?: string[];
    applicationUrl?: string;
    contactEmail?: string;
    isAlumniReferral?: boolean;
    applicationDeadline?: string;
    tags?: string[];
  }) {
    return this.request('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  }

  async updateJob(jobId: string, jobData: any) {
    return this.request(`/jobs/${jobId}`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    });
  }

  async deleteJob(jobId: string) {
    return this.request(`/jobs/${jobId}`, {
      method: 'DELETE',
    });
  }

  async toggleSaveJob(jobId: string) {
    return this.request(`/jobs/${jobId}/save`, {
      method: 'POST',
    });
  }

  async getSavedJobs(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/jobs/saved${queryString}`);
  }

  async applyToJob(jobId: string) {
    return this.request(`/jobs/${jobId}/apply`, {
      method: 'POST',
    });
  }

  async getJobStats() {
    return this.request('/jobs/stats');
  }

  // Admission verification
  async verifyAdmission(admissionNumber: string): Promise<boolean> {
    // For now, we'll validate the format
    const regex = /^\d+\/\d{2}$/;
    return regex.test(admissionNumber);
  }

  // Analytics endpoints
  async getUserAnalytics() {
    return this.request('/analytics/users');
  }

  async getPostStats() {
    return this.request('/posts/stats');
  }

  async getAnalytics(timeRange?: string) {
    const params = timeRange ? { timeRange } : {};
    const queryString = Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/analytics${queryString}`);
  }

  // Alumni Directory endpoints
  async getAlumniDirectory(page = 1, limit = 10, filters = {}): Promise<ApiResponse> {
    const queryParams = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...filters
    }).toString();
    return this.request(`/users/directory?${queryParams}`);
  }

  // Groups endpoints
  async getGroups(): Promise<ApiResponse> {
    return this.request('/groups');
  }

  async createGroup(groupData: any): Promise<ApiResponse> {
    return this.request('/groups', {
      method: 'POST',
      body: JSON.stringify(groupData),
    });
  }

  async joinGroup(groupId: string): Promise<ApiResponse> {
    return this.request(`/groups/${groupId}/join`, {
      method: 'POST',
    });
  }

  async leaveGroup(groupId: string): Promise<ApiResponse> {
    return this.request(`/groups/${groupId}/leave`, {
      method: 'POST',
    });
  }

  async getGroupMessages(groupId: string, page = 1, limit = 20): Promise<ApiResponse> {
    const queryParams = new URLSearchParams({
      page: String(page),
      limit: String(limit)
    }).toString();
    return this.request(`/groups/${groupId}/messages?${queryParams}`);
  }

  async sendGroupMessage(groupId: string, messageData: any): Promise<ApiResponse> {
    return this.request(`/groups/${groupId}/messages`, {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  // Mentorship endpoints
  async getMentors(): Promise<ApiResponse> {
    return this.request('/mentorship/mentors');
  }

  async becomeMentor(profileData: any): Promise<ApiResponse> {
    return this.request('/mentorship/become-mentor', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  }

  async getMentorshipProfile(): Promise<ApiResponse> {
    return this.request('/mentorship/profile');
  }
  
  async requestMentorship(mentorId: string, message?: string): Promise<ApiResponse> {
    // Use message if provided
    if (message) {
      return this.request('/mentorship/request', {
        method: 'POST',
        body: JSON.stringify({ mentorId, message }),
      });
    }
    
    // Otherwise use the simpler endpoint
    return this.request(`/mentorship/request/${mentorId}`, {
      method: 'POST',
    });
  }

}

const apiService = new ApiService();
export default apiService;
