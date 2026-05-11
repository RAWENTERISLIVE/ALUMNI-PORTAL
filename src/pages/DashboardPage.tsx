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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
        <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-3 tracking-tight">
            Welcome back{currentUser?.name ? `, ${currentUser.name.split(' ')[0]}` : ''}! 👋
          </h1>
          <p className="text-lg text-muted-foreground font-light">
            Stay connected with the <span className="text-primary font-semibold">Maheshwari Public School, Ajmer</span> community.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Post Section */}
            {isAuthenticated && (
              <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-300 rounded-2xl overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4">
                  <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Plus className="h-5 w-5 text-primary" />
                    Share an Update
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <CreatePostForm
                    onPostCreated={handlePostCreated}
                    trigger={
                      <Button 
                        size="lg" 
                        variant="outline"
                        className="w-full justify-start gap-4 h-14 border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-foreground font-medium rounded-xl transition-all"
                      >
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <Plus className="h-4 w-4" />
                        </div>
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
            <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="text-lg font-bold text-foreground">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.href}
                      onClick={() => {
                        globalThis.location.href = action.href;
                      }}
                      className={`w-full p-4 border border-border rounded-xl text-left transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 group ${action.color}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-background border border-border flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground group-hover:text-primary transition-colors">{action.title}</p>
                          <p className="text-xs text-muted-foreground">{action.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* User Profile Summary */}
            {isAuthenticated && currentUser && (
              <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4">
                  <CardTitle className="text-lg font-bold text-foreground">
                    Your Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14 border-2 border-primary/20 p-1">
                        <AvatarImage src={currentUser.profileImage} className="rounded-full" />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                          {currentUser.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="overflow-hidden">
                        <p className="font-bold text-foreground truncate">{currentUser.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                        {currentUser.role && (
                          <Badge variant="secondary" className="mt-1 text-[10px] uppercase tracking-wider h-5">
                            {currentUser.role.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full border-border hover:bg-primary/5 hover:text-primary font-semibold rounded-xl transition-all"
                      onClick={() => {
                        globalThis.location.href = '/profile';
                      }}
                    >
                      View Full Profile
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
