import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { CreatePostForm } from "@/components/posts/CreatePostForm";
import { PostList } from "@/components/posts/PostList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import apiService from "@/services/apiService";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Filter, TrendingUp, BookOpen } from "lucide-react";

interface Post {
  id: string;
  title?: string;
  content: string;
  author: {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
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

export default function PostsPage() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [schoolUpdates, setSchoolUpdates] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const categories = [
    'general',
    'career', 
    'networking',
    'events',
    'achievements',
    'announcements'
  ];

  useEffect(() => {
    loadPosts();
    loadFeaturedPosts();
    loadSchoolUpdates();
  }, [currentPage, searchTerm, categoryFilter]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 10,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }
      if (categoryFilter) {
        params.category = categoryFilter;
      }

      const response = await apiService.getAllPosts(params);
      console.log('Posts response:', response);
      if (response.success) {
        setPosts((response.data || []) as Post[]);
        if (response.pagination) {
          setTotalPages(response.pagination.pages || 1);
        }
      }
    } catch (error: any) {
      console.error('Failed to load posts:', error);
      toast({
        title: "Error",
        description: "Failed to load posts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturedPosts = async () => {
    try {
      const response = await apiService.getFeaturedPosts({ limit: 5 });
      if (response.success) {
        setFeaturedPosts((response.data || []) as Post[]);
      }
    } catch (error: any) {
      console.error('Failed to load featured posts:', error);
    }
  };

  const loadSchoolUpdates = async () => {
    try {
      const response = await apiService.getSchoolUpdates({ limit: 5 });
      if (response.success) {
        setSchoolUpdates((response.data || []) as Post[]);
      }
    } catch (error: any) {
      console.error('Failed to load school updates:', error);
    }
  };

  const handlePostCreated = (newPost: Post) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
    toast({
      title: "Post Created",
      description: "Your post has been shared successfully!",
    });
  };

  const handlePostUpdated = (updatedPost: Post) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === updatedPost.id ? updatedPost : post
      )
    );
  };

  const handlePostDeleted = (deletedPostId: string) => {
    setPosts(prevPosts => 
      prevPosts.filter(post => post.id !== deletedPostId)
    );
    toast({
      title: "Post Deleted",
      description: "The post has been deleted successfully.",
    });
  };

  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Posts & Updates"
        description="Share your thoughts, achievements, and connect with fellow alumni"
      />

      {/* Create Post Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Share Something
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CreatePostForm onPostCreated={handlePostCreated}>
            <Button className="w-full justify-start text-left bg-gray-50 hover:bg-gray-100 text-gray-600">
              What's on your mind, {currentUser?.name?.split(' ')[0]}?
            </Button>
          </CreatePostForm>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Posts</TabsTrigger>
          <TabsTrigger value="featured" className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            Featured
          </TabsTrigger>
          <TabsTrigger value="school" className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            School Updates
          </TabsTrigger>
          <TabsTrigger value="my-posts">My Posts</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search posts..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
                <Button 
                  variant="outline" 
                  onClick={resetFilters}
                  className="flex items-center gap-1"
                >
                  <Filter className="h-4 w-4" />
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              <PostList 
                posts={posts}
                onPostUpdated={handlePostUpdated}
                onPostDeleted={handlePostDeleted}
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="px-4 py-2 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="featured">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Featured Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {featuredPosts.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No featured posts available</p>
              ) : (
                <PostList 
                  posts={featuredPosts}
                  onPostUpdated={handlePostUpdated}
                  onPostDeleted={handlePostDeleted}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="school">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                School Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              {schoolUpdates.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No school updates available</p>
              ) : (                  <PostList 
                    posts={schoolUpdates}
                    onPostUpdated={handlePostUpdated}
                    onPostDeleted={handlePostDeleted}
                  />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-posts">
          <Card>
            <CardHeader>
              <CardTitle>My Posts</CardTitle>
            </CardHeader>
            <CardContent>                <PostList 
                  posts={posts.filter(post => post.author.id === currentUser?.id)}
                  onPostUpdated={handlePostUpdated}
                  onPostDeleted={handlePostDeleted}
                  showActions={true}
                />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
