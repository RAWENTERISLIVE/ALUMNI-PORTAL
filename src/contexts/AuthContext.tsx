import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import apiService from '@/services/apiService';

// Types
export interface ExtendedUser {
  id: string;
  email: string;
  name: string;
  role?: 'user' | 'moderator' | 'admin' | 'super_admin';
  accountType?: 'alumni' | 'faculty';
  hasPremiumBadge?: boolean;
  facultyIdCardUrl?: string;
  admissionNumber?: string;
  admissionYear?: string; // changed from graduationYear
  status?: 'pending' | 'active' | 'suspended' | 'deleted';
  isVerified?: boolean;
  profileImage?: string;
  bio?: string;
  headline?: string;
  city?: string;
  country?: string;
  company?: string;
  jobTitle?: string;
  contactEmail?: string;
  contactPhone?: string;
  linkedInProfile?: string;
  isAvailableAsMentor?: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  notificationSettings?: {
    emailMessages?: boolean;
    emailJobs?: boolean;
    emailEvents?: boolean;
    emailGroups?: boolean;
    pushMessages?: boolean;
    pushJobs?: boolean;
    pushEvents?: boolean;
    pushGroups?: boolean;
  };
  privacySettings?: {
    profileVisibility?: 'public' | 'alumni' | 'connections';
    showEmail?: boolean;
    showPhone?: boolean;
    allowMessaging?: boolean;
    allowConnection?: boolean;
    allowProfileSearch?: boolean;
  };
}

interface AuthContextType {
  currentUser: ExtendedUser | null;
  userProfile: ExtendedUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  register: (userData: {
    email: string;
    password: string;
    name: string;
    admissionNumber?: string;
    needsManualVerification?: boolean;
    forgotAdmissionNumber?: boolean;
    verificationDetails?: string;
    accountType?: 'alumni' | 'faculty';
    facultyIdCardUrl?: string;
    admissionYear?: string; // changed from graduationYear
    graduationYear?: string;
  }) => Promise<any>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyAdmission: (admissionNumber: string) => Promise<boolean>;
  updateProfile: (userId: string, profileData: any) => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Context provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<ExtendedUser | null>(null);
  const [userProfile, setUserProfile] = useState<ExtendedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const storedUser = localStorage.getItem('user');
        
        if (accessToken && storedUser) {
          const user = JSON.parse(storedUser);
          setCurrentUser(user);
          setUserProfile(user);
          
          // Verify token is still valid
          try {
            const response = await apiService.getCurrentUser();
            if (response.success && response.user) {
              const updatedUser = response.user;
              setCurrentUser(updatedUser);
              setUserProfile(updatedUser);
              localStorage.setItem('user', JSON.stringify(updatedUser));
            }
          } catch (error) {
            console.error('Token validation failed:', error);
            // Token is invalid, clear storage
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            setCurrentUser(null);
            setUserProfile(null);
          }
        }
      } catch (error) {
        console.error('Error checking existing session:', error);
        // Clear invalid data
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingSession();
  }, []);

  const verifyAdmission = async (admissionNumber: string): Promise<boolean> => {
    try {
      // For now, return true as verification would need backend implementation
      return true;
    } catch (error) {
      console.error('Admission verification error:', error);
      return false;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('Attempting login for email:', email);
      
      const response = await apiService.login(email, password);
      
      if (response.success && response.user) {
        const user = response.user;
        setCurrentUser(user);
        setUserProfile(user);
        
        toast({
          title: "Login successful",
          description: "Welcome back to AlumniConnect!",
        });

        // Navigate based on role and status
        if (user.role === 'super_admin' || user.role === 'admin' || user.role === 'moderator') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error details:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
      }
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    name: string;
    admissionNumber?: string;
    needsManualVerification?: boolean;
    forgotAdmissionNumber?: boolean;
    verificationDetails?: string;
    accountType?: 'alumni' | 'faculty';
    facultyIdCardUrl?: string;
    admissionYear?: string; // changed from graduationYear
    graduationYear?: string;
  }) => {
    try {
      setIsLoading(true);
      console.log('Attempting registration for email:', userData.email);
      
      const response = await apiService.register(userData);
      
      if (response.success) {
        // Check if user is super admin (gets auto-logged in)
        if (response.user && response.accessToken) {
          const user = response.user;
          setCurrentUser(user);
          setUserProfile(user);
          
          toast({
            title: "Registration successful",
            description: "Super admin account created successfully!",
          });
          
          navigate('/admin');
        } else {
          toast({
            title: "Registration successful",
            description: userData.needsManualVerification 
              ? "Your account is pending manual verification. You'll receive an email once approved."
              : "Your account is pending approval. You'll receive an email once approved.",
          });
          
          navigate('/login');
        }
        return response;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
      
      setCurrentUser(null);
      setUserProfile(null);
      
      toast({
        title: "Logged out",
        description: "You've been successfully logged out.",
      });
      
      navigate('/');
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout request fails, clear local state
      setCurrentUser(null);
      setUserProfile(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      toast({
        title: "Logged out",
        description: "You've been logged out.",
      });
      
      navigate('/');
    }
  };

  const updateProfile = async (userId: string, profileData: any) => {
    try {
      const response = await apiService.updateProfile(profileData);
      
      if (response.success && response.user) {
        const updatedUser = response.user;
        setCurrentUser(updatedUser);
        setUserProfile(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        toast({
          title: "Profile updated",
          description: "Your profile has been successfully updated.",
        });
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const response = await apiService.getCurrentUser();
      if (response.success && response.user) {
        const user = response.user;
        setCurrentUser(user);
        setUserProfile(user);
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const value = {
    currentUser,
    userProfile,
    isLoading,
    isAuthenticated: !!currentUser,
    login,
    register,
    logout,
    verifyAdmission,
    updateProfile,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Create a hook for easy context use
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    if (import.meta.env.DEV) {
      console.warn('useAuth called without AuthProvider during Fast Refresh. Returning temporary fallback context.');
      return {
        currentUser: null,
        userProfile: null,
        isLoading: true,
        isAuthenticated: false,
        register: async () => ({ success: false, message: 'Auth context unavailable during refresh.' }),
        login: async () => {
          throw new Error('Auth context unavailable during refresh.');
        },
        logout: async () => {
          // no-op in refresh fallback
        },
        verifyAdmission: async () => false,
        updateProfile: async () => {
          throw new Error('Auth context unavailable during refresh.');
        },
        refreshUser: async () => {
          // no-op in refresh fallback
        },
      } as AuthContextType;
    }

    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
