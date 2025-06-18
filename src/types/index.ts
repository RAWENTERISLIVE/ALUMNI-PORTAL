// User types
export interface User {
  id: string;
  name: string;
  email: string;
  admissionNumber: string;
  graduationYear?: number;
  course?: string;
  profileImage?: string;
  bio?: string;
  role: 'user' | 'admin' | 'super_admin';
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  linkedInUrl?: string;
  githubUrl?: string;
  twitterUrl?: string;
  website?: string;
  skills?: string[];
  interests?: string[];
  createdAt: string;
  updatedAt: string;
}

// Post types
export interface PostAuthor {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
}

export interface Post {
  id: string;
  title?: string;
  content: string;
  author: PostAuthor;
  category?: string;
  imageUrl?: string;
  isFeatured: boolean;
  isSchoolUpdate: boolean;
  likes: string[];
  visibility: 'public' | 'alumni_only' | 'private';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Job types
export interface JobAuthor {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
}

export interface Job {
  id: string;
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
  requirements: string[];
  benefits?: string[];
  postedBy: string;
  postedByName: string;
  applicationUrl?: string;
  contactEmail?: string;
  isAlumniReferral: boolean;
  applicationDeadline?: string;
  isActive: boolean;
  applicationCount: number;
  savedBy: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Form types
export interface PostFormData {
  title?: string;
  content: string;
  category?: string;
  imageUrl?: string;
  visibility: 'public' | 'alumni_only' | 'private';
  tags: string[];
}

export interface JobFormData {
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
  requirements: string[];
  benefits?: string[];
  applicationUrl?: string;
  contactEmail?: string;
  isAlumniReferral: boolean;
  applicationDeadline?: string;
  tags: string[];
}
