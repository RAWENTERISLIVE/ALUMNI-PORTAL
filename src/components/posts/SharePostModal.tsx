import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import apiService from '@/services/apiService';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface Author {
  _id: string;
  name: string;
  profileImage?: string;
  role?: string;
  email?: string;
}

interface Post {
  id: string;
  content: string;
  author: Author;
  createdAt: string;
  updatedAt?: string;
  shareCount?: number;
}

interface SharePostModalProps {
  open: boolean;
  onClose: () => void;
  post: Post;
  onSuccess?: (updatedPost: any) => void;
}

export const SharePostModal = ({ 
  open, 
  onClose, 
  post,
  onSuccess 
}: SharePostModalProps) => {
  const { toast } = useToast();
  const [comment, setComment] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'connections_only'>('public');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSharePost = async () => {
    try {
      setIsSubmitting(true);
      
      console.log('Sharing post with visibility:', visibility);
      
      const response = await apiService.sharePost({
        originalPostId: post.id,
        content: comment.trim(),
        visibility: visibility
      });
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Post shared successfully",
        });
        setComment('');
        onClose();
        if (onSuccess) onSuccess(response.data || { shareCount: (post.shareCount || 0) + 1 });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to share post",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sharing post:", error);
      toast({
        title: "Error",
        description: "An error occurred while sharing the post",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="text-foreground">Share Post</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Textarea 
            placeholder="Add a comment (optional)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="resize-none"
            rows={4}
          />
          
          <div className="mb-4">
            <label htmlFor="visibility" className="block text-sm font-medium text-foreground/90 mb-1">Who can see this?</label>
            <select 
              id="visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as 'public' | 'connections_only')}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary bg-card text-foreground/90"
            >
              <option value="public">Everyone</option>
              <option value="connections_only">Connections Only</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              {visibility === 'connections_only' ? 
                "Only your connections will see this shared post" : 
                "Anyone can see this shared post"}
            </p>
          </div>
          
          <div className="border rounded-lg p-2 bg-muted/30">
            <Card className="shadow-none border-none">
              <CardHeader className="p-2 pb-0">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={post.author.profileImage || '/placeholder.svg'} />
                    <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{post.author.name}</p>
                    <p className="text-xs text-muted/300">
                      {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-2">
                <p className="text-sm line-clamp-3">{post.content}</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-end space-x-2 pt-2">
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={isSubmitting}
              className="border-gray-300 text-foreground/90 hover:bg-muted/30"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSharePost} 
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sharing...
                </>
              ) : (
                'Share Now'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SharePostModal;
