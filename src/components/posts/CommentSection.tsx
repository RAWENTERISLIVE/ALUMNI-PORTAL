import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import apiService from '@/services/apiService';
import { 
  MessageCircle, 
  Heart, 
  Reply,
  MoreHorizontal,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id?: string;
  _id: string;
  content: string;
  author: {
    id?: string;
    _id: string;
    name: string;
    profileImage?: string;
    role?: string;
  };
  likes: Array<string | { id?: string; _id?: string }>;
  createdAt: string;
  updatedAt: string;
}

interface CommentSectionProps {
  postId: string;
}

export const CommentSection = ({ postId }: CommentSectionProps) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [repliesMap, setRepliesMap] = useState<Record<string, Comment[]>>({});
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({});

  const getCommentId = (comment: Comment) => comment.id || comment._id;
  const getAuthorId = (comment: Comment) => comment.author.id || comment.author._id;
  const getLikeIds = (comment: Comment) =>
    (comment.likes || [])
      .map((like) => (typeof like === 'string' ? like : like.id || like._id || ''))
      .filter(Boolean);

  const normalizeComment = (comment: any): Comment => ({
    ...comment,
    id: comment.id || comment._id,
    _id: comment._id || comment.id,
    likes: (comment.likes || []).map((like: any) =>
      typeof like === 'string' ? like : like.id || like._id || ''
    ),
    author: {
      ...comment.author,
      id: comment.author?.id || comment.author?._id,
      _id: comment.author?._id || comment.author?.id,
    },
  });

  const normalizeComments = (items: any[]) => (items || []).map(normalizeComment);

  // Fetch comments on component mount
  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPostComments(postId, { page, limit: 10 });
      
      if (response.success) {
        setComments(normalizeComments(response.data || []));
        setHasMore(
          response.pagination && 
          response.pagination.page < response.pagination.pages
        );
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to load comments",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while loading comments",
        variant: "destructive"
      });
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreComments = async () => {
    try {
      const nextPage = page + 1;
      const response = await apiService.getPostComments(postId, { page: nextPage, limit: 10 });
      
      if (response.success) {
        setComments(prev => [...prev, ...normalizeComments(response.data || [])]);
        setPage(nextPage);
        setHasMore(
          response.pagination && 
          response.pagination.page < response.pagination.pages
        );
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load more comments",
        variant: "destructive"
      });
      console.error("Error loading more comments:", error);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      setSubmitting(true);
      const commentData = {
        content: newComment.trim(),
        ...(replyingTo && { parentCommentId: replyingTo })
      };

      let response;
      if (replyingTo) {
        // This is a reply
        response = await apiService.createComment(postId, commentData);
        // If successful, add to the replies map
        if (response.success && response.data) {
          const newReply = normalizeComment(response.data);
          setRepliesMap(prev => ({
            ...prev,
            [replyingTo]: [...(prev[replyingTo] || []), newReply]
          }));
          setReplyingTo(null);
        }
      } else {
        // This is a top-level comment
        response = await apiService.createComment(postId, commentData);
        // If successful, add to the comments list
        if (response.success && response.data) {
          setComments(prev => [normalizeComment(response.data), ...prev]);
        }
      }

      if (!response.success) {
        toast({
          title: "Error",
          description: response.message || "Failed to add comment",
          variant: "destructive"
        });
      } else {
        setNewComment('');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while adding your comment",
        variant: "destructive"
      });
      console.error("Error submitting comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string, isLiked: boolean) => {
    try {
      let response;
      if (isLiked) {
        response = await apiService.unlikeComment(commentId);
      } else {
        response = await apiService.likeComment(commentId);
      }

      if (response.success) {
        // Update comment likes in state
        const updateCommentLikes = (commentsArray: Comment[]) => {
          return commentsArray.map(comment => {
            if (getCommentId(comment) === commentId) {
              const likes = [...getLikeIds(comment)];
              if (isLiked) {
                const index = likes.findIndex(id => id === currentUser?.id);
                if (index !== -1) likes.splice(index, 1);
              } else {
                likes.push(currentUser?.id || '');
              }
              return { ...comment, likes };
            }
            return comment;
          });
        };

        // Update top-level comments
        setComments(updateCommentLikes);

        // Update replies if needed
        const updatedRepliesMap: Record<string, Comment[]> = {};
        Object.keys(repliesMap).forEach(parentId => {
          updatedRepliesMap[parentId] = updateCommentLikes(repliesMap[parentId]);
        });
        setRepliesMap(updatedRepliesMap);
      } else {
        toast({
          title: "Error",
          description: response.message || `Failed to ${isLiked ? 'unlike' : 'like'} comment`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred",
        variant: "destructive"
      });
      console.error(`Error ${isLiked ? 'unliking' : 'liking'} comment:`, error);
    }
  };

  const handleDeleteComment = async (commentId: string, isReply = false, parentId?: string) => {
    try {
      const response = await apiService.deleteComment(commentId);
      
      if (response.success) {
        if (isReply && parentId) {
          // Remove reply from repliesMap
          setRepliesMap(prev => ({
            ...prev,
            [parentId]: prev[parentId].filter(reply => getCommentId(reply) !== commentId)
          }));
        } else {
          // Remove top-level comment
          setComments(prev => prev.filter(comment => getCommentId(comment) !== commentId));
          // Also remove any replies
          const updatedRepliesMap = { ...repliesMap };
          delete updatedRepliesMap[commentId];
          setRepliesMap(updatedRepliesMap);
        }

        toast({
          title: "Success",
          description: "Comment deleted successfully"
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete comment",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting the comment",
        variant: "destructive"
      });
      console.error("Error deleting comment:", error);
    }
  };

  const handleLoadReplies = async (commentId: string) => {
    if (repliesMap[commentId]?.length > 0 || loadingReplies[commentId]) return;
    
    try {
      setLoadingReplies(prev => ({ ...prev, [commentId]: true }));
      const response = await apiService.getCommentReplies(commentId);
      
      if (response.success) {
        setRepliesMap(prev => ({
          ...prev,
          [commentId]: normalizeComments(response.data || [])
        }));
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to load replies",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while loading replies",
        variant: "destructive"
      });
      console.error("Error loading replies:", error);
    } finally {
      setLoadingReplies(prev => ({ ...prev, [commentId]: false }));
    }
  };

  const renderCommentActions = (comment: Comment, isReply = false, parentId?: string) => {
    const commentId = getCommentId(comment);
    const likeIds = getLikeIds(comment);
    const isLiked = likeIds.includes(currentUser?.id || '');
    const isAuthor = getAuthorId(comment) === currentUser?.id;
    const canDelete = isAuthor || currentUser?.role === 'admin';

    return (
      <div className="flex items-center gap-2 text-xs text-muted/300 mt-1">
        <button 
          onClick={() => handleLikeComment(commentId, isLiked)}
          className={`flex items-center gap-1 hover:text-pink-500 ${isLiked ? 'text-pink-500' : ''}`}
        >
          <Heart className="h-3 w-3" fill={isLiked ? "currentColor" : "none"} />
          <span>{likeIds.length > 0 ? likeIds.length : ''}</span>
        </button>

        {!isReply && (
          <button 
            onClick={() => {
              setReplyingTo(commentId);
              handleLoadReplies(commentId);
            }}
            className="flex items-center gap-1 hover:text-foreground"
          >
            <Reply className="h-3 w-3" />
            <span>Reply</span>
          </button>
        )}
        
        {canDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hover:text-foreground/80">
                <MoreHorizontal className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                className="text-red-500 cursor-pointer flex items-center gap-2"
                onClick={() => handleDeleteComment(commentId, isReply, parentId)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  };

  const renderComment = (comment: Comment, isReply = false, parentId?: string) => {
    const commentId = getCommentId(comment);
    return (
      <div key={commentId} className={`flex gap-2 ${isReply ? 'ml-8 mt-2' : 'mt-4'}`}>
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.author.profileImage || '/placeholder.svg'} alt={comment.author.name} />
          <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="bg-gray-100 rounded-lg px-3 py-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-medium text-sm">{comment.author.name}</span>
                {comment.author.role && (
                  <span className="ml-2 text-xs text-muted/300">{comment.author.role}</span>
                )}
              </div>
              <span className="text-xs text-muted/300">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm mt-1">{comment.content}</p>
          </div>
          {renderCommentActions(comment, isReply, parentId)}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-4 border-t pt-4">
      <h3 className="font-medium text-lg flex items-center gap-2 mb-4">
        <MessageCircle className="h-5 w-5" /> Comments
      </h3>
      
      {currentUser ? (
        <div className="flex gap-3 mb-4">
          <Avatar className="h-8 w-8">
            <AvatarImage src={currentUser.profileImage || '/placeholder.svg'} alt={currentUser.name} />
            <AvatarFallback>{currentUser.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px] resize-none"
            />
            <div className="flex justify-between mt-2">
              {replyingTo && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setReplyingTo(null)}
                >
                  Cancel
                </Button>
              )}
              <Button 
                size="sm"
                onClick={handleSubmitComment}
                disabled={submitting || !newComment.trim()}
                className="ml-auto"
              >
                {submitting ? 'Posting...' : replyingTo ? 'Reply' : 'Comment'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted/300 mb-4">
          Sign in to leave a comment
        </p>
      )}
      
      <div className="space-y-2">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-2 mt-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-24 w-full rounded-lg" />
              </div>
            </div>
          ))
        ) : comments.length === 0 ? (
          <p className="text-muted/300 text-center py-4">No comments yet. Be the first to comment!</p>
        ) : (
          <>
            {comments.map(comment => (
              <div key={getCommentId(comment)}>
                {renderComment(comment)}
                
                {/* Replies section */}
                {repliesMap[getCommentId(comment)]?.length > 0 && (
                  <div className="mt-2">
                    {repliesMap[getCommentId(comment)].map(reply => renderComment(reply, true, getCommentId(comment)))}
                  </div>
                )}
                
                {/* Show replies button */}
                {!repliesMap[getCommentId(comment)] && !loadingReplies[getCommentId(comment)] && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="ml-10 text-xs"
                    onClick={() => handleLoadReplies(getCommentId(comment))}
                  >
                    View replies
                  </Button>
                )}
                
                {/* Loading replies indicator */}
                {loadingReplies[getCommentId(comment)] && (
                  <div className="ml-10 mt-2">
                    <Skeleton className="h-10 w-32" />
                  </div>
                )}
                
                {/* Reply input */}
                {replyingTo === getCommentId(comment) && (
                  <div className="flex gap-2 ml-10 mt-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={currentUser?.profileImage || '/placeholder.svg'} alt={currentUser?.name} />
                      <AvatarFallback>{currentUser?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Textarea
                        placeholder="Write a reply..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[60px] resize-none text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Load more comments button */}
            {hasMore && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={loadMoreComments} 
                className="w-full mt-4"
              >
                Load more comments
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
