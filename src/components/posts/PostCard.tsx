import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  Heart, 
  MessageCircle, 
  Bookmark, 
  MoreHorizontal,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Paperclip
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import apiService from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';
import { CommentSection } from './CommentSection';

interface PostCardProps {
  post: {
    id: string;
    title?: string;
    content: string;
    author: {
      id: string;
      name: string;
      profileImage?: string;
      role?: string;
      classYear?: number;
    };
    category: string;
    visibility: string;
    tags?: string[];
    attachments?: Array<{
      type: 'image' | 'document';
      url: string;
      name: string;
      size: number;
    }>;
    externalLinks?: string[];
    reactions?: Array<{
      userId: string;
      type: string;
    }>;
    reactionCount?: number;
    bookmarks?: string[];
    bookmarkCount?: number;
    commentCount?: number;
    shareCount?: number;
    isLiked?: boolean;
    isBookmarked?: boolean;
    createdAt: string;
    updatedAt: string;
  };
  onPostUpdate?: (updatedPost: any) => void;
  onPostDelete?: (postId: string) => void;
}

export function PostCard({ post, onPostUpdate, onPostDelete }: Readonly<PostCardProps>) {
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const isAuthor = currentUser?.id === post.author.id;
  const likeCount = post.reactionCount ?? (post.reactions?.filter(r => r.type === 'like').length || 0);
  const bookmarkCount = post.bookmarkCount ?? (post.bookmarks?.length || 0);

  const handleLike = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    try {
      const response = await apiService.likePost(post.id, 'like');
      if (response.success && response.post) {
        onPostUpdate?.(response.post);
        toast({
          title: post.isLiked ? "Post unliked" : "Post liked",
          description: "Your reaction has been updated.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update reaction",
        variant: "destructive",
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleBookmark = async () => {
    if (isBookmarking) return;
    
    setIsBookmarking(true);
    try {
      const response = await apiService.bookmarkPost(post.id, !post.isBookmarked);
      if (response.success) {
        const wasBookmarked = Boolean(post.isBookmarked);
        const nextBookmarkCount = Math.max(0, bookmarkCount + (wasBookmarked ? -1 : 1));

        // Update the post locally
        const updatedPost = {
          ...post,
          isBookmarked: !wasBookmarked,
          bookmarkCount: nextBookmarkCount,
          bookmarks: wasBookmarked 
            ? post.bookmarks?.filter(id => id !== currentUser?.id) 
            : [...(post.bookmarks || []), currentUser?.id]
        };
        onPostUpdate?.(updatedPost);
        
        toast({
          title: post.isBookmarked ? "Bookmark removed" : "Post bookmarked",
          description: post.isBookmarked ? "Post removed from bookmarks" : "Post saved to bookmarks",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update bookmark",
        variant: "destructive",
      });
    } finally {
      setIsBookmarking(false);
    }
  };

  const getShareText = () => {
    const contentPreview = post.content.length > 120 ? `${post.content.substring(0, 120)}...` : post.content;
    return `${post.title || 'Check this alumni update'}\n\n${contentPreview}`;
  };

  const getShareUrl = () => globalThis.location.origin;

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      toast({
        title: 'Link copied',
        description: 'App link copied. You can paste it in any app.',
      });
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Unable to copy the link right now.',
        variant: 'destructive',
      });
    }
  };

  const openShareWindow = (url: string) => {
    globalThis.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareLinkedIn = () => {
    const shareUrl = encodeURIComponent(getShareUrl());
    openShareWindow(`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`);
  };

  const handleShareInstagram = async () => {
    await handleCopyShareLink();
    openShareWindow('https://www.instagram.com/');
  };

  const handleShareYouTube = async () => {
    await handleCopyShareLink();
    openShareWindow('https://www.youtube.com/');
  };

  const handleShareX = () => {
    const shareUrl = encodeURIComponent(getShareUrl());
    const shareText = encodeURIComponent(getShareText());
    openShareWindow(`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`);
  };

  const handleCommentClick = () => setShowComments((prev) => !prev);

  const handleEditPost = () => {
    toast({
      title: 'Edit post',
      description: 'Post editing UI is coming soon.',
    });
  };

  const handleReportPost = () => {
    toast({
      title: 'Report post',
      description: 'Post reporting flow is coming soon.',
    });
  };

  const handleDelete = async () => {
    if (!isAuthor) return;
    
    if (globalThis.confirm('Are you sure you want to delete this post?')) {
      try {
        const response = await apiService.deletePost(post.id);
        if (response.success) {
          onPostDelete?.(post.id);
          toast({
            title: "Post deleted",
            description: "Your post has been deleted successfully.",
          });
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to delete post",
          variant: "destructive",
        });
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    return type === 'image' ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      general: 'bg-muted text-foreground/90 border-border',
      career: 'bg-primary/10 text-blue-800 border-blue-200',
      networking: 'bg-green-100 text-green-800 border-green-200',
      events: 'bg-purple-100 text-purple-800 border-purple-200',
      achievements: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      announcements: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[category as keyof typeof colors] || colors.general;
  };

  const shouldTruncateContent = post.content.length > 300;
  const displayContent = shouldTruncateContent && !showFullContent 
    ? post.content.substring(0, 300) + '...' 
    : post.content;

  return (
    <Card className="rounded-xl border border-border/60 bg-card shadow-sm transition-all duration-200 hover:border-border hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author.profileImage} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {post.author.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-foreground">{post.author.name}</h4>
                {post.author.role && (
                  <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
                    {post.author.role}
                  </Badge>
                )}
                {!!post.author.classYear && (
                  <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                    Class of {post.author.classYear}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`text-xs font-medium border ${getCategoryColor(post.category)}`}>
                  {post.category.charAt(0).toUpperCase() + post.category.slice(1)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
              {isAuthor && (
                <>
                  <DropdownMenuItem
                    onClick={handleEditPost}
                    className="text-foreground hover:bg-muted"
                  >
                    Edit Post
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-red-600 hover:bg-red-50"
                  >
                    Delete Post
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem
                onClick={handleReportPost}
                className="text-foreground hover:bg-muted"
              >
                Report Post
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleShareLinkedIn}
                className="text-foreground hover:bg-muted"
              >
                Share on LinkedIn
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleShareX}
                className="text-foreground hover:bg-muted"
              >
                Share on X
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleShareInstagram}
                className="text-foreground hover:bg-muted"
              >
                Share to Instagram
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleShareYouTube}
                className="text-foreground hover:bg-muted"
              >
                Share to YouTube
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleCopyShareLink}
                className="text-foreground hover:bg-muted"
              >
                Copy App Link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Title */}
        {post.title && (
          <h3 className="text-lg font-semibold text-foreground mb-3">{post.title}</h3>
        )}
        
        {/* Content */}
        <div className="prose prose-sm max-w-none text-foreground/90 mb-4">
          <p className="whitespace-pre-wrap leading-relaxed">{displayContent}</p>
          {shouldTruncateContent && (
            <button
              onClick={() => setShowFullContent(!showFullContent)}
              className="mt-2 text-sm font-medium text-primary hover:text-primary/90"
            >
              {showFullContent ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
        
        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag, index) => (
              <Badge 
                key={`${tag}-${index}`} 
                variant="secondary" 
                className="text-xs bg-primary/10 text-primary border-primary/20"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Attachments */}
        {post.attachments && post.attachments.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Attachments ({post.attachments.length})
            </h4>
            <div className="grid gap-2">
              {post.attachments.map((attachment, index) => (
                <div key={`${attachment.url}-${attachment.name}-${index}`}>
                  {attachment.type === 'image' ? (
                    <div className="mb-4 overflow-hidden rounded-xl border border-border/40 shadow-sm transition-all hover:shadow-md">
                      <img 
                        src={attachment.url} 
                        alt={attachment.name || 'Post image'} 
                        className="w-full h-auto max-h-[500px] object-cover cursor-zoom-in"
                        onClick={() => window.open(attachment.url, '_blank')}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/70 mb-2">
                      <div className="flex items-center gap-3">
                        {getFileIcon(attachment.type)}
                        <div>
                          <p className="text-sm font-medium text-foreground">{attachment.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-foreground/90 hover:text-primary hover:bg-primary/10"
                      >
                        <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* External Links */}
        {post.externalLinks && post.externalLinks.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Links ({post.externalLinks.length})
            </h4>
            <div className="space-y-2">
              {post.externalLinks.map((link, index) => (
                <a
                  key={`${link}-${index}`}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border/70 hover:bg-muted transition-colors"
                >
                  <ExternalLink className="h-4 w-4 text-foreground/90 flex-shrink-0" />
                  <span className="text-sm text-foreground/90 hover:text-primary truncate">
                    {link}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border/70">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={isLiking}
              className={`gap-2 rounded-lg ${
                post.isLiked 
                  ? 'text-red-600 hover:text-red-700' 
                  : 'text-muted-foreground hover:text-foreground'
              } hover:bg-muted`}
            >
              <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm">{likeCount > 0 ? likeCount : 'Like'}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCommentClick}
              className="gap-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">{post.commentCount > 0 ? post.commentCount : 'Comment'}</span>
            </Button>
            
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBookmark}
            disabled={isBookmarking}
            className={`gap-2 rounded-lg ${
              post.isBookmarked 
                ? 'text-primary hover:text-primary/90' 
                : 'text-muted-foreground hover:text-foreground'
            } hover:bg-muted`}
          >
            <Bookmark className={`h-4 w-4 ${post.isBookmarked ? 'fill-current' : ''}`} />
            <span className="text-sm">{bookmarkCount > 0 ? bookmarkCount : 'Save'}</span>
          </Button>
        </div>

        {showComments && <CommentSection postId={post.id} />}
      </CardContent>
    </Card>
  );
}
