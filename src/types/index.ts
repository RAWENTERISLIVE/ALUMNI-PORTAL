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

export interface Company {
  name: string;
  logo?: string;
}

export interface Job {
  id: string;
  _id?: string; // For MongoDB compatibility
  title: string;
  company: string | Company;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance' | 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Remote';
  salary?: string;
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
  postedDate?: string;
  isActive: boolean;
  applicationCount?: number;
  applicants?: string[];
  savedBy?: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  experienceLevel?: string;
  category?: string;
  alumni?: number;
  isSaved?: boolean;
}

// API Response types
export interface ApiResponse<T = unknown> {
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

// Connection types
export type ConnectionStatus = 'none' | 'pending' | 'connected' | 'self';

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

// Mentorship types
export interface MentorshipProfile {
  id: string;
  _id?: string;
  userId: {
    id: string;
    name: string;
    firstName?: string;
    lastName?: string;
    email: string;
    profileImage?: string;
    graduationYear?: number;
    title?: string;
  };
  expertise: string[];
  experience: string;
  bio: string;
  availability: string;
  rating?: number;
  reviewCount?: number;
  isMentor: boolean;
  isActive: boolean;
  industry?: string;
  yearsOfExperience?: number;
  maxMentees?: number;
  currentMentees?: number;
  communicationPreferences?: string[];
}

export interface MentorshipRequest {
  id: string;
  mentorId: string;
  menteeId: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface MentorshipRelationship {
  id: string;
  mentor: MentorshipProfile;
  mentee: {
    id: string;
    name: string;
    email?: string;
  };
  status: 'active' | 'paused' | 'completed';
  topics: string[];
  nextSession?: string;
  createdAt: string;
}

// Form data types for mentorship features
export interface MentorshipFormData {
  expertise: string[];
  experience: string;
  bio: string;
  availability: string;
  industry?: string;
  yearsOfExperience?: number;
  maxMentees?: number;
  communicationPreferences?: string[];
}

export interface MentorshipRequestData {
  message: string;
  topics?: string[];
}
