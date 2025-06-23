import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import apiService from '@/services/apiService';
import { MessageCircle, Heart, Trash2, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  _id: string;
  content: string;
  author: {
    _id: string;
    name: string;
    profileImage?: string;
  };
  likes: string[];
  createdAt: string;
}

interface CommentSectionProps {
  postId: string;
}

export const CommentSectionNew = ({ postId }: CommentSectionProps) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch comments
  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPostComments(postId, { page: 1, limit: 50 });
      
      if (response.success && response.data) {
        setComments(response.data);
      } else {
        console.error('Failed to fetch comments:', response.message);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !currentUser) return;
    
    try {
      setSubmitting(true);
      const response = await apiService.createComment({
        postId,
        content: newComment.trim()
      });

      if (response.success && response.data) {
        // Add the new comment to the list
        setComments(prev => [response.data, ...prev]);
        setNewComment('');
        toast({
          title: "Success",
          description: "Comment added successfully",
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to add comment",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      toast({
        title: "Error",
        description: "An error occurred while adding the comment",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!currentUser) return;

    try {
      const comment = comments.find(c => c._id === commentId);
      if (!comment) return;

      const isLiked = comment.likes.includes(currentUser.id);
      
      if (isLiked) {
        await apiService.unlikeComment(commentId);
        setComments(prev => prev.map(c => 
          c._id === commentId 
            ? { ...c, likes: c.likes.filter(id => id !== currentUser.id) }
            : c
        ));
      } else {
        await apiService.likeComment(commentId);
        setComments(prev => prev.map(c => 
          c._id === commentId 
            ? { ...c, likes: [...c.likes, currentUser.id] }
            : c
        ));
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await apiService.deleteComment(commentId);
      
      if (response.success) {
        setComments(prev => prev.filter(c => c._id !== commentId));
        toast({
          title: "Success",
          description: "Comment deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete comment",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "An error occurred while deleting the comment",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 mt-4">
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5 text-gray-500" />
          <span className="text-sm text-gray-500">Loading comments...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4 border-t pt-4">
      {/* Comment Form */}
      {currentUser && (
        <form onSubmit={handleSubmitComment} className="flex space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={currentUser.profileImage} />
            <AvatarFallback>
              {currentUser.name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="min-h-[80px] resize-none"
              disabled={submitting}
            />
            <div className="flex justify-end">
              <Button 
                type="submit" 
                size="sm" 
                disabled={!newComment.trim() || submitting}
                className="flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>{submitting ? 'Posting...' : 'Post Comment'}</span>
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="flex space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.author.profileImage} />
                <AvatarFallback>
                  {comment.author.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-1">
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{comment.author.name}</span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{comment.content}</p>
                </div>
                
                <div className="flex items-center space-x-4 px-3">
                  <button
                    onClick={() => handleLikeComment(comment._id)}
                    className={`flex items-center space-x-1 text-xs ${
                      comment.likes.includes(currentUser?.id || '') 
                        ? 'text-red-500' 
                        : 'text-gray-500 hover:text-red-500'
                    }`}
                  >
                    <Heart className="h-3 w-3" />
                    <span>{comment.likes.length}</span>
                  </button>
                  
                  {currentUser && (currentUser.id === comment.author._id || currentUser.role === 'admin') && (
                    <button
                      onClick={() => handleDeleteComment(comment._id)}
                      className="flex items-center space-x-1 text-xs text-gray-500 hover:text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
