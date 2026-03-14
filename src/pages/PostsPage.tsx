import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { CreatePostForm } from '@/components/posts/CreatePostFormNew';
import { PostCard } from '@/components/posts/PostCardNew';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/apiService';

export default function PostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavedLoading, setIsSavedLoading] = useState(false);
  const [isFeedLoading, setIsFeedLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('recent');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();
  const { currentUser, isAuthenticated } = useAuth();

  // Load recent posts
  const loadRecentPosts = async (pageNum = 1, append = false) => {
    try {
      if (!append) setIsLoading(true);
      
      const response = await apiService.getPosts({
        page: pageNum,
        limit: 10,
      });
      
      if (response.success) {
        const newPosts = response.data || [];
        setPosts(prev => append ? [...prev, ...newPosts] : newPosts);
        setHasMore(newPosts.length === 10);
        setPage(pageNum);
      } else {
        throw new Error(response.message || 'Failed to load posts');
      }
    } catch (error: any) {
      console.error('Load posts error:', error);
      toast({
        title: "Error loading posts",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load saved/bookmarked posts
  const loadSavedPosts = async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsSavedLoading(true);
      const response = await apiService.getBookmarkedPosts({ page: 1, limit: 50 });
      
      if (response.success) {
        setSavedPosts(response.data || []);
      } else {
        throw new Error(response.message || 'Failed to load saved posts');
      }
    } catch (error: any) {
      console.error('Load saved posts error:', error);
      toast({
        title: "Error loading saved posts",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSavedLoading(false);
    }
  };

  // Load feed posts (from connections)
  const loadFeedPosts = async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsFeedLoading(true);
      const response = await apiService.getFeedPosts({ 
        page: 1, 
        limit: 50,
        filter: 'connections'
      });
      
      if (response.success) {
        setFeedPosts(response.data || []);
      } else {
        throw new Error(response.message || 'Failed to load feed posts');
      }
    } catch (error: any) {
      console.error('Load feed posts error:', error);
      toast({
        title: "Error loading feed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsFeedLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadRecentPosts();
  }, []);

  // Load data for different tabs
  useEffect(() => {
    if (activeTab === 'saved') {
      loadSavedPosts();
    } else if (activeTab === 'following') {
      loadFeedPosts();
    }
  }, [activeTab, isAuthenticated]);

  // Handle post creation
  const handlePostCreated = (newPost: any) => {
    setPosts(prev => [newPost, ...prev]);
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

    setPosts(prev => updatePostInArray(prev));
    setSavedPosts(prev => updatePostInArray(prev));
    setFeedPosts(prev => updatePostInArray(prev));
  };

  // Handle post deletion
  const handlePostDelete = (postId: string) => {
    const removePostFromArray = (postsArray: any[]) => 
      postsArray.filter(post => post.id !== postId);

    setPosts(prev => removePostFromArray(prev));
    setSavedPosts(prev => removePostFromArray(prev));
    setFeedPosts(prev => removePostFromArray(prev));
  };

  // Load more posts
  const loadMore = () => {
    if (hasMore && !isLoading && activeTab === 'recent') {
      loadRecentPosts(page + 1, true);
    }
  };

  const getCurrentPosts = () => {
    switch (activeTab) {
      case 'saved':
        return savedPosts;
      case 'following':
        return feedPosts;
      default:
        return posts;
    }
  };

  const getCurrentLoading = () => {
    switch (activeTab) {
      case 'saved':
        return isSavedLoading;
      case 'following':
        return isFeedLoading;
      default:
        return isLoading;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <PageHeader
        title="Posts"
        description="Connect with alumni, share updates, and discover opportunities"
      />
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Create Post Section */}
        {isAuthenticated && (
          <div className="mb-6">
            <CreatePostForm
              onPostCreated={handlePostCreated}
              trigger={
                <Button 
                  size="lg" 
                  className="w-full justify-start gap-3 bg-card border-2 border-border hover:border-blue-300 hover:bg-primary/5 text-foreground/90 font-medium shadow-sm"
                >
                  <Plus className="h-5 w-5" />
                  Share what's on your mind...
                </Button>
              }
            />
          </div>
        )}

        {/* Posts Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card border border-border shadow-sm">
            <TabsTrigger 
              value="recent" 
              className="data-[state=active]:bg-primary/5 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200"
            >
              Recent Posts
            </TabsTrigger>
            {isAuthenticated && (
              <>
                <TabsTrigger 
                  value="following" 
                  className="data-[state=active]:bg-primary/5 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200"
                >
                  Following
                </TabsTrigger>
                <TabsTrigger 
                  value="saved" 
                  className="data-[state=active]:bg-primary/5 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200"
                >
                  Saved Posts
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="recent" className="mt-6">
            <div className="space-y-6">
              {isLoading && posts.length === 0 ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : posts.length === 0 ? (
                <EmptyState
                  title="No posts yet"
                  description="Be the first to share something with the community!"
                  action={isAuthenticated ? {
                    label: "Create Post",
                    onClick: () => {}
                  } : {
                    label: "Sign in to post",
                    onClick: () => window.location.href = '/login'
                  }}
                />
              ) : (
                <>
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onPostUpdate={handlePostUpdate}
                      onPostDelete={handlePostDelete}
                    />
                  ))}
                  
                  {/* Load More Button */}
                  {hasMore && (
                    <div className="flex justify-center pt-6">
                      <Button
                        onClick={loadMore}
                        disabled={isLoading}
                        variant="outline"
                        className="border-border/80 text-foreground/90 hover:bg-muted/30"
                      >
                        {isLoading ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Loading...
                          </>
                        ) : (
                          'Load More Posts'
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          {isAuthenticated && (
            <>
              <TabsContent value="following" className="mt-6">
                <div className="space-y-6">
                  {isFeedLoading ? (
                    <div className="flex justify-center py-12">
                      <LoadingSpinner size="lg" />
                    </div>
                  ) : feedPosts.length === 0 ? (
                    <EmptyState
                      title="No posts from connections"
                      description="Start connecting with alumni to see their posts here!"
                      action={{
                        label: "Explore Directory",
                        onClick: () => window.location.href = '/directory'
                      }}
                    />
                  ) : (
                    feedPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onPostUpdate={handlePostUpdate}
                        onPostDelete={handlePostDelete}
                      />
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="saved" className="mt-6">
                <div className="space-y-6">
                  {isSavedLoading ? (
                    <div className="flex justify-center py-12">
                      <LoadingSpinner size="lg" />
                    </div>
                  ) : savedPosts.length === 0 ? (
                    <EmptyState
                      title="No saved posts"
                      description="Posts you bookmark will appear here for easy access later."
                      action={{
                        label: "Browse Posts",
                        onClick: () => setActiveTab('recent')
                      }}
                    />
                  ) : (
                    savedPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onPostUpdate={handlePostUpdate}
                        onPostDelete={handlePostDelete}
                      />
                    ))
                  )}
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}
