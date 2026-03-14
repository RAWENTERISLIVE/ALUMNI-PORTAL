import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
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
    bookmarks?: string[];
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

export function PostCard({ post, onPostUpdate, onPostDelete }: PostCardProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const isAuthor = currentUser?.id === post.author.id;
  const likeCount = post.reactions?.filter(r => r.type === 'like').length || 0;
  const bookmarkCount = post.bookmarks?.length || 0;

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
        // Update the post locally
        const updatedPost = {
          ...post,
          isBookmarked: !post.isBookmarked,
          bookmarks: post.isBookmarked 
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

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title || 'Check out this post',
          text: post.content.substring(0, 100) + '...',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied",
          description: "Post link has been copied to clipboard.",
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDelete = async () => {
    if (!isAuthor) return;
    
    if (confirm('Are you sure you want to delete this post?')) {
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
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
    <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author.profileImage} />
              <AvatarFallback className="bg-primary/10 text-blue-700 font-medium">
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
                {post.author.classYear && (
                  <Badge variant="outline" className="text-xs border-slate-300 text-muted-foreground">
                    Class of {post.author.classYear}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`text-xs font-medium border ${getCategoryColor(post.category)}`}>
                  {post.category.charAt(0).toUpperCase() + post.category.slice(1)}
                </Badge>
                <span className="text-sm text-muted/300">
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted/300 hover:text-slate-700">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
              {isAuthor && (
                <>
                  <DropdownMenuItem className="text-slate-700 hover:bg-muted/30">
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
              <DropdownMenuItem className="text-slate-700 hover:bg-muted/30">
                Report Post
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
        <div className="prose prose-sm max-w-none text-slate-700 mb-4">
          <p className="whitespace-pre-wrap leading-relaxed">{displayContent}</p>
          {shouldTruncateContent && (
            <button
              onClick={() => setShowFullContent(!showFullContent)}
              className="text-foreground/90 hover:text-blue-700 font-medium text-sm mt-2"
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
                key={index} 
                variant="secondary" 
                className="text-xs bg-primary/5 text-blue-700 border-blue-200"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Attachments */}
        {post.attachments && post.attachments.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Attachments ({post.attachments.length})
            </h4>
            <div className="grid gap-2">
              {post.attachments.map((attachment, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    {getFileIcon(attachment.type)}
                    <div>
                      <p className="text-sm font-medium text-foreground">{attachment.name}</p>
                      <p className="text-xs text-muted/300">{formatFileSize(attachment.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="text-foreground/90 hover:text-blue-700 hover:bg-primary/5"
                  >
                    <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* External Links */}
        {post.externalLinks && post.externalLinks.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Links ({post.externalLinks.length})
            </h4>
            <div className="space-y-2">
              {post.externalLinks.map((link, index) => (
                <a
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  <ExternalLink className="h-4 w-4 text-foreground/90 flex-shrink-0" />
                  <span className="text-sm text-foreground/90 hover:text-blue-700 truncate">
                    {link}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={isLiking}
              className={`gap-2 ${
                post.isLiked 
                  ? 'text-red-600 hover:text-red-700' 
                  : 'text-muted-foreground hover:text-slate-700'
              } hover:bg-muted/30`}
            >
              <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
              {likeCount > 0 && <span className="text-sm">{likeCount}</span>}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-slate-700 hover:bg-muted/30"
            >
              <MessageCircle className="h-4 w-4" />
              {post.commentCount > 0 && <span className="text-sm">{post.commentCount}</span>}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="gap-2 text-muted-foreground hover:text-slate-700 hover:bg-muted/30"
            >
              <Share2 className="h-4 w-4" />
              {post.shareCount > 0 && <span className="text-sm">{post.shareCount}</span>}
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBookmark}
            disabled={isBookmarking}
            className={`gap-2 ${
              post.isBookmarked 
                ? 'text-foreground/90 hover:text-blue-700' 
                : 'text-muted-foreground hover:text-slate-700'
            } hover:bg-muted/30`}
          >
            <Bookmark className={`h-4 w-4 ${post.isBookmarked ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
