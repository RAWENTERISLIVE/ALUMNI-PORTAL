/* eslint-disable @typescript-eslint/no-explicit-any */
// API service handles external responses with dynamic structure - any types acceptable here

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

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
    totalPages: number;
    currentPage: number;
    totalPosts: number;
  };
  stats?: any;
  errors?: any[];
  post?: any;
  posts?: any[];
}

class ApiService {
  private readonly baseURL: string;
  private accessToken: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.accessToken = localStorage.getItem('accessToken');
  }

  setAccessToken(token: string) {
    this.accessToken = token;
    localStorage.setItem('accessToken', token);
  }

  private async parseResponseData(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.indexOf('application/json') !== -1) {
      try {
        return await response.json();
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
        throw new Error('Invalid response from server');
      }
    }
    
    const textData = await response.text();
    try {
      return JSON.parse(textData);
    } catch (e) {
      console.warn('Failed to parse JSON response:', e);
      return { success: false, message: textData || 'Unknown server error' };
    }
  }

  private async handleUnauthorizedResponse(endpoint: string, options: RequestInit): Promise<any> {
    if (!this.accessToken) {
      throw new Error('Session expired. Please login again.');
    }
    
    console.log('Token expired, attempting refresh...');
    const refreshed = await this.refreshToken();
    
    if (refreshed) {
      return this.request(endpoint, options);
    }
    
    this.handleLogout();
    throw new Error('Session expired. Please login again.');
  }

  private handleRequestError(error: any): never {
    console.error('API Error:', error);
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Unable to connect to server. Please check your internet connection and try again.');
    }
    
    throw error;
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
      
      if (!navigator.onLine) {
        throw new Error('No internet connection. Please check your network and try again.');
      }
      
      const response = await fetch(url, config);
      const data = await this.parseResponseData(response);
      
      console.log('API Response:', { 
        status: response.status, 
        url: response.url, 
        success: data?.success
      });

      if (!response.ok) {
        if (response.status === 401 && this.accessToken) {
          return await this.handleUnauthorizedResponse(endpoint, options);
        }
        
        const error = data?.message ?? data?.error ?? `HTTP error! status: ${response.status}`;
        throw new Error(error);
      }

      return data;
    } catch (error: any) {
      this.handleRequestError(error);
    }
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return false;

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.accessToken) {
          this.setAccessToken(data.accessToken);
          return true;
        }
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    return false;
  }

  private handleLogout() {
    this.accessToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  // Auth methods
  async login(email: string, password: string): Promise<ApiResponse> {
    try {
      const response = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (response.success && response.accessToken) {
        this.setAccessToken(response.accessToken);
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken);
        }
        if (response.user) {
          localStorage.setItem('user', JSON.stringify(response.user));
        }
      }

      return response;
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.message ?? 'Login failed. Please try again.',
      };
    }
  }

  async register(userData: any): Promise<ApiResponse> {
    try {
      return await this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Registration failed. Please try again.',
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.handleLogout();
    }
  }

  // Post methods
  async createPost(postData: {
    title?: string;
    content: string;
    category?: string;
    visibility?: string;
    tags?: string[];
    externalLinks?: string[];
    mentions?: string[];
  }): Promise<ApiResponse> {
    try {
      // Map 'everyone' to 'public' for backend compatibility
      const mappedData = {
        ...postData,
        visibility: postData.visibility === 'everyone' ? 'public' : postData.visibility
      };
      
      return await this.request('/posts', {
        method: 'POST',
        body: JSON.stringify(mappedData),
      });
    } catch (error: any) {
      console.error('Create post error:', error);
      return {
        success: false,
        message: error.message ?? 'Failed to create post. Please try again.',
      };
    }
  }

  async getPosts(params: {
    page?: number;
    limit?: number;
    category?: string;
    authorId?: string;
    visibility?: string;
    tag?: string;
  } = {}): Promise<ApiResponse> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/posts?${queryString}` : '/posts';
      return await this.request(endpoint);
    } catch (error: any) {
      console.error('Get posts error:', error);
      return {
        success: false,
        message: error.message ?? 'Failed to fetch posts.',
        data: []
      };
    }
  }

  async getPostById(postId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/posts/${postId}`);
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to fetch post.',
      };
    }
  }

  async updatePost(postId: string, postData: any): Promise<ApiResponse> {
    try {
      return await this.request(`/posts/${postId}`, {
        method: 'PATCH',
        body: JSON.stringify(postData),
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to update post.',
      };
    }
  }

  async deletePost(postId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/posts/${postId}`, {
        method: 'DELETE',
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to delete post.',
      };
    }
  }

  async likePost(postId: string, reactionType: string = 'like'): Promise<ApiResponse> {
    try {
      return await this.request(`/posts/${postId}/react`, {
        method: 'POST',
        body: JSON.stringify({ reactionType }),
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to react to post.',
      };
    }
  }

  async bookmarkPost(postId: string, bookmark: boolean = true): Promise<ApiResponse> {
    try {
      return await this.request(`/posts/${postId}/bookmark`, {
        method: bookmark ? 'POST' : 'DELETE',
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to bookmark post.',
      };
    }
  }

  async sharePost(postData: {
    originalPostId: string;
    content?: string;
    visibility?: string;
    shareType?: string;
  }): Promise<ApiResponse> {
    try {
      return await this.request('/posts/share', {
        method: 'POST',
        body: JSON.stringify(postData),
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to share post.',
      };
    }
  }

  async getFeedPosts(params: {
    page?: number;
    limit?: number;
    filter?: string;
  } = {}): Promise<ApiResponse> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/posts/feed?${queryString}` : '/posts/feed';
      return await this.request(endpoint);
    } catch (error: any) {
      console.error('Get feed posts error:', error);
      return {
        success: false,
        message: error.message ?? 'Failed to fetch feed posts.',
        data: []
      };
    }
  }

  async getBookmarkedPosts(params: {
    page?: number;
    limit?: number;
  } = {}): Promise<ApiResponse> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/posts/bookmarked?${queryString}` : '/posts/bookmarked';
      return await this.request(endpoint);
    } catch (error: any) {
      console.error('Get bookmarked posts error:', error);
      return {
        success: false,
        message: error.message ?? 'Failed to fetch bookmarked posts.',
        data: []
      };
    }
  }

  async getFeaturedPosts(params: {
    page?: number;
    limit?: number;
  } = {}): Promise<ApiResponse> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/posts/featured?${queryString}` : '/posts/featured';
      return await this.request(endpoint);
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to fetch featured posts.',
        data: []
      };
    }
  }

  async getSchoolUpdates(params: {
    page?: number;
    limit?: number;
  } = {}): Promise<ApiResponse> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/posts/school-updates?${queryString}` : '/posts/school-updates';
      return await this.request(endpoint);
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to fetch school updates.',
        data: []
      };
    }
  }

  // User methods
  async getCurrentUser(): Promise<ApiResponse> {
    try {
      return await this.request('/users/me');
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to fetch user data.',
      };
    }
  }

  async updateProfile(userData: any): Promise<ApiResponse> {
    try {
      return await this.request('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(userData),
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to update profile.',
      };
    }
  }

  async updateUserSkills(userId: string, skills: string[]): Promise<ApiResponse> {
    try {
      return await this.request(`/users/${userId}/skills`, {
        method: 'PATCH',
        body: JSON.stringify({ skills }),
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to update skills.',
      };
    }
  }

  async updateUserInterests(userId: string, interests: string[]): Promise<ApiResponse> {
    try {
      return await this.request(`/users/${userId}/interests`, {
        method: 'PATCH',
        body: JSON.stringify({ interests }),
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to update interests.',
      };
    }
  }

  async updatePrivacySettings(userId: string, privacySettings: any): Promise<ApiResponse> {
    try {
      return await this.request(`/users/${userId}/privacy`, {
        method: 'PATCH',
        body: JSON.stringify(privacySettings),
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to update privacy settings.',
      };
    }
  }

  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    classYear?: number;
  } = {}): Promise<ApiResponse> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/users?${queryString}` : '/users';
      return await this.request(endpoint);
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to fetch users.',
        users: []
      };
    }
  }

  // Add getAllUsers method as alias for getUsers for backward compatibility
  async getAllUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    classYear?: number;
  } = {}): Promise<ApiResponse> {
    return this.getUsers(params);
  }

  async getUserById(userId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/users/${userId}`);
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to fetch user.',
      };
    }
  }

  async getPendingUsers(): Promise<ApiResponse> {
    try {
      return await this.request('/users/pending');
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to fetch pending users.',
        users: []
      };
    }
  }

  async getUserStats(): Promise<ApiResponse> {
    try {
      return await this.request('/users/stats');
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to fetch user statistics.',
        data: {
          total: 0,
          approved: 0,
          pending: 0,
          suspended: 0
        }
      };
    }
  }

  async getUserSuggestions(limit?: number): Promise<ApiResponse> {
    try {
      const endpoint = limit ? `/users/suggestions?limit=${limit}` : '/users/suggestions';
      return await this.request(endpoint);
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to fetch user suggestions.',
        data: []
      };
    }
  }

  // Admin methods for user management
  async approveUser(userId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/users/${userId}/approve`, {
        method: 'PATCH'
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to approve user.'
      };
    }
  }

  async rejectUser(userId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/users/${userId}/reject`, {
        method: 'PATCH'
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to reject user.'
      };
    }
  }

  async suspendUser(userId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/users/${userId}/suspend`, {
        method: 'PATCH'
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to suspend user.'
      };
    }
  }

  async reactivateUser(userId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/users/${userId}/reactivate`, {
        method: 'PATCH'
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to reactivate user.'
      };
    }
  }

  async promoteToAdmin(userId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/users/${userId}/promote`, {
        method: 'PATCH'
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to promote user to admin.'
      };
    }
  }

  async demoteAdmin(userId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/users/${userId}/demote`, {
        method: 'PATCH'
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to demote admin.'
      };
    }
  }

  async deleteUser(userId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/users/${userId}`, {
        method: 'DELETE'
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to delete user.'
      };
    }
  }

  // Comment methods
  async getComments(postId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/posts/${postId}/comments`);
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to fetch comments.',
        data: []
      };
    }
  }

  async getPostComments(postId: string, params: { page?: number; limit?: number } = {}): Promise<ApiResponse> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const queryParamsStr = queryParams.toString();
      const endpoint = queryParamsStr ? `/posts/${postId}/comments?${queryParamsStr}` : `/posts/${postId}/comments`;
      return await this.request(endpoint);
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to fetch comments.',
        data: []
      };
    }
  }

  async createComment(commentData: {
    postId: string;
    content: string;
    parentId?: string;
  }): Promise<ApiResponse> {
    try {
      const { postId, ...data } = commentData;
      return await this.request(`/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          content: data.content,
          parentCommentId: data.parentId
        }),
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to create comment.',
      };
    }
  }

  async likeComment(commentId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/comments/${commentId}/like`, {
        method: 'POST'
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to like comment.',
      };
    }
  }

  async unlikeComment(commentId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/comments/${commentId}/like`, {
        method: 'DELETE'
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to unlike comment.',
      };
    }
  }

  async deleteComment(commentId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/comments/${commentId}`, {
        method: 'DELETE'
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to delete comment.',
      };
    }
  }

  // Report methods
  async createReport(reportData: {
    type: string;
    description: string;
    reason: string;
    reportedUser?: string;
    reportedPost?: string;
    reportedComment?: string;
    reportedGroup?: string;
    reportedJob?: string;
  }): Promise<ApiResponse> {
    try {
      return await this.request('/reports', {
        method: 'POST',
        body: JSON.stringify(reportData)
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to create report.',
      };
    }
  }

  async getReports(params: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
  } = {}): Promise<ApiResponse> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const queryParamsStr = queryParams.toString();
      const endpoint = queryParamsStr ? `/reports?${queryParamsStr}` : '/reports';
      return await this.request(endpoint);
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to fetch reports.',
        data: []
      };
    }
  }

  async updateReportStatus(reportId: string, status: string, adminNotes?: string): Promise<ApiResponse> {
    try {
      return await this.request(`/reports/${reportId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, adminNotes })
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to update report status.',
      };
    }
  }

  async deleteReport(reportId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/reports/${reportId}`, {
        method: 'DELETE'
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to delete report.',
      };
    }
  }

  async getReportStats(): Promise<ApiResponse> {
    try {
      return await this.request('/reports/stats');
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to fetch report statistics.',
        data: {
          total: 0,
          pending: 0,
          statusStats: [],
          typeStats: []
        }
      };
    }
  }

  // File upload method
  async uploadFile(file: File): Promise<ApiResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseURL}/upload`, {
        method: 'POST',
        headers: {
          ...(this.accessToken && { Authorization: `Bearer ${this.accessToken}` }),
        },
        body: formData
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.warn('Failed to parse JSON response in uploadFile:', e);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data?.message ?? `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to upload file.',
      };
    }
  }

  // Group methods
  async createGroup(groupData: {
    name: string;
    description: string;
    privacy?: string;
    category?: string;
  }): Promise<ApiResponse> {
    try {
      return await this.request('/groups', {
        method: 'POST',
        body: JSON.stringify(groupData),
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to create group.',
      };
    }
  }

  async getGroups(params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
  } = {}): Promise<ApiResponse> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const queryParamsStr = queryParams.toString();
      const endpoint = queryParamsStr ? `/groups?${queryParamsStr}` : '/groups';
      return await this.request(endpoint);
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to fetch groups.',
        data: []
      };
    }
  }

  async getUserGroups(): Promise<ApiResponse> {
    try {
      return await this.request('/groups/my-groups');
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to fetch user groups.',
        data: []
      };
    }
  }

  async getGroupMessages(groupId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/groups/${groupId}/messages`);
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to fetch group messages.',
        data: []
      };
    }
  }

  async joinGroup(groupId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/groups/${groupId}/join`, {
        method: 'POST'
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to join group.'
      };
    }
  }

  async leaveGroup(groupId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/groups/${groupId}/leave`, {
        method: 'POST'
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to leave group.'
      };
    }
  }

  async getGroupById(groupId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/groups/${groupId}`);
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to fetch group.',
      };
    }
  }

  async sendGroupMessage(groupId: string, content: string): Promise<ApiResponse> {
    try {
      return await this.request(`/groups/${groupId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content })
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to send message.'
      };
    }
  }

  // Connection methods
  async getUserConnections(userId?: string): Promise<ApiResponse> {
    try {
      const endpoint = userId ? `/users/${userId}/connections` : '/users/me/connections';
      return await this.request(endpoint);
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to fetch connections.',
        data: []
      };
    }
  }

  async sendConnectionRequest(userId: string): Promise<ApiResponse> {
    try {
      return await this.request('/connections/request', {
        method: 'POST',
        body: JSON.stringify({ userId })
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to send connection request.'
      };
    }
  }

  async acceptConnectionRequest(requestId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/connections/${requestId}/accept`, {
        method: 'PATCH'
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to accept connection request.'
      };
    }
  }

  async rejectConnectionRequest(requestId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/connections/${requestId}/reject`, {
        method: 'PATCH'
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to reject connection request.'
      };
    }
  }

  async removeConnection(connectionId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/connections/${connectionId}`, {
        method: 'DELETE'
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to remove connection.'
      };
    }
  }

  async getConnectionRequests(): Promise<ApiResponse> {
    try {
      return await this.request('/connections/requests');
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to fetch connection requests.',
        data: []
      };
    }
  }

  async getReceivedConnectionRequests(): Promise<ApiResponse> {
    try {
      return await this.request('/connections/requests/received');
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to fetch received connection requests.',
        data: []
      };
    }
  }

  async getSentConnectionRequests(): Promise<ApiResponse> {
    try {
      return await this.request('/connections/requests/sent');
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to fetch sent connection requests.',
        data: []
      };
    }
  }

  async getConnectionStatus(userId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/connections/${userId}/status`);
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to fetch connection status.',
      };
    }
  }

  // Mentorship methods
  async getMentorshipProfiles(params: {
    page?: number;
    limit?: number;
    expertiseArea?: string;
    availability?: string;
  } = {}): Promise<ApiResponse> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/mentorship?${queryString}` : '/mentorship';
      return await this.request(endpoint);
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to fetch mentorship profiles.',
        data: []
      };
    }
  }

  async createMentorshipProfile(profileData: {
    expertiseAreas: string[];
    bio: string;
    availability: string;
    preferredCommunication: string[];
  }): Promise<ApiResponse> {
    try {
      return await this.request('/mentorship/profile', {
        method: 'POST',
        body: JSON.stringify(profileData)
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to create mentorship profile.'
      };
    }
  }

  async requestMentorship(mentorId: string, data: {
    message: string;
    topics: string[];
    preferredSchedule?: string;
  }): Promise<ApiResponse> {
    try {
      return await this.request(`/mentorship/request/${mentorId}`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to send mentorship request.'
      };
    }
  }

  async getMentorRequests(): Promise<ApiResponse> {
    try {
      return await this.request('/mentorship/requests/mentor');
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to fetch mentor requests.'
      };
    }
  }

  async getMenteeRequests(): Promise<ApiResponse> {
    try {
      return await this.request('/mentorship/requests/mentee');
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to fetch mentee requests.'
      };
    }
  }

  async respondToMentorshipRequest(requestId: string, action: 'accept' | 'reject'): Promise<ApiResponse> {
    try {
      return await this.request(`/mentorship/request/${requestId}/${action}`, {
        method: 'POST'
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to respond to mentorship request.'
      };
    }
  }

  // Event methods
  async getEvents(params: {
    page?: number;
    limit?: number;
    category?: string;
    upcoming?: boolean;
  } = {}): Promise<ApiResponse> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/events?${queryString}` : '/events';
      return await this.request(endpoint);
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to fetch events.',
        data: []
      };
    }
  }

  async createEvent(eventData: {
    title: string;
    description: string;
    date: string;
    location: string;
    category: string;
  }): Promise<ApiResponse> {
    try {
      return await this.request('/events', {
        method: 'POST',
        body: JSON.stringify(eventData)
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to create event.'
      };
    }
  }

  async registerForEvent(eventId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/events/${eventId}/register`, {
        method: 'POST'
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to register for event.'
      };
    }
  }

  async rsvpEvent(eventId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/events/${eventId}/rsvp`, {
        method: 'POST'
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to RSVP for event.'
      };
    }
  }

  async saveJob(jobId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/jobs/${jobId}/save`, {
        method: 'POST'
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to save job.'
      };
    }
  }

  async unsaveJob(jobId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/jobs/${jobId}/save`, {
        method: 'DELETE'
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to unsave job.'
      };
    }
  }

  // Job API methods
  async getJobs(params?: { limit?: number; page?: number; isActive?: boolean }): Promise<ApiResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/jobs?${queryString}` : '/jobs';
      return await this.request(endpoint);
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to fetch jobs.',
        data: []
      };
    }
  }

  async createJob(jobData: any): Promise<ApiResponse> {
    try {
      return await this.request('/jobs', {
        method: 'POST',
        body: JSON.stringify(jobData)
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to create job.'
      };
    }
  }

  async getSavedJobs(): Promise<ApiResponse> {
    try {
      return await this.request('/jobs/saved');
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to fetch saved jobs.',
        data: []
      };
    }
  }

  async getAppliedJobs(): Promise<ApiResponse> {
    try {
      return await this.request('/jobs/applied');
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to fetch applied jobs.',
        data: []
      };
    }
  }

  async applyToJob(jobId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/jobs/${jobId}/apply`, {
        method: 'POST'
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message ?? 'Failed to apply to job.'
      };
    }
  }
}

export default new ApiService();