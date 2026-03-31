const rawApiUrl = import.meta.env.VITE_API_URL?.trim();
const API_BASE_URL = rawApiUrl
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/+$/, '')}/api`)
  : '/api';

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
  unseenCount?: number;
  importedCount?: number;
  skippedCount?: number;
}

class ApiService {
  private baseURL: string;
  private accessToken: string | null = null;

  private sanitizeProfilePayload(input: any) {
    const payload = input || {};

    return {
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.bio !== undefined ? { bio: payload.bio } : {}),
      ...(payload.headline !== undefined ? { headline: payload.headline } : {}),
      ...(payload.city !== undefined ? { city: payload.city } : {}),
      ...(payload.country !== undefined ? { country: payload.country } : {}),
      ...(payload.company !== undefined ? { company: payload.company } : {}),
      ...((payload.jobTitle ?? payload.position) !== undefined
        ? { jobTitle: payload.jobTitle ?? payload.position }
        : {}),
      ...(payload.contactEmail !== undefined ? { contactEmail: payload.contactEmail } : {}),
      ...(payload.contactPhone !== undefined ? { contactPhone: payload.contactPhone } : {}),
      ...((payload.linkedInProfile ?? payload.linkedin) !== undefined
        ? { linkedInProfile: payload.linkedInProfile ?? payload.linkedin }
        : {}),
      ...(payload.profileImage !== undefined ? { profileImage: payload.profileImage } : {}),
      ...(payload.location !== undefined ? { location: payload.location } : {}),
      ...((payload.isAvailableAsMentor ?? payload.availableAsMentor) !== undefined
        ? { isAvailableAsMentor: payload.isAvailableAsMentor ?? payload.availableAsMentor }
        : {}),
      ...(payload.experiences !== undefined ? { experiences: payload.experiences } : {}),
      ...(payload.educations !== undefined ? { educations: payload.educations } : {}),
      ...(payload.skills !== undefined ? { skills: payload.skills } : {}),
      ...(payload.interests !== undefined ? { interests: payload.interests } : {}),
      ...(payload.privacySettings !== undefined ? { privacySettings: payload.privacySettings } : {}),
      ...(payload.notificationSettings !== undefined ? { notificationSettings: payload.notificationSettings } : {}),
    };
  }

  constructor() {
    this.baseURL = API_BASE_URL;
    this.accessToken = localStorage.getItem('accessToken');
  }

  setAccessToken(token: string) {
    this.accessToken = token;
    localStorage.setItem('accessToken', token);
  }

  clearAuthState() {
    this.accessToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
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
          data = JSON.parse(textData);
        } catch (e) {
          data = { success: false, message: textData || 'Unknown server error' };
        }
      }
      
      console.log('API Response:', { 
        status: response.status, 
        url: response.url, 
        success: data?.success
      });

      if (!response.ok) {
        if (response.status === 401 && this.accessToken) {
          console.log('Token expired, attempting refresh...');
          const refreshed = await this.refreshToken();
          if (refreshed) {
            return this.request(endpoint, options);
          } else {
            this.handleSessionExpired();
            throw new Error('Session expired. Please login again.');
          }
        }

        const error = this.extractApiErrorMessage(data, response.status);
        throw new Error(error);
      }

      return data;
    } catch (error: any) {
      console.error('API Error:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection and try again.');
      }
      
      throw error;
    }
  }

  private extractApiErrorMessage(data: any, status: number): string {
    const fallback = data?.message || data?.error || `HTTP error! status: ${status}`;
    if (fallback !== 'Validation error') return fallback;

    if (!Array.isArray(data?.errors) || data.errors.length === 0) {
      return fallback;
    }

    return data.errors[0]?.msg || data.errors[0]?.message || fallback;
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return false;

      const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-refresh-token': refreshToken,
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.accessToken) {
          this.setAccessToken(data.accessToken);
          const nextRefreshToken = data.refreshToken || data.data?.refreshToken;
          if (nextRefreshToken) {
            localStorage.setItem('refreshToken', nextRefreshToken);
          }
          return true;
        }
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    return false;
  }

  private handleLogout() {
    this.clearAuthState();
  }

  private handleSessionExpired() {
    this.clearAuthState();
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
        message: error.message || 'Login failed. Please try again.',
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
        message: error.message || 'Registration failed. Please try again.',
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
    content?: string;
    category?: string;
    visibility?: string;
    tags?: string[];
    attachments?: any[];
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
        message: error.message || 'Failed to create post. Please try again.',
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

      const endpoint = `/posts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await this.request(endpoint);
    } catch (error: any) {
      console.error('Get posts error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch posts.',
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
        message: error.message || 'Failed to fetch post.',
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
        message: error.message || 'Failed to update post.',
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
        message: error.message || 'Failed to delete post.',
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
        message: error.message || 'Failed to react to post.',
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
        message: error.message || 'Failed to bookmark post.',
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
        message: error.message || 'Failed to share post.',
      };
    }
  }

  async importLinkedInPosts(payload: {
    linkedInProfile?: string;
    posts: Array<{
      title?: string;
      content: string;
      postUrl?: string;
      publishedAt?: string;
    }>;
  }): Promise<ApiResponse> {
    try {
      return await this.request('/posts/import-linkedin', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to import LinkedIn posts.',
      };
    }
  }

  async getLinkedInOAuthUrl(): Promise<ApiResponse<{ url: string }>> {
    try {
      return await this.request<{ url: string }>('/linkedin/oauth-url');
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to start LinkedIn OAuth.',
      };
    }
  }

  async getLinkedInOAuthStatus(): Promise<ApiResponse<{
    state: 'pending' | 'success' | 'error';
    message?: string;
    profile?: {
      name?: string;
      firstName?: string;
      lastName?: string;
      profileImage?: string;
      contactEmail?: string;
      linkedInProfile?: string;
    };
    updatedAt: number;
  }>> {
    try {
      return await this.request('/linkedin/oauth-status');
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch LinkedIn OAuth status.',
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

      const endpoint = `/posts/feed${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await this.request(endpoint);
    } catch (error: any) {
      console.error('Get feed posts error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch feed posts.',
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

      const endpoint = `/posts/bookmarked${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await this.request(endpoint);
    } catch (error: any) {
      console.error('Get bookmarked posts error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch bookmarked posts.',
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

      const endpoint = `/posts/featured${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await this.request(endpoint);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch featured posts.',
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

      const endpoint = `/posts/school-updates${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await this.request(endpoint);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch school updates.',
        data: []
      };
    }
  }

  // User methods
  async getCurrentUser(): Promise<ApiResponse> {
    try {
      const response = await this.request('/auth/me');
      if (response.success && !response.user && response.data) {
        return { ...response, user: response.data };
      }
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch user data.',
      };
    }
  }

  async updateUserProfile(userId: string, data: any): Promise<ApiResponse> {
    try {
      const profileData = this.sanitizeProfilePayload(data);
      return await this.request(`/users/${userId}/profile`, {
        method: 'PATCH',
        body: JSON.stringify(profileData)
      });
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to update user profile.' };
    }
  }
  async updateProfile(userData: any): Promise<ApiResponse> {
    try {
      const profileData = this.sanitizeProfilePayload(userData);
      return await this.request('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(profileData),
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to update profile.',
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

      const endpoint = `/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await this.request(endpoint);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch users.',
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

  async getAlumniDirectory(params: {
    page?: number;
    limit?: number;
    search?: string;
    graduationYear?: string;
    company?: string;
    location?: string;
  } = {}): Promise<ApiResponse> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const query = queryParams.toString();
      const endpoint = query ? `/users/directory?${query}` : '/users/directory';
      return await this.request(endpoint);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch alumni directory.',
        data: []
      };
    }
  }

  async getUserById(userId: string): Promise<ApiResponse> {
    try {
      const response = await this.request(`/users/${userId}`);
      if (response.success && !response.user && response.data) {
        return { ...response, user: response.data };
      }
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch user.',
      };
    }
  }

  async getPendingUsers(): Promise<ApiResponse> {
    try {
      return await this.request('/users/pending');
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch pending users.',
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
        message: error.message || 'Failed to fetch user statistics.',
        data: {
          total: 0,
          approved: 0,
          pending: 0,
          suspended: 0,
          moderatorUsers: 0
        }
      };
    }
  }

  async getUserSuggestions(limit?: number): Promise<ApiResponse> {
    try {
      const endpoint = `/users/suggestions${limit ? `?limit=${limit}` : ''}`;
      return await this.request(endpoint);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch user suggestions.',
        data: []
      };
    }
  }

  async connectWithUser(userId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/users/${userId}/connect`, {
        method: 'POST'
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to connect with user.'
      };
    }
  }

  async acceptConnectionRequest(userId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/users/${userId}/connect/accept`, {
        method: 'POST'
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to accept connection request.'
      };
    }
  }

  async disconnectFromUser(userId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/users/${userId}/connect`, {
        method: 'DELETE'
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to disconnect from user.'
      };
    }
  }

  async followUser(userId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/users/${userId}/follow`, {
        method: 'POST'
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to follow user.'
      };
    }
  }

  async unfollowUser(userId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/users/${userId}/follow`, {
        method: 'DELETE'
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to unfollow user.'
      };
    }
  }

  async getDirectConversations(): Promise<ApiResponse> {
    try {
      return await this.request('/users/messages/conversations');
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch conversations.',
        data: []
      };
    }
  }

  async getDirectMessages(userId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/users/messages/${userId}`);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch messages.',
        data: []
      };
    }
  }

  async sendDirectMessage(userId: string, content: string): Promise<ApiResponse> {
    try {
      return await this.request(`/users/messages/${userId}`, {
        method: 'POST',
        body: JSON.stringify({ content })
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to send message.'
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
        message: error.message || 'Failed to approve user.'
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
        message: error.message || 'Failed to reject user.'
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
        message: error.message || 'Failed to suspend user.'
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
        message: error.message || 'Failed to reactivate user.'
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
        message: error.message || 'Failed to promote user to admin.'
      };
    }
  }

  async promoteToModerator(userId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/users/${userId}/promote-moderator`, {
        method: 'PATCH'
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to promote user to moderator.'
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
        message: error.message || 'Failed to demote admin.'
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
        message: error.message || 'Failed to delete user.'
      };
    }
  }

  async setPremiumBadge(userId: string, enabled: boolean): Promise<ApiResponse> {
    try {
      return await this.request(`/users/${userId}/premium-badge`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled })
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to update premium badge.'
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
        message: error.message || 'Failed to fetch comments.',
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

      const endpoint = `/posts/${postId}/comments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await this.request(endpoint);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch comments.',
        data: []
      };
    }
  }

  async createComment(
    commentDataOrPostId: {
      postId: string;
      content: string;
      parentId?: string;
      parentCommentId?: string;
    } | string,
    payload?: {
      content: string;
      parentId?: string;
      parentCommentId?: string;
    }
  ): Promise<ApiResponse> {
    try {
      const commentData = typeof commentDataOrPostId === 'string'
        ? { postId: commentDataOrPostId, ...(payload || {}) }
        : commentDataOrPostId;

      const { postId, ...data } = commentData;
      return await this.request(`/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          content: data.content,
          parentCommentId: data.parentCommentId ?? data.parentId
        }),
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to create comment.',
      };
    }
  }

  async getCommentReplies(commentId: string, params: { page?: number; limit?: number } = {}): Promise<ApiResponse> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const endpoint = `/comments/${commentId}/replies${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await this.request(endpoint);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch comment replies.',
        data: []
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
        message: error.message || 'Failed to like comment.',
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
        message: error.message || 'Failed to unlike comment.',
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
        message: error.message || 'Failed to delete comment.',
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
        message: error.message || 'Failed to create report.',
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

      const endpoint = `/reports${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await this.request(endpoint);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch reports.',
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
        message: error.message || 'Failed to update report status.',
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
        message: error.message || 'Failed to delete report.',
      };
    }
  }

  async getReportStats(): Promise<ApiResponse> {
    try {
      return await this.request('/reports/stats');
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch report statistics.',
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
    const sendUploadRequest = async () => {
      const formData = new FormData();
      formData.append('file', file);

      return fetch(`${this.baseURL}/uploads/single`, {
        method: 'POST',
        headers: {
          ...(this.accessToken && { Authorization: `Bearer ${this.accessToken}` }),
        },
        body: formData
      });
    };

    try {
      let response = await sendUploadRequest();

      if (response.status === 401 && this.accessToken) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          response = await sendUploadRequest();
        }
      }

      let data: any = null;
      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch {
          data = null;
        }
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: text };
        }
      }

      if (!response.ok) {
        const errorMessage =
          data?.message ||
          data?.error ||
          (response.status === 401
            ? 'Session expired. Please login again.'
            : `Upload failed (HTTP ${response.status})`);
        throw new Error(errorMessage);
      }

      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to upload file.',
      };
    }
  }

  async uploadVerificationIdCard(file: File): Promise<ApiResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseURL}/auth/upload-verification-id`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Failed to upload faculty ID card.');
      }

      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to upload faculty ID card.',
      };
    }
  }

  // Group methods
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

      const endpoint = `/groups${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await this.request(endpoint);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch groups.',
        data: []
      };
    }
  }

  async getUserGroups(): Promise<ApiResponse> {
    try {
      return await this.request('/groups/user');
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch user groups.',
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
        message: error.message || 'Failed to fetch group messages.',
        data: []
      };
    }
  }

  async getGroup(groupId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/groups/${groupId}`);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch group details.'
      };
    }
  }

  async updateGroup(groupId: string, data: {
    name?: string;
    description?: string;
    category?: string;
    privacy?: 'public' | 'private';
  }): Promise<ApiResponse> {
    try {
      return await this.request(`/groups/${groupId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to update group settings.'
      };
    }
  }

  // Job methods

  async getJobs(params: {
    page?: number;
    limit?: number;
    search?: string;
    location?: string;
  } = {}): Promise<ApiResponse> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const endpoint = `/jobs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await this.request(endpoint);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch jobs.',
        data: []
      };
    }
  }

  async getJob(jobId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/jobs/${jobId}`);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch job.'
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
        message: error.message || 'Failed to create job.'
      };
    }
  }

  async saveJob(jobId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/jobs/${jobId}/save`, { method: 'POST' });
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to save job.'
      };
    }
  }

  async unsaveJob(jobId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/jobs/${jobId}/save`, { method: 'DELETE' });
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to remove saved job.'
      };
    }
  }

  async applyToJob(
    jobId: string,
    applicationData: {
      coverLetter?: string;
      resumeUrl?: string;
      resumeFilename?: string;
      portfolioUrl?: string;
    } = {}
  ): Promise<ApiResponse> {
    try {
      return await this.request(`/jobs/${jobId}/apply`, {
        method: 'POST',
        body: JSON.stringify(applicationData)
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to apply for job.'
      };
    }
  }


  async getSavedJobs(): Promise<ApiResponse> {
    try {
      return await this.request('/jobs/saved');
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch saved jobs.',
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
        message: error.message || 'Failed to fetch applied jobs.',
        data: []
      };
    }
  }

  async getJobApplications(jobId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/jobs/${jobId}/applications`);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch job applications.',
        data: []
      };
    }
  }

  async getJobStats(): Promise<ApiResponse> {
    try {
      return await this.request('/jobs/stats');
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch job statistics.',
        data: { total: 0, active: 0, applications: 0, posted: 0 }
      };
    }
  }

  async getPostStats(): Promise<ApiResponse> {
    try {
      return await this.request('/posts/stats');
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch post statistics.',
        data: { total: 0, today: 0, thisWeek: 0, thisMonth: 0 }
      };
    }
  }

  // --- Mentorship Endpoints ---

  async getMentors(query?: any): Promise<ApiResponse> {
    try {
      const queryString = query ? '?' + new URLSearchParams(query).toString() : '';
      return await this.request(`/mentorship/mentors${queryString}`);
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to fetch mentors.' };
    }
  }

  async becomeMentor(data: any): Promise<ApiResponse> {
    try {
      return await this.request('/mentorship/become-mentor', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to create mentor profile.' };
    }
  }

  async getMentorshipProfile(): Promise<ApiResponse> {
    try {
      return await this.request('/mentorship/profile');
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to fetch mentor profile.' };
    }
  }

  async requestMentorship(
    mentorId: string,
    message: string,
    topic?: string,
    options?: {
      sessionMode?: 'chat' | 'video' | 'meet';
      selectedSlot?: { day: string; startTime: string; endTime: string } | null;
    }
  ): Promise<ApiResponse> {
    try {
      return await this.request(`/mentorship/request/${mentorId}`, {
        method: 'POST',
        body: JSON.stringify({
          message,
          topic,
          sessionMode: options?.sessionMode,
          selectedSlot: options?.selectedSlot || null,
        })
      });
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to request mentorship.' };
    }
  }

  async respondToRequest(requestId: string, action: 'accept' | 'reject'): Promise<ApiResponse> {
    try {
      return await this.request(`/mentorship/request/${requestId}/${action}`, {
        method: 'POST'
      });
    } catch (error: any) {
      return { success: false, message: error.message || `Failed to ${action} request.` };
    }
  }
  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    try {
      return await this.request('/auth/change-password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword })
      });
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to change password.' };
    }
  }

  async getActiveSessions(): Promise<ApiResponse> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      return await this.request('/auth/sessions', {
        method: 'GET',
        headers: {
          ...(refreshToken ? { 'x-refresh-token': refreshToken } : {}),
        },
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch active sessions.',
        data: { sessions: [], totalSessions: 0, otherSessionsCount: 0 },
      };
    }
  }

  async logoutOtherSessions(): Promise<ApiResponse> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      return await this.request('/auth/logout-other-sessions', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to sign out other devices.' };
    }
  }

  async deactivateAccount(): Promise<ApiResponse> {
    try {
      return await this.request('/auth/deactivate-account', {
        method: 'PATCH',
      });
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to deactivate account.' };
    }
  }

  async updateNotificationSettings(data: any): Promise<ApiResponse> {
    try {
      return await this.request('/auth/notification-settings', {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to update notification settings.' };
    }
  }

  async getNotifications(limit = 20): Promise<ApiResponse> {
    try {
      return await this.request(`/notifications?limit=${limit}`);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch notifications.',
        data: [],
      };
    }
  }

  async markNotificationSeen(notificationId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/notifications/${notificationId}/seen`, {
        method: 'PATCH'
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to mark notification as seen.'
      };
    }
  }

  async markAllNotificationsSeen(): Promise<ApiResponse> {
    try {
      return await this.request('/notifications/mark-all-seen', {
        method: 'PATCH'
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to mark all notifications as seen.'
      };
    }
  }

  async dismissNotification(notificationId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/notifications/${notificationId}`, {
        method: 'DELETE'
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to dismiss notification.'
      };
    }
  }

  async updatePrivacySettings(data: any): Promise<ApiResponse> {
    try {
      return await this.request('/auth/privacy-settings', {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to update privacy settings.' };
    }
  }
  async createGroup(groupData: any): Promise<ApiResponse> {
    try {
      return await this.request('/groups', {
        method: 'POST',
        body: JSON.stringify(groupData)
      });
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to create group.' };
    }
  }

  async joinGroup(groupId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/groups/${groupId}/join`, { method: 'POST' });
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to join group.' };
    }
  }

  async leaveGroup(groupId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/groups/${groupId}/leave`, { method: 'POST' });
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to leave group.' };
    }
  }

  async deleteGroup(groupId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/groups/${groupId}`, { method: 'DELETE' });
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to delete group.' };
    }
  }

  async sendGroupMessage(groupId: string, message: string): Promise<ApiResponse> {
    try {
      const content = message.trim();
      return await this.request(`/groups/${groupId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content })
      });
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to send message.' };
    }
  }

  async getGroupJoinRequests(groupId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/groups/${groupId}/join-requests`);
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to fetch group join requests.', data: [] };
    }
  }

  async respondToGroupJoinRequest(groupId: string, requestId: string, action: 'approve' | 'reject'): Promise<ApiResponse> {
    try {
      return await this.request(`/groups/${groupId}/join-requests/${requestId}/respond`, {
        method: 'PATCH',
        body: JSON.stringify({ action })
      });
    } catch (error: any) {
      return { success: false, message: error.message || `Failed to ${action} join request.` };
    }
  }

  async inviteGroupMember(groupId: string, payload: { email?: string; userId?: string }): Promise<ApiResponse> {
    try {
      return await this.request(`/groups/${groupId}/invite`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to invite user to group.' };
    }
  }

  async getInvitableUsers(groupId: string, query = '', limit = 20): Promise<ApiResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (query.trim()) queryParams.append('query', query.trim());
      queryParams.append('limit', String(limit));

      return await this.request(`/groups/${groupId}/invitable-users?${queryParams.toString()}`);
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to search users for invitation.', data: [] };
    }
  }

  async createGroupInviteLink(groupId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/groups/${groupId}/invite-link`, {
        method: 'POST'
      });
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to generate invite link.' };
    }
  }

  async acceptGroupInviteLink(token: string): Promise<ApiResponse> {
    try {
      return await this.request('/groups/invite/accept', {
        method: 'POST',
        body: JSON.stringify({ token })
      });
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to accept invite link.' };
    }
  }

  // --- Events API ---
  async getEvents(params?: any): Promise<ApiResponse> {
    try {
      const queryParams = params ? '?' + new URLSearchParams(params).toString() : '';
      return await this.request(`/events${queryParams}`);
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to fetch events.' };
    }
  }

  async getUpcomingEvents(): Promise<ApiResponse> {
    try {
      return await this.request('/events/upcoming');
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to fetch upcoming events.' };
    }
  }

  async getUserEvents(): Promise<ApiResponse> {
    try {
      return await this.request('/events/my-events');
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to fetch user events.' };
    }
  }

  async createEvent(eventData: any): Promise<ApiResponse> {
    try {
      return await this.request('/events', {
        method: 'POST',
        body: JSON.stringify(eventData)
      });
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to create event.' };
    }
  }

  async rsvpEvent(eventId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/events/${eventId}/rsvp`, { method: 'POST' });
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to RSVP.' };
    }
  }

  async cancelRsvp(eventId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/events/${eventId}/rsvp`, { method: 'DELETE' });
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to cancel RSVP.' };
    }
  }

  async getEventAttendees(eventId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/events/${eventId}/attendees`);
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to fetch event attendees.', data: [] };
    }
  }
}

const apiService = new ApiService();
export default apiService;
