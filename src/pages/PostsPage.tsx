import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { CreatePostForm } from "@/components/posts/CreatePostForm";
import { PostList } from "@/components/posts/PostList";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/services/apiService";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Filter, TrendingUp, BookOpen, ThumbsUp, MessageSquare, Share2, Bookmark, MoreHorizontal, Clock, Calendar, Users } from "lucide-react";

interface Post {
  id: string;
  title?: string;
  content: string;
  author: {
    id: string;
    name: string;
    profileImage?: string;
    title?: string;
  };
  createdAt: string;
  likes: number;
  comments: number;
  category?: string;
  tags?: string[];
  image?: string;
}

export default function PostsPage() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    { id: "all", name: "All" },
    { id: "career", name: "Career" },
    { id: "education", name: "Education" },
    { id: "events", name: "Events" },
    { id: "industry", name: "Industry" },
    { id: "technology", name: "Technology" },
  ];

  useEffect(() => {
    loadPosts();
  }, [activeTab]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      
      // Create query parameters based on active tab
      const params: any = {
        limit: 20
      };
      
      if (activeTab === "popular") {
        params.sortBy = "likes";
      } else if (activeTab === "recent") {
        params.sortBy = "createdAt";
      } else if (activeTab === "my") {
        params.author = currentUser?.id;
      }
      
      // Fetch posts from the API
      const response = await apiService.getAllPosts(params);
      
      if (response.success && Array.isArray(response.data)) {
        setPosts(response.data);
      } else {
        setPosts([]);
        toast({ 
          title: "Note", 
          description: "Could not fetch posts. You may be seeing demo content."
        });
      }
    } catch (error) {
      console.error("Error loading posts:", error);
      toast({ title: "Error", description: "Failed to load posts.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (postData: any) => {
    try {
      // Send post data to the API
      const response = await apiService.createPost(postData);
      
      if (response.success) {
        toast({ title: "Post Created", description: "Your post has been published successfully." });
        setIsCreatePostModalOpen(false);
        loadPosts(); // Reload posts to include the new one
      } else {
        throw new Error(response.message || "Failed to create post");
      }
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create post.", 
        variant: "destructive" 
      });
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = !searchQuery || 
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (post.title && post.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      post.author.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || selectedCategory === "all" || post.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? {...post, likes: post.likes + 1}
        : post
    ));
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Alumni Posts</h1>
        <p className="text-md text-gray-500 mt-1">Share updates, achievements, and connect with the alumni community.</p>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search posts..."
            className="pl-10 pr-4 py-2 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Button
          onClick={() => setIsCreatePostModalOpen(true)}
          className="w-full sm:w-auto bg-orange-500 text-white hover:bg-orange-600"
        >
          Create Post
        </Button>
      </div>

      {/* Category Filters */}
      <div className="flex overflow-x-auto gap-2 mb-6 pb-2">
        {categories.map(category => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            className={selectedCategory === category.id ? "bg-orange-500 hover:bg-orange-600" : ""}
            onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
          >
            {category.name}
          </Button>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="popular" className="mb-6" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="popular" className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            <span>Popular</span>
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>Recent</span>
          </TabsTrigger>
          <TabsTrigger value="following" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>Following</span>
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex items-center gap-1">
            <Bookmark className="h-4 w-4" />
            <span>Saved</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Posts List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600">Loading posts...</span>
        </div>
      ) : filteredPosts.length === 0 ? (
        <EmptyState
          title="No posts found"
          description={searchQuery ? "Try adjusting your search terms." : "Be the first to share something with the community!"}
          action={{
            label: "Create a Post",
            onClick: () => setIsCreatePostModalOpen(true)
          }}
        />
      ) : (
        <div className="space-y-6">
          {filteredPosts.map(post => (
            <Card key={post.id} className="overflow-hidden">
              <CardContent className="p-6">
                {/* Author Info */}
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={post.author.profileImage} />
                    <AvatarFallback className="bg-orange-100 text-orange-800">
                      {post.author.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-gray-900">{post.author.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{post.author.title}</span>
                      <span>•</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Post Title */}
                {post.title && (
                  <h2 className="text-xl font-bold mb-2">{post.title}</h2>
                )}

                {/* Post Content */}
                <p className="text-gray-700 mb-4">{post.content}</p>

                {/* Post Image */}
                {post.image && (
                  <div className="my-4 rounded-lg overflow-hidden">
                    <img src={post.image} alt="Post image" className="w-full" />
                  </div>
                )}

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="bg-gray-100">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Post Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex items-center gap-1 text-gray-600 hover:text-orange-500"
                      onClick={() => handleLike(post.id)}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span>{post.likes}</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex items-center gap-1 text-gray-600 hover:text-orange-500"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>{post.comments}</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex items-center gap-1 text-gray-600 hover:text-orange-500"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-600"
                  >
                    <Bookmark className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Post Modal */}
      <CreatePostForm
        isOpen={isCreatePostModalOpen}
        onClose={() => setIsCreatePostModalOpen(false)}
        onSubmit={handleCreatePost}
      />
    </div>
  );
}
