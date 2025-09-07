import { useState, useEffect, useCallback } from 'react';
import { Plus, TrendingUp, Users, Briefcase, Calendar, BookOpen, RefreshCw, MessageSquare, UserPlus, Clock, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { CreatePostForm } from '@/components/posts/CreatePostFormNew';
import { PostCard } from '@/components/posts/PostCardNew';
import { EmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/apiService';

export default function DashboardPage() {
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 1250,
    totalPosts: 342,
    totalJobs: 45,
    totalEvents: 12,
    totalGroups: 28,
    newMembersThisWeek: 12
  });
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [suggestedConnections, setSuggestedConnections] = useState<any[]>([]);
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const { currentUser, isAuthenticated } = useAuth();

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Load recent posts
      const postsResponse = await apiService.getPosts({
        page: 1,
        limit: 5,
      });
      
      if (postsResponse.success) {
        setRecentPosts(postsResponse.data ?? []);
      }

      // Load featured posts
      const featuredResponse = await apiService.getFeaturedPosts({
        page: 1,
        limit: 3,
      });
      
      if (featuredResponse.success) {
        setFeaturedPosts(featuredResponse.data ?? []);
      }

      // Load additional dashboard data
      await Promise.all([
        loadUpcomingEvents(),
        loadRecentJobs(),
        loadSuggestedConnections(),
        loadUserGroups(),
      ]);

    } catch (error: any) {
      console.error('Dashboard load error:', error);
      toast({
        title: "Error loading dashboard",
        description: error.message ?? "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const loadUpcomingEvents = async () => {
    try {
      // Mock data for now - replace with actual API calls
      setUpcomingEvents([
        {
          id: '1',
          title: 'Alumni Tech Meetup 2025',
          date: '2025-07-15',
          time: '18:00',
          location: 'Mumbai Tech Park',
          attendees: 45,
          maxAttendees: 100
        },
        {
          id: '2',
          title: 'Career Development Workshop',
          date: '2025-07-22',
          time: '14:00',
          location: 'Virtual Event',
          attendees: 78,
          maxAttendees: 150
        },
        {
          id: '3',
          title: 'Annual Alumni Gala',
          date: '2025-08-10',
          time: '19:00',
          location: 'Grand Ballroom, Delhi',
          attendees: 156,
          maxAttendees: 300
        }
      ]);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadRecentJobs = async () => {
    try {
      const response = await apiService.getJobs({ limit: 4, isActive: true });
      if (response.success) {
        setRecentJobs(response.data ?? []);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      // Mock data as fallback
      setRecentJobs([
        {
          id: '1',
          title: 'Senior Software Engineer',
          company: 'TechCorp India',
          location: 'Bangalore',
          type: 'Full-time',
          salary: '$80,000 - $120,000',
          postedDate: '2025-06-20'
        },
        {
          id: '2',
          title: 'Product Manager',
          company: 'StartupXYZ',
          location: 'Remote',
          type: 'Full-time',
          salary: '$90,000 - $130,000',
          postedDate: '2025-06-18'
        },
        {
          id: '3',
          title: 'Data Scientist',
          company: 'Analytics Pro',
          location: 'Mumbai',
          type: 'Full-time',
          salary: '$70,000 - $110,000',
          postedDate: '2025-06-15'
        }
      ]);
    }
  };

  const loadSuggestedConnections = async () => {
    try {
      const response = await apiService.getUserSuggestions(4);
      if (response.success) {
        setSuggestedConnections(response.data ?? []);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
      // Mock data as fallback
      setSuggestedConnections([
        {
          id: '1',
          name: 'Priya Sharma',
          title: 'Software Engineer at Google',
          graduationYear: 2019,
          mutualConnections: 5,
          profileImage: ''
        },
        {
          id: '2',
          name: 'Raj Patel',
          title: 'Product Manager at Meta',
          graduationYear: 2018,
          mutualConnections: 8,
          profileImage: ''
        },
        {
          id: '3',
          name: 'Aisha Khan',
          title: 'UX Designer at Adobe',
          graduationYear: 2020,
          mutualConnections: 3,
          profileImage: ''
        }
      ]);
    }
  };

  const loadUserGroups = async () => {
    try {
      const response = await apiService.getUserGroups();
      if (response.success) {
        setUserGroups(response.data ?? []);
      }
    } catch (error) {
      console.error('Error loading user groups:', error);
      // Mock data as fallback
      setUserGroups([
        {
          id: '1',
          name: 'Tech Innovators',
          memberCount: 234,
          category: 'technology',
          newMessages: 3
        },
        {
          id: '2',
          name: 'Career Network',
          memberCount: 567,
          category: 'career',
          newMessages: 1
        },
        {
          id: '3',
          name: 'Class of 2020',
          memberCount: 89,
          category: 'batch',
          newMessages: 0
        }
      ]);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
    toast({
      title: "Dashboard refreshed",
      description: "Latest content has been loaded.",
    });
  };

  // Handle post creation
  const handlePostCreated = (newPost: any) => {
    setRecentPosts(prev => [newPost, ...prev.slice(0, 4)]);
    setStats(prev => ({ ...prev, totalPosts: prev.totalPosts + 1 }));
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
    setStats(prev => ({ ...prev, totalPosts: Math.max(0, prev.totalPosts - 1) }));
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
      title: 'Community Posts',
      value: stats.totalPosts.toLocaleString(),
      icon: MessageSquare,
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
      title: 'Active Groups',
      value: stats.totalGroups.toString(),
      icon: UserPlus,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      href: '/groups'
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
    },
    {
      title: 'Explore Directory',
      description: 'Connect with fellow alumni',
      icon: UserPlus,
      href: '/directory',
      color: 'border-orange-200 hover:border-orange-300 hover:bg-orange-50'
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
        {/* Welcome Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Welcome back, {currentUser?.name?.split(" ")[0] ?? "Alumnus"}!
            </h1>
            <p className="text-slate-600">Stay connected with your alumni community</p>
          </div>
          <Button 
            onClick={handleRefresh}
            variant="outline" 
            size="sm"
            disabled={isRefreshing}
            className="flex items-center gap-2 hover:bg-orange-50 hover:border-orange-300"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="bg-white border-slate-200 hover:shadow-md transition-all duration-300 cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1">{stat.title}</p>
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
                  <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-500" />
                    Featured Posts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {featuredPosts.map((post) => (
                    <PostCard 
                      key={post.id ?? post._id} 
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
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                  Recent Posts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentPosts.length === 0 ? (
                  <EmptyState
                    title="No posts yet"
                    description="Be the first to share something with the community!"
                    action={{
                      label: "Create Post",
                      onClick: () => (document.querySelector('[data-trigger="create-post"]') as HTMLElement)?.click()
                    }}
                  />
                ) : (
                  recentPosts.map((post) => (
                    <PostCard 
                      key={post.id ?? post._id} 
                      post={post}
                      onPostUpdate={handlePostUpdate}
                      onPostDelete={handlePostDelete}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <Card 
                        key={action.title}
                        className={`border-2 transition-all duration-300 cursor-pointer ${action.color}`}
                        onClick={() => window.location.href = action.href}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5 text-slate-600" />
                            <div>
                              <h4 className="font-medium text-slate-900">{action.title}</h4>
                              <p className="text-sm text-slate-600">{action.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Events */}
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingEvents.length === 0 ? (
                  <EmptyState
                    title="No upcoming events"
                    description="Check back later for new events!"
                  />
                ) : (
                  <div className="space-y-4">
                    {upcomingEvents.map((event) => (
                      <div key={event.id} className="p-3 border border-slate-100 rounded-lg hover:border-orange-200 transition-colors">
                        <h4 className="font-medium text-slate-900 mb-1">{event.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                          <Clock className="h-3 w-3" />
                          {new Date(event.date).toLocaleDateString()} at {event.time}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">
                            {event.attendees}/{event.maxAttendees} attending
                          </span>
                          <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                            RSVP
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Jobs */}
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-green-500" />
                  Latest Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentJobs.length === 0 ? (
                  <EmptyState
                    title="No job openings"
                    description="Check back later for new opportunities!"
                  />
                ) : (
                  <div className="space-y-4">
                    {recentJobs.map((job) => (
                      <div key={job.id} className="p-3 border border-slate-100 rounded-lg hover:border-orange-200 transition-colors">
                        <h4 className="font-medium text-slate-900 mb-1">{job.title}</h4>
                        <p className="text-sm text-slate-600 mb-1">{job.company}</p>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {job.type}
                          </Badge>
                          <span className="text-xs text-slate-500">{job.location}</span>
                        </div>
                        {job.salary && (
                          <p className="text-xs text-green-600 font-medium mb-2">{job.salary}</p>
                        )}
                        <Button size="sm" variant="outline" className="w-full text-xs border-orange-300 text-orange-600 hover:bg-orange-50">
                          View Details
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Your Groups */}
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-500" />
                  Your Groups
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userGroups.length === 0 ? (
                  <EmptyState
                    title="No groups yet"
                    description="Join some groups to connect with like-minded alumni!"
                  />
                ) : (
                  <div className="space-y-3">
                    {userGroups.map((group) => (
                      <div key={group.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <span className="text-lg">
                            {group.category === 'technology' ? '💻' : 
                             group.category === 'career' ? '💼' : 
                             group.category === 'batch' ? '🎓' : '👥'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{group.name}</p>
                          <p className="text-xs text-slate-500">{group.memberCount} members</p>
                        </div>
                        {group.newMessages > 0 && (
                          <Badge variant="default" className="bg-orange-500 text-white text-xs">
                            {group.newMessages}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Suggested Connections */}
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-blue-500" />
                  People You May Know
                </CardTitle>
              </CardHeader>
              <CardContent>
                {suggestedConnections.length === 0 ? (
                  <EmptyState
                    title="No suggestions"
                    description="We'll suggest connections as more alumni join!"
                  />
                ) : (
                  <div className="space-y-4">
                    {suggestedConnections.map((person) => (
                      <div key={person.id} className="flex items-center gap-3 p-3 border border-slate-100 rounded-lg hover:border-orange-200 transition-colors">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={person.profileImage} />
                          <AvatarFallback className="bg-slate-100">
                            {person.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{person.name}</p>
                          <p className="text-xs text-slate-600 truncate">{person.title}</p>
                          <p className="text-xs text-slate-500">
                            Class of {person.graduationYear} • {person.mutualConnections} mutual
                          </p>
                        </div>
                        <Button size="sm" variant="outline" className="text-xs border-blue-300 text-blue-600 hover:bg-blue-50">
                          Connect
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats Summary */}
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-6">
                <h3 className="font-semibold text-slate-900 mb-4">This Week's Activity</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">New members</span>
                    <span className="font-medium text-slate-900">{stats.newMembersThisWeek}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Posts this week</span>
                    <span className="font-medium text-slate-900">47</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Job applications</span>
                    <span className="font-medium text-slate-900">23</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">New connections</span>
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
