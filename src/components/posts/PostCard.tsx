import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share2, MoreHorizontal, Edit, Trash2, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import apiService from '@/services/apiService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PostCardProps {
  post: {
    id: string;
    title?: string;
    content: string;
    author: {
      id?: string;
      name: string;
      email?: string;
      profileImage?: string;
    };
    category?: string;
    imageUrl?: string;
    isFeatured: boolean;
    isSchoolUpdate: boolean;
    likes: string[];
    visibility: 'public' | 'alumni_only' | 'private';
    tags?: string[];
    createdAt: string;
    updatedAt?: string;
  };
  onPostUpdated?: (post: any) => void;
  onPostDeleted?: (postId: string) => void;
}

export function PostCard({ post, onPostUpdated, onPostDeleted }: PostCardProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggleFeature, setIsToggleFeature] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isAuthor = currentUser?.id === post.author?.id;
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  const isLiked = currentUser?.id ? post.likes.includes(currentUser.id) : false;
  const likesCount = post.likes.length;

  const handleLike = async () => {
    try {
      setIsLiking(true);
      const response = await apiService.likePost(post.id);
      if (response.success && onPostUpdated) {
        onPostUpdated((response as any).post);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to like post',
        variant: 'destructive',
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await apiService.deletePost(post.id);
      if (response.success) {
        toast({
          title: 'Post deleted',
          description: 'Your post has been deleted successfully.',
        });
        if (onPostDeleted) {
          onPostDeleted(post.id);
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete post',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleFeature = async () => {
    try {
      setIsToggleFeature(true);
      const response = await apiService.toggleFeaturePost(post.id);
      if (response.success && onPostUpdated) {
        onPostUpdated((response as any).post);
        toast({
          title: post.isFeatured ? 'Post unfeatured' : 'Post featured',
          description: `Post has been ${post.isFeatured ? 'unfeatured' : 'featured'} successfully.`,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to toggle feature status',
        variant: 'destructive',
      });
    } finally {
      setIsToggleFeature(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      general: 'bg-gray-100 text-gray-800',
      career: 'bg-blue-100 text-blue-800',
      networking: 'bg-green-100 text-green-800',
      events: 'bg-purple-100 text-purple-800',
      achievements: 'bg-yellow-100 text-yellow-800',
      announcements: 'bg-red-100 text-red-800',
    };
    return colors[category as keyof typeof colors] || colors.general;
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return '🌐';
      case 'alumni_only':
        return '🎓';
      case 'private':
        return '🔒';
      default:
        return '🎓';
    }
  };

  // Get author info safely
  const authorName = post.author?.name || 'Anonymous User';
  const authorProfileImage = post.author?.profileImage || '';
  const authorInitials = authorName.split(' ').map(n => n[0]).join('').toUpperCase() || 'AU';

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={authorProfileImage} />
              <AvatarFallback>
                {authorInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">{authorName}</p>
                {post.isFeatured && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
                {post.isSchoolUpdate && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    School Update
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                <span>{getVisibilityIcon(post.visibility)}</span>
                {post.category && (
                  <Badge className={getCategoryColor(post.category)} variant="secondary">
                    {post.category}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {(isAuthor || isAdmin) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isAuthor && (
                  <DropdownMenuItem>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem onClick={handleToggleFeature} disabled={isToggleFeature}>
                    <Star className="h-4 w-4 mr-2" />
                    {post.isFeatured ? 'Unfeature' : 'Feature'}
                  </DropdownMenuItem>
                )}
                {(isAuthor || isAdmin) && (
                  <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {post.title && (
          <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
        )}
        <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">{post.content}</p>
        
        {post.imageUrl && (
          <div className="mt-3 rounded-lg overflow-hidden">
            <img
              src={post.imageUrl}
              alt="Post image"
              className="w-full h-auto object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {post.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center space-x-1 ${isLiked ? 'text-red-500' : 'text-gray-500'}`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{likesCount}</span>
            </Button>
            
            <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-gray-500">
              <MessageCircle className="h-4 w-4" />
              <span>0</span>
            </Button>
            
            <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-gray-500">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardFooter>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
