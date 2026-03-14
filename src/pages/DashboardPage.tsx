import { useState, useEffect } from 'react';
import { Plus, Users, Briefcase, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { CreatePostForm } from '@/components/posts/CreatePostFormNew';
import { PostCard } from '@/components/posts/PostCardNew';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/apiService';

export default function DashboardPage() {
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  const quickActions = [
    {
      title: 'Browse Jobs',
      description: 'Find career opportunities',
      icon: Briefcase,
      href: '/jobs',
      color: 'border-border hover:border-primary/40 hover:bg-primary/5'
    },
    {
      title: 'Join Groups',
      description: 'Connect with like-minded alumni',
      icon: Users,
      href: '/groups',
      color: 'border-border hover:border-primary/40 hover:bg-primary/5'
    },
    {
      title: 'Find Mentors',
      description: 'Get guidance from experienced alumni',
      icon: BookOpen,
      href: '/mentorship',
      color: 'border-border hover:border-primary/40 hover:bg-primary/5'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 break-words">
            Welcome back{currentUser?.name ? `, ${currentUser.name.split(' ')[0]}` : ''}! 👋
          </h1>
          <p className="text-muted-foreground">
            Stay connected with your alumni network and discover new opportunities.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Post Section */}
            {isAuthenticated && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Share an Update
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CreatePostForm
                    onPostCreated={handlePostCreated}
                    trigger={
                      <Button 
                        size="lg" 
                        className="w-full justify-start gap-3 bg-muted/30 border-2 border-border hover:border-blue-300 hover:bg-primary/5 text-foreground/90 font-medium"
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
              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-foreground">
                      Featured Posts
                    </CardTitle>
                    <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
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
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Recent Posts
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      globalThis.location.href = '/posts';
                    }}
                    className="border-border/80 text-foreground/90 hover:bg-muted/30"
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
                  <div className="text-center py-8 text-muted-foreground">
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
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.href}
                      onClick={() => {
                        globalThis.location.href = action.href;
                      }}
                      className={`w-full p-4 border-2 rounded-lg text-left transition-all duration-200 ${action.color}`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">{action.title}</p>
                          <p className="text-sm text-muted-foreground">{action.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* User Profile Summary */}
            {isAuthenticated && currentUser && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Your Profile
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-semibold">
                          {currentUser.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{currentUser.name}</p>
                        <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full border-border/80 text-foreground/90 hover:bg-muted/30"
                      onClick={() => {
                        globalThis.location.href = '/profile';
                      }}
                    >
                      View Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
