import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageSquare, Share, Users, Calendar, UserPlus, Briefcase, Bell, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreatePostForm } from "@/components/posts/CreatePostForm";
import apiService from "@/services/apiService";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { useToast } from "@/hooks/use-toast";

interface Post {
  id: string;
  _id: string;
  content: string;
  author: {
    _id: string;
    id: string;
    name: string;
    profileImage?: string;
    role?: string;
    classYear?: string;
  };
  likes: string[];
  comments?: number;
  createdAt: string;
  isSchoolUpdate?: boolean;
  imageUrl?: string;
}

interface Event {
  _id: string;
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  organizer: {
    name: string;
  };
  attendees: string[];
  maxAttendees?: number;
}

interface Job {
  _id: string;
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
}

interface Group {
  _id: string;
  id: string;
  name: string;
  memberCount: number;
  lastActivity: string;
  category: string;
}

interface UserSuggestion {
  _id: string;
  id: string;
  name: string;
  profileImage?: string;
  role?: string;
  company?: string;
  jobTitle?: string;
  admissionYear?: string;
  headline?: string;
}

interface DashboardState {
  posts: Post[];
  events: Event[];
  jobs: Job[];
  groups: Group[];
  userSuggestions: UserSuggestion[];
  loading: {
    main: boolean;
    posts: boolean;
    events: boolean;
    jobs: boolean;
    groups: boolean;
    suggestions: boolean;
  };
  error: {
    posts: string | null;
    events: string | null;
    jobs: string | null;
    groups: string | null;
    suggestions: string | null;
  };
}

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  
  const [state, setState] = useState<DashboardState>({
    posts: [],
    events: [],
    jobs: [],
    groups: [],
    userSuggestions: [],
    loading: {
      main: true,
      posts: false,
      events: false,
      jobs: false,
      groups: false,
      suggestions: false,
    },
    error: {
      posts: null,
      events: null,
      jobs: null,
      groups: null,
      suggestions: null,
    },
  });

  const updateLoading = (section: keyof DashboardState['loading'], value: boolean) => {
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, [section]: value }
    }));
  };

  const updateError = (section: keyof DashboardState['error'], value: string | null) => {
    setState(prev => ({
      ...prev,
      error: { ...prev.error, [section]: value }
    }));
  };

  const loadPosts = useCallback(async () => {
    try {
      updateLoading('posts', true);
      updateError('posts', null);
      
      const response = await apiService.getAllPosts({ limit: 10 });
      if (response.success && Array.isArray(response.data)) {
        setState(prev => ({ ...prev, posts: response.data as Post[] }));
        
        // Set initial liked posts based on current user
        const userLikedPosts = new Set<string>();
        (response.data as Post[]).forEach((post: Post) => {
          if (post.likes?.includes(currentUser?.id || '')) {
            userLikedPosts.add(post.id || post._id);
          }
        });
        setLikedPosts(userLikedPosts);
      } else {
        setState(prev => ({ ...prev, posts: [] }));
      }
    } catch (error: any) {
      console.error('Error loading posts:', error);
      updateError('posts', error.message || 'Failed to load posts');
      setState(prev => ({ ...prev, posts: [] }));
    } finally {
      updateLoading('posts', false);
    }
  }, [currentUser?.id]);

  const loadEvents = useCallback(async () => {
    try {
      updateLoading('events', true);
      updateError('events', null);
      
      const response = await apiService.getUpcomingEvents(3);
      if (response.success && Array.isArray(response.data)) {
        setState(prev => ({ ...prev, events: response.data as Event[] }));
      } else {
        setState(prev => ({ ...prev, events: [] }));
      }
    } catch (error: any) {
      console.error('Error loading events:', error);
      updateError('events', error.message || 'Failed to load events');
      setState(prev => ({ ...prev, events: [] }));
    } finally {
      updateLoading('events', false);
    }
  }, []);

  const loadJobs = useCallback(async () => {
    try {
      updateLoading('jobs', true);
      updateError('jobs', null);
      
      const response = await apiService.getJobs({ limit: 3, isActive: true });
      if (response.success && Array.isArray(response.data)) {
        setState(prev => ({ ...prev, jobs: response.data as Job[] }));
      } else {
        setState(prev => ({ ...prev, jobs: [] }));
      }
    } catch (error: any) {
      console.error('Error loading jobs:', error);
      updateError('jobs', error.message || 'Failed to load jobs');
      setState(prev => ({ ...prev, jobs: [] }));
    } finally {
      updateLoading('jobs', false);
    }
  }, []);

  const loadGroups = useCallback(async () => {
    try {
      updateLoading('groups', true);
      updateError('groups', null);
      
      // Use the new getUserGroups endpoint
      const response = await apiService.getUserGroups();
      if (response.success && Array.isArray(response.data)) {
        setState(prev => ({ ...prev, groups: (response.data as Group[]).slice(0, 3) }));
      } else {
        setState(prev => ({ ...prev, groups: [] }));
      }
    } catch (error: any) {
      console.error('Error loading groups:', error);
      updateError('groups', error.message || 'Failed to load groups');
      setState(prev => ({ ...prev, groups: [] }));
    } finally {
      updateLoading('groups', false);
    }
  }, []);

  const loadUserSuggestions = useCallback(async () => {
    try {
      updateLoading('suggestions', true);
      updateError('suggestions', null);
      
      const response = await apiService.getUserSuggestions(3);
      if (response.success && Array.isArray(response.data)) {
        setState(prev => ({ ...prev, userSuggestions: response.data as UserSuggestion[] }));
      } else {
        setState(prev => ({ ...prev, userSuggestions: [] }));
      }
    } catch (error: any) {
      console.error('Error loading user suggestions:', error);
      updateError('suggestions', error.message || 'Failed to load suggestions');
      setState(prev => ({ ...prev, userSuggestions: [] }));
    } finally {
      updateLoading('suggestions', false);
    }
  }, []);

  const loadDashboardData = useCallback(async () => {
    updateLoading('main', true);
    
    await Promise.all([
      loadPosts(),
      loadEvents(),
      loadJobs(),
      loadGroups(),
      loadUserSuggestions(),
    ]);
    
    updateLoading('main', false);
  }, [loadPosts, loadEvents, loadJobs, loadGroups, loadUserSuggestions]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handlePostCreated = (newPost: Post) => {
    setState(prev => ({ ...prev, posts: [newPost, ...prev.posts] }));
    toast({
      title: "Success",
      description: "Post created successfully!",
    });
  };

  const handleLikePost = async (postId: string) => {
    try {
      const isCurrentlyLiked = likedPosts.has(postId);
      
      // Optimistic update
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyLiked) {
          newSet.delete(postId);
        } else {
          newSet.add(postId);
        }
        return newSet;
      });

      // Update post likes count optimistically
      setState(prev => ({
        ...prev,
        posts: prev.posts.map(post => {
          if ((post.id || post._id) === postId) {
            return {
              ...post,
              likes: isCurrentlyLiked 
                ? post.likes.filter(id => id !== currentUser?.id)
                : [...post.likes, currentUser?.id || '']
            };
          }
          return post;
        })
      }));

      // Make API call
      if (isCurrentlyLiked) {
        await apiService.unlikePost(postId);
      } else {
        await apiService.likePost(postId);
      }
    } catch (error: any) {
      console.error('Error toggling like:', error);
      
      // Revert optimistic update on error
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (likedPosts.has(postId)) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });

      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      });
    }
  };

  const handleRSVP = async (eventId: string) => {
    try {
      await apiService.rsvpEvent(eventId);
      toast({
        title: "Success",
        description: "RSVP successful!",
      });
      loadEvents(); // Refresh events
    } catch (error: any) {
      console.error('Error RSVP to event:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to RSVP to event",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
    toast({
      title: "Refreshed",
      description: "Dashboard data has been updated",
    });
  };

  if (state.loading.main) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  const filteredPosts = activeTab === "all" 
    ? state.posts 
    : state.posts.filter(post => post.isSchoolUpdate);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Welcome Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back, {currentUser?.name?.split(" ")[0] || "Alumnus"}!
            </h1>
            <p className="text-gray-600">Stay connected with your school community</p>
          </div>
          <Button 
            onClick={handleRefresh}
            variant="outline" 
            size="sm"
            className="flex items-center gap-2 hover:bg-orange-50 hover:border-orange-300"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        <div className="grid md:grid-cols-12 gap-4 md:gap-6">
          {/* Main content - posts feed */}
          <div className="md:col-span-8 lg:col-span-9 space-y-4 md:space-y-6">
            {/* Post creation card */}
            <Card className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={currentUser?.profileImage} alt={currentUser?.name} />
                    <AvatarFallback className="bg-orange-100 text-orange-600 font-medium">
                      {currentUser?.name?.charAt(0) || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <CreatePostForm onPostCreated={handlePostCreated}>
                    <Button 
                      variant="outline" 
                      className="flex-1 justify-start text-gray-500 hover:text-gray-700 border-gray-300 hover:border-orange-300 transition-all duration-300"
                    >
                      Share something with your network...
                    </Button>
                  </CreatePostForm>
                </div>
              </CardContent>
            </Card>
            
            {/* Content tabs */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
                <div className="border-b border-gray-100 px-6 pt-4">
                  <TabsList className="bg-gray-50 p-1 rounded-lg">
                    <TabsTrigger 
                      value="all" 
                      className="data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all duration-300"
                    >
                      All Updates
                    </TabsTrigger>
                    <TabsTrigger 
                      value="school"
                      className="data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all duration-300"
                    >
                      School Updates
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="all" className="p-6 space-y-4">
                  {state.loading.posts ? (
                    <div className="flex items-center justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  ) : state.error.posts ? (
                    <div className="text-center py-8">
                      <p className="text-red-500 mb-4">{state.error.posts}</p>
                      <Button onClick={loadPosts} variant="outline">
                        Try Again
                      </Button>
                    </div>
                  ) : filteredPosts.length === 0 ? (
                    <EmptyState
                      title="No posts yet"
                      description="Be the first to share something with your alumni network!"
                    />
                  ) : (
                    filteredPosts.map(post => (
                      <PostCard 
                        key={post.id || post._id} 
                        post={post}
                        onLike={handleLikePost}
                        isLiked={likedPosts.has(post.id || post._id)}
                        currentUserId={currentUser?.id || ''}
                      />
                    ))
                  )}
                </TabsContent>
                
                <TabsContent value="school" className="p-6 space-y-4">
                  {state.loading.posts ? (
                    <div className="flex items-center justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  ) : filteredPosts.length === 0 ? (
                    <EmptyState
                      title="No school updates"
                      description="Check back later for official announcements and updates."
                    />
                  ) : (
                    filteredPosts.map(post => (
                      <PostCard 
                        key={post.id || post._id} 
                        post={post}
                        onLike={handleLikePost}
                        isLiked={likedPosts.has(post.id || post._id)}
                        currentUserId={currentUser?.id || ''}
                      />
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
          
          {/* Right Sidebar */}
          <div className="md:col-span-4 lg:col-span-3 space-y-6">
            {/* Your Groups */}
            <Card className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Users className="h-5 w-5 text-orange-500" />
                    Your Groups
                  </h3>
                  <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-600">
                    View all
                  </Button>
                </div>
                {state.loading.groups ? (
                  <div className="flex justify-center py-4">
                    <LoadingSpinner />
                  </div>
                ) : state.error.groups ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-red-500 mb-2">{state.error.groups}</p>
                    <Button onClick={loadGroups} variant="outline" size="sm">
                      Retry
                    </Button>
                  </div>
                ) : state.groups.length === 0 ? (
                  <EmptyState
                    title="No groups yet"
                    description="Join some groups to connect with like-minded alumni!"
                  />
                ) : (
                  <div className="space-y-3">
                    {state.groups.map((group) => (
                      <div key={group._id || group.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-sm">
                          {group.category === 'tech' ? '💻' : group.category === 'career' ? '💼' : '🎓'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{group.name}</p>
                          <p className="text-xs text-gray-500">{group.memberCount} members</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    Upcoming Events
                  </h3>
                  <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-600">
                    View all
                  </Button>
                </div>
                {state.loading.events ? (
                  <div className="flex justify-center py-4">
                    <LoadingSpinner />
                  </div>
                ) : state.error.events ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-red-500 mb-2">{state.error.events}</p>
                    <Button onClick={loadEvents} variant="outline" size="sm">
                      Retry
                    </Button>
                  </div>
                ) : state.events.length === 0 ? (
                  <EmptyState
                    title="No upcoming events"
                    description="Check back later for exciting events!"
                  />
                ) : (
                  <div className="space-y-3">
                    {state.events.map((event) => (
                      <div key={event._id || event.id} className="p-3 border border-gray-100 rounded-lg hover:border-orange-200 transition-colors">
                        <h4 className="font-medium text-gray-900 mb-1">{event.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {new Date(event.date).toLocaleDateString()} • {event.time}
                        </p>
                        <p className="text-xs text-gray-500 mb-3">{event.location}</p>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleRSVP(event._id || event.id)}
                            className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1"
                          >
                            RSVP
                          </Button>
                          <Button variant="outline" size="sm" className="text-xs px-3 py-1">
                            Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Job Opportunities */}
            <Card className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-green-500" />
                    Job Opportunities
                  </h3>
                  <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-600">
                    View all
                  </Button>
                </div>
                {state.loading.jobs ? (
                  <div className="flex justify-center py-4">
                    <LoadingSpinner />
                  </div>
                ) : state.error.jobs ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-red-500 mb-2">{state.error.jobs}</p>
                    <Button onClick={loadJobs} variant="outline" size="sm">
                      Retry
                    </Button>
                  </div>
                ) : state.jobs.length === 0 ? (
                  <EmptyState
                    title="No job openings"
                    description="Check back later for new opportunities!"
                  />
                ) : (
                  <div className="space-y-3">
                    {state.jobs.map((job) => (
                      <div key={job._id || job.id} className="p-3 border border-gray-100 rounded-lg hover:border-orange-200 transition-colors">
                        <h4 className="font-medium text-gray-900 mb-1">{job.title}</h4>
                        <p className="text-sm text-gray-600 mb-1">{job.company}</p>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {job.type}
                          </Badge>
                          <span className="text-xs text-gray-500">{job.location}</span>
                        </div>
                        <Button size="sm" variant="outline" className="w-full text-xs border-orange-300 text-orange-600 hover:bg-orange-50">
                          View Details
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* People You May Know */}
            <Card className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-purple-500" />
                    People You May Know
                  </h3>
                </div>
                {state.loading.suggestions ? (
                  <div className="flex justify-center py-4">
                    <LoadingSpinner />
                  </div>
                ) : state.error.suggestions ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-red-500 mb-2">{state.error.suggestions}</p>
                    <Button onClick={loadUserSuggestions} variant="outline" size="sm">
                      Retry
                    </Button>
                  </div>
                ) : state.userSuggestions.length === 0 ? (
                  <EmptyState
                    title="No suggestions"
                    description="We'll suggest people you might know soon!"
                  />
                ) : (
                  <div className="space-y-3">
                    {state.userSuggestions.map((person) => (
                      <div key={person._id || person.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={person.profileImage} alt={person.name} />
                          <AvatarFallback className="bg-gray-200 text-gray-600">
                            {person.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{person.name}</p>
                          <p className="text-xs text-gray-500">{person.jobTitle} {person.company ? `at ${person.company}` : ''}</p>
                          {person.admissionYear && (
                            <p className="text-xs text-gray-400">Class of {person.admissionYear}</p>
                          )}
                        </div>
                        <Button size="sm" variant="outline" className="text-xs border-orange-300 text-orange-600 hover:bg-orange-50">
                          Connect
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  isLiked: boolean;
  currentUserId: string;
}

function PostCard({ post, onLike, isLiked, currentUserId }: PostCardProps) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffMins < 60) {
        return `${diffMins}m ago`;
      } else if (diffHours < 24) {
        return `${diffHours}h ago`;
      } else if (diffDays < 7) {
        return `${diffDays}d ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch {
      return 'Recently';
    }
  };

  if (!post || !post.author) {
    return null;
  }

  const likeCount = post.likes?.length || 0;
  
  return (
    <Card className={`
      bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1
      ${post.isSchoolUpdate ? "border-orange-200 bg-orange-50/30" : ""}
    `}>
      <CardContent className="p-6">
        {/* Post header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={post.author.profileImage} alt={post.author.name} />
              <AvatarFallback className="bg-orange-100 text-orange-600 font-medium">
                {post.author.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-gray-900">{post.author.name || 'Unknown User'}</p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{post.author.role || 'Alumni'}</span>
                {post.author.classYear && (
                  <>
                    <span>•</span>
                    <span>Class of {post.author.classYear}</span>
                  </>
                )}
                <span>•</span>
                <span>{formatDate(post.createdAt)}</span>
              </div>
            </div>
          </div>
          {post.isSchoolUpdate && (
            <Badge className="bg-orange-500 text-white text-xs px-3 py-1">
              <Bell className="h-3 w-3 mr-1" />
              School Update
            </Badge>
          )}
        </div>
        
        {/* Post content */}
        <div className="mb-6">
          <p className="text-gray-800 text-base leading-relaxed">{post.content || ''}</p>
          {post.imageUrl && (
            <div className="mt-4 rounded-lg overflow-hidden">
              <img 
                src={post.imageUrl} 
                alt="Post image" 
                className="w-full h-auto max-h-96 object-cover"
              />
            </div>
          )}
        </div>
        
        {/* Engagement stats */}
        {(likeCount > 0 || post.comments && post.comments > 0) && (
          <div className="flex items-center justify-between mb-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {likeCount > 0 && (
                <span>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</span>
              )}
              {post.comments && post.comments > 0 && (
                <span>{post.comments} {post.comments === 1 ? 'comment' : 'comments'}</span>
              )}
            </div>
          </div>
        )}
        
        {/* Post actions */}
        <div className="flex gap-1 pt-3 border-t border-gray-100">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex-1 gap-2 transition-all duration-300 hover:bg-red-50 ${
              isLiked ? "text-red-500 bg-red-50" : "text-gray-600 hover:text-red-500"
            }`}
            onClick={() => onLike(post.id || post._id)}
          >
            <Heart className={`h-4 w-4 ${isLiked ? "fill-red-500" : ""}`} />
            <span className="font-medium">Like</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1 gap-2 text-gray-600 hover:text-blue-500 hover:bg-blue-50 transition-all duration-300"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="font-medium">Comment</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1 gap-2 text-gray-600 hover:text-green-500 hover:bg-green-50 transition-all duration-300"
          >
            <Share className="h-4 w-4" />
            <span className="font-medium">Share</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
