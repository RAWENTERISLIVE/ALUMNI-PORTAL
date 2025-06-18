
import { useState, ReactNode } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Image } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/apiService';

const postSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, 'Post content is required').max(2000, 'Post content cannot exceed 2000 characters'),
  category: z.enum(['general', 'career', 'networking', 'events', 'achievements', 'announcements']).optional(),
  imageUrl: z.string().refine((val) => !val || val === '' || /^https?:\/\//.test(val), 'Please enter a valid URL').optional(),
  visibility: z.enum(['public', 'alumni_only', 'private']).optional(),
  tags: z.array(z.string()).optional(),
  isSchoolUpdate: z.boolean().optional(),
});

type CreatePostFormProps = {
  onPostCreated: (post: any) => void;
  children?: ReactNode;
};

export function CreatePostForm({ onPostCreated, children }: CreatePostFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const form = useForm<z.infer<typeof postSchema>>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: '',
      content: '',
      category: 'general',
      imageUrl: '',
      visibility: 'alumni_only',
      tags: [],
    },
  });

  const watchedImageUrl = form.watch('imageUrl');

  async function onSubmit(values: z.infer<typeof postSchema>) {
    try {
      setIsSubmitting(true);
      
      // Clean up the values - remove empty imageUrl
      const cleanedValues = {
        ...values,
        imageUrl: values.imageUrl?.trim() || undefined, // Convert empty string to undefined
        tags: values.tags || [],
        category: values.category || 'general',
        visibility: values.visibility || 'alumni_only',
        isSchoolUpdate: values.isSchoolUpdate || false
      };
      
      const response = await apiService.createPost(cleanedValues);
      
      if (response.success) {
        onPostCreated((response as any).post);
        
        toast({
          title: 'Post created',
          description: 'Your post has been published successfully.',
          variant: 'default',
        });
        
        form.reset();
        setOpen(false);
      } else {
        throw new Error(response.message || 'Failed to create post');
      }
    } catch (error: any) {
      console.error('Post creation error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create post. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="w-full flex items-center gap-2 bg-primary hover:bg-primary/90">
            <PlusCircle className="h-4 w-4" />
            Create New Post
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif">Share Your Story</DialogTitle>
          <DialogDescription>
            Connect with your alumni community. Share updates, news, or insights.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title (optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Give your post a title..." 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What's on your mind?</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Share updates, news, or insights with fellow alumni..." 
                      className="min-h-[120px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <div className="text-xs text-muted-foreground text-right">
                    {field.value.length}/2000
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <select 
                        {...field}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="general">General</option>
                        <option value="career">Career</option>
                        <option value="networking">Networking</option>
                        <option value="events">Events</option>
                        <option value="achievements">Achievements</option>
                        <option value="announcements">Announcements</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visibility</FormLabel>
                    <FormControl>
                      <select 
                        {...field}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="alumni_only">Alumni Only</option>
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Add an image (optional)</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Image URL" 
                        {...field} 
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        className="shrink-0 border-accent text-accent hover:bg-accent/10"
                      >
                        <Image className="h-4 w-4" />
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Image preview section */}
            {watchedImageUrl && (
              <div className="mt-2 relative aspect-video w-full overflow-hidden rounded-md">
                <img
                  src={watchedImageUrl}
                  alt="Post preview"
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    // Handle image loading error
                    e.currentTarget.src = 'https://placehold.co/600x400?text=Image+Not+Found';
                  }}
                />
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? <LoadingSpinner size="sm" /> : 'Publish Post'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
