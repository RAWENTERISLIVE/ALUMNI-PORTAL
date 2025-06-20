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
    <Card className="w-full bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 border-2 border-orange-100 ring-1 ring-gray-200">
              <AvatarImage src={authorProfileImage} />
              <AvatarFallback className="bg-orange-100 text-orange-800 font-medium">
                {authorInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900">{authorName}</p>
                {post.isFeatured && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 font-medium">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
                {post.isSchoolUpdate && (
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 font-medium">
                    School Update
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                <span className="text-gray-400">{getVisibilityIcon(post.visibility)}</span>
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
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="border border-gray-200 rounded-lg shadow-lg">
                {isAuthor && (
                  <DropdownMenuItem className="cursor-pointer hover:bg-gray-50 transition-colors">
                    <Edit className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm">Edit</span>
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem 
                    onClick={handleToggleFeature} 
                    disabled={isToggleFeature}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <Star className="h-4 w-4 mr-2 text-amber-500" />
                    <span className="text-sm">{post.isFeatured ? 'Unfeature' : 'Feature'}</span>
                  </DropdownMenuItem>
                )}
                {(isAuthor || isAdmin) && (
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                    <span className="text-sm">Delete</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {post.title && (
          <h3 className="font-bold text-lg text-gray-900 mb-2">{post.title}</h3>
        )}
        <p className="text-gray-700 leading-relaxed mb-3 whitespace-pre-wrap">{post.content}</p>
        
        {post.imageUrl && (
          <div className="mt-3 rounded-lg overflow-hidden">
            <img
              src={post.imageUrl}
              alt="Post image"
              className="w-full h-auto object-cover rounded-lg"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {post.tags.map((tag, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 border-t border-gray-100">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center space-x-1 rounded-full transition-colors ${
                isLiked ? 'text-red-500 hover:bg-red-50' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              <span className="font-medium">{likesCount}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center space-x-1 text-gray-500 rounded-full hover:bg-gray-100 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="font-medium">0</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center space-x-1 text-gray-500 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardFooter>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-xl border border-gray-200 shadow-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-gray-900">Delete Post</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition-colors rounded-lg">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700 transform hover:scale-105 transition-all duration-300 rounded-lg"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
