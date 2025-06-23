import { useState, useEffect } from 'react';
import { Plus, TrendingUp, Users, Briefcase, Calendar, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { CreatePostForm } from '@/components/posts/CreatePostFormNew';
import { PostCard } from '@/components/posts/PostCardNew';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/apiServiceNew';

export default function DashboardPage() {
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalUsers: 0,
    totalJobs: 0,
    totalEvents: 0
  });
  const { toast } = useToast();
  const { currentUser, isAuthenticated } = useAuth();

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load recent posts
      const postsResponse = await apiService.getPosts({
        page: 1,
        limit: 5,
      });
      
      if (postsResponse.success) {
        setRecentPosts(postsResponse.data || []);
      }

      // Load featured posts
      const featuredResponse = await apiService.getFeaturedPosts({
        page: 1,
        limit: 3,
      });
      
      if (featuredResponse.success) {
        setFeaturedPosts(featuredResponse.data || []);
      }

      // Mock stats for now (these would come from actual APIs)
      setStats({
        totalPosts: postsResponse.pagination?.totalPosts || 0,
        totalUsers: 1250,
        totalJobs: 45,
        totalEvents: 12
      });

    } catch (error: any) {
      console.error('Dashboard load error:', error);
      toast({
        title: "Error loading dashboard",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle post creation
  const handlePostCreated = (newPost: any) => {
    setRecentPosts(prev => [newPost, ...prev.slice(0, 4)]);
    toast({
      title: "Post created successfully!",
      description: "Your post has been shared with the community.",
    });
  };

  // Handle post updates
  const handlePostUpdate = (updatedPost: any) => {
    const updatePostInArray = (postsArray: any[]) => 
      postsArray.map(post => 
        post.id === updatedPost.id ? { ...post, ...updatedPost } : post
      );

    setRecentPosts(prev => updatePostInArray(prev));
    setFeaturedPosts(prev => updatePostInArray(prev));
  };

  // Handle post deletion
  const handlePostDelete = (postId: string) => {
    const removePostFromArray = (postsArray: any[]) => 
      postsArray.filter(post => post.id !== postId);

    setRecentPosts(prev => removePostFromArray(prev));
    setFeaturedPosts(prev => removePostFromArray(prev));
  };

  const quickStats = [
    {
      title: 'Alumni Network',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      href: '/directory'
    },
    {
      title: 'Recent Posts',
      value: stats.totalPosts.toLocaleString(),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      href: '/posts'
    },
    {
      title: 'Job Opportunities',
      value: stats.totalJobs.toString(),
      icon: Briefcase,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      href: '/jobs'
    },
    {
      title: 'Upcoming Events',
      value: stats.totalEvents.toString(),
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      href: '/events'
    }
  ];

  const quickActions = [
    {
      title: 'Browse Jobs',
      description: 'Find career opportunities',
      icon: Briefcase,
      href: '/jobs',
      color: 'border-blue-200 hover:border-blue-300 hover:bg-blue-50'
    },
    {
      title: 'Join Groups',
      description: 'Connect with like-minded alumni',
      icon: Users,
      href: '/groups',
      color: 'border-green-200 hover:border-green-300 hover:bg-green-50'
    },
    {
      title: 'Find Mentors',
      description: 'Get guidance from experienced alumni',
      icon: BookOpen,
      href: '/mentorship',
      color: 'border-purple-200 hover:border-purple-300 hover:bg-purple-50'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome back{currentUser?.name ? `, ${currentUser.name.split(' ')[0]}` : ''}! 👋
          </h1>
          <p className="text-slate-600">
            Stay connected with your alumni network and discover new opportunities.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card 
                key={index} 
                className="bg-white border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => window.location.href = stat.href}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Post Section */}
            {isAuthenticated && (
              <Card className="bg-white border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-900">
                    Share an Update
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CreatePostForm
                    onPostCreated={handlePostCreated}
                    trigger={
                      <Button 
                        size="lg" 
                        className="w-full justify-start gap-3 bg-slate-50 border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 font-medium"
                      >
                        <Plus className="h-5 w-5" />
                        What's on your mind?
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            )}

            {/* Featured Posts */}
            {featuredPosts.length > 0 && (
              <Card className="bg-white border-slate-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-slate-900">
                      Featured Posts
                    </CardTitle>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      Featured
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {featuredPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onPostUpdate={handlePostUpdate}
                      onPostDelete={handlePostDelete}
                    />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Recent Posts */}
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-slate-900">
                    Recent Posts
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.href = '/posts'}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentPosts.length > 0 ? (
                  recentPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onPostUpdate={handlePostUpdate}
                      onPostDelete={handlePostDelete}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <p>No recent posts to display.</p>
                    {isAuthenticated && (
                      <p className="text-sm mt-2">Be the first to share something!</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => window.location.href = action.href}
                      className={`w-full p-4 border-2 rounded-lg text-left transition-all duration-200 ${action.color}`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-slate-600" />
                        <div>
                          <p className="font-medium text-slate-900">{action.title}</p>
                          <p className="text-sm text-slate-600">{action.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* User Profile Summary */}
            {isAuthenticated && currentUser && (
              <Card className="bg-white border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-900">
                    Your Profile
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-700 font-semibold">
                          {currentUser.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{currentUser.name}</p>
                        <p className="text-sm text-slate-600">{currentUser.email}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full border-slate-300 text-slate-700 hover:bg-slate-50"
                      onClick={() => window.location.href = '/profile'}
                    >
                      View Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Platform Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">New members this week</span>
                    <span className="font-medium text-slate-900">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Jobs posted this month</span>
                    <span className="font-medium text-slate-900">28</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Upcoming events</span>
                    <span className="font-medium text-slate-900">5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Active groups</span>
                    <span className="font-medium text-slate-900">18</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
