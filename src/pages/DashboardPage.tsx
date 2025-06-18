import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageSquare, Share } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreatePostForm } from "@/components/posts/CreatePostForm";
import apiService from "@/services/apiService";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [posts, setPosts] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [jobOpportunities, setJobOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Loading dashboard data...');
      
      // Load recent posts
      const postsResponse = await apiService.getAllPosts({ limit: 5 });
      console.log('Posts response:', postsResponse);
      if (postsResponse.success && Array.isArray(postsResponse.data)) {
        setPosts(postsResponse.data);
      } else {
        setPosts([]);
      }

      // Load upcoming events (when events API is implemented)
      // const eventsResponse = await apiService.getEvents({ limit: 3 });
      
      // Load job opportunities
      const jobsResponse = await apiService.getJobs({ limit: 3, isActive: true });
      console.log('Jobs response:', jobsResponse);
      if (jobsResponse.success && Array.isArray(jobsResponse.data)) {
        setJobOpportunities(jobsResponse.data);
      } else {
        setJobOpportunities([]);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setPosts([]);
      setJobOpportunities([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = (newPost: any) => {
    setPosts([newPost, ...posts]);
  };

  if (loading) {
    return (
      <div>
        <PageHeader 
          title={`Welcome back, ${currentUser?.name?.split(" ")[0] || "Alumnus"}!`} 
          description="Stay connected with your school community"
        />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title={`Welcome back, ${currentUser?.name?.split(" ")[0] || "Alumnus"}!`} 
        description="Stay connected with your school community"
      />
      
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content - posts feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Create post card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={currentUser?.profileImage} alt={currentUser?.name} />
                  <AvatarFallback>{currentUser?.name?.charAt(0) || "A"}</AvatarFallback>
                </Avatar>
                <CreatePostForm onPostCreated={handlePostCreated}>
                  <Button variant="outline" className="w-full justify-start text-muted-foreground">
                    <span>Share an update or link...</span>
                  </Button>
                </CreatePostForm>
              </div>
            </CardContent>
          </Card>
          
          {/* Content tabs */}
          <Tabs defaultValue="all" onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Updates</TabsTrigger>
              <TabsTrigger value="school">School Updates</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              {posts.length === 0 ? (
                <EmptyState
                  title="No posts yet"
                  description="Be the first to share something with your alumni network!"
                />
              ) : (
                posts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="school" className="space-y-4">
              {posts.filter(post => post.isSchoolUpdate).length === 0 ? (
                <EmptyState
                  title="No school updates"
                  description="Check back later for official announcements and updates."
                />
              ) : (
                posts.filter(post => post.isSchoolUpdate).map(post => (
                  <PostCard key={post.id} post={post} />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming events */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-medium mb-3">Upcoming Events</h3>
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming events</p>
              ) : (
                upcomingEvents.map(event => (
                  <div key={event.id} className="mb-3 pb-3 border-b last:border-0 last:pb-0 last:mb-0">
                    <h4 className="font-medium">{event.title}</h4>
                    <p className="text-sm text-muted-foreground">{event.date} • {event.location}</p>
                  </div>
                ))
              )}
              <Button variant="link" className="px-0 mt-2">View all events</Button>
            </CardContent>
          </Card>
          
          {/* Job opportunities */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-medium mb-3">Job Opportunities</h3>
              {jobOpportunities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No job opportunities</p>
              ) : (
                jobOpportunities.map(job => (
                  <div key={job.id} className="mb-3 pb-3 border-b last:border-0 last:pb-0 last:mb-0">
                    <h4 className="font-medium">{job.title}</h4>
                    <p className="text-sm text-muted-foreground">{job.company} • {job.location}</p>
                  </div>
                ))
              )}
              <Button variant="link" className="px-0 mt-2">View all jobs</Button>
            </CardContent>
          </Card>
          
          {/* Quick links */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-medium mb-3">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <a href="/directory">Find classmates</a>
                  </Button>
                </li>
                <li>
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <a href="/mentorship">Connect with mentors</a>
                  </Button>
                </li>
                <li>
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <a href="/groups">Join a group</a>
                  </Button>
                </li>
                <li>
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <a href="/profile">Update your profile</a>
                  </Button>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PostCard({ post }: { post: any }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  
  const handleLike = () => {
    if (liked) {
      setLikeCount(prev => prev - 1);
    } else {
      setLikeCount(prev => prev + 1);
    }
    setLiked(!liked);
  };
  
  if (!post || !post.author) {
    return null;
  }
  
  return (
    <Card className={post.isSchoolUpdate ? "border-alumni-primary border-2" : ""}>
      <CardContent className="p-4">
        {/* Post header */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar>
            <AvatarImage src={post.author.avatar} alt={post.author.name} />
            <AvatarFallback>{post.author.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{post.author.name || 'Unknown User'}</p>
            <p className="text-xs text-muted-foreground">{post.author.role || ''} • {post.timestamp || post.createdAt || 'Recently'}</p>
          </div>
          {post.isSchoolUpdate && (
            <span className="ml-auto text-xs bg-alumni-light text-alumni-dark px-2 py-1 rounded-full">
              School Update
            </span>
          )}
        </div>
        
        {/* Post content */}
        <div className="mb-4">
          <p>{post.content || ''}</p>
        </div>
        
        {/* Post actions */}
        <div className="flex gap-4 pt-2 border-t">
          <Button variant="ghost" size="sm" className="flex gap-1" onClick={handleLike}>
            <Heart className={`h-4 w-4 ${liked ? "fill-red-500 text-red-500" : ""}`} />
            <span>{likeCount}</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex gap-1">
            <MessageSquare className="h-4 w-4" />
            <span>{post.comments || 0}</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex gap-1 ml-auto">
            <Share className="h-4 w-4" />
            <span>Share</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
