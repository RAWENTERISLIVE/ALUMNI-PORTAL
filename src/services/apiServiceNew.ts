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
  private baseURL: string;
  private accessToken: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.accessToken = localStorage.getItem('accessToken');
  }

  setAccessToken(token: string) {
    this.accessToken = token;
    localStorage.setItem('accessToken', token);
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
            this.handleLogout();
            throw new Error('Session expired. Please login again.');
          }
        }
        
        const error = data?.message || data?.error || `HTTP error! status: ${response.status}`;
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
    content: string;
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
      return await this.request('/users/me');
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch user data.',
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

  async getUserById(userId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/users/${userId}`);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch user.',
      };
    }
  }

  // Comment methods (stub for future implementation)
  async getComments(postId: string): Promise<ApiResponse> {
    try {
      return await this.request(`/comments/post/${postId}`);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch comments.',
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
      return await this.request('/comments', {
        method: 'POST',
        body: JSON.stringify(commentData),
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to create comment.',
      };
    }
  }
}

const apiService = new ApiService();
export default apiService;
