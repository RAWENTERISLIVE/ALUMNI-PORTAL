import { useState } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  PlusCircle, 
  Link2, 
  X,
  Hash
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/apiService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Post schema focusing on essential features only
const postSchema = z.object({
  title: z.string().max(200, 'Title cannot exceed 200 characters').optional(),
  content: z.string().min(1, 'Please share what\'s on your mind').max(2000, 'Content cannot exceed 2000 characters'),
  category: z.enum(['general', 'career', 'networking', 'events', 'achievements', 'announcements']).default('general'),
  tags: z.array(z.string()).optional(),
  visibility: z.enum(['everyone', 'alumni_only', 'faculty_only']).default('everyone'),
  externalLinks: z.array(z.string().url('Please enter a valid URL')).optional()
});

type PostFormData = z.infer<typeof postSchema>;

interface Post {
  id: string;
  title?: string;
  content: string;
  category: string;
  tags?: string[];
  externalLinks?: string[];
  visibility: string;
  createdAt: string;
  updatedAt: string;
}

type CreatePostFormProps = {
  onPostCreated?: (post: Post) => void;
  trigger?: React.ReactNode;
  className?: string;
};

export function CreatePostForm({ onPostCreated, trigger, className = "" }: Readonly<CreatePostFormProps>) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: '',
      content: '',
      category: 'general',
      tags: [],
      visibility: 'everyone',
      externalLinks: []
    }
  });

  const categories = [
    { value: 'general', label: 'General Discussion' },
    { value: 'career', label: 'Career & Opportunities' },
    { value: 'networking', label: 'Networking' },
    { value: 'events', label: 'Events & Meetups' },
    { value: 'achievements', label: 'Achievements & Milestones' },
    { value: 'announcements', label: 'Announcements' }
  ];

  const visibilityOptions = [
    { value: 'everyone', label: 'Everyone', description: 'Visible to all users' },
    { value: 'alumni_only', label: 'Alumni Only', description: 'Visible to alumni only' },
    { value: 'faculty_only', label: 'Faculty Only', description: 'Visible to faculty only' }
  ];

  // Add tag
  const addTag = () => {
    if (tagInput.trim() && !form.getValues('tags')?.includes(tagInput.trim())) {
      const currentTags = form.getValues('tags') || [];
      form.setValue('tags', [...currentTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags') || [];
    form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  // Add external link
  const addExternalLink = () => {
    if (linkInput.trim()) {
      try {
        new URL(linkInput.trim()); // Validate URL
        const currentLinks = form.getValues('externalLinks') || [];
        if (!currentLinks.includes(linkInput.trim())) {
          form.setValue('externalLinks', [...currentLinks, linkInput.trim()]);
          setLinkInput('');
        }
      } catch {
        toast({
          title: "Invalid URL",
          description: "Please enter a valid URL",
          variant: "destructive",
        });
      }
    }
  };

  // Remove external link
  const removeExternalLink = (linkToRemove: string) => {
    const currentLinks = form.getValues('externalLinks') || [];
    form.setValue('externalLinks', currentLinks.filter(link => link !== linkToRemove));
  };

  const onSubmit = async (data: PostFormData) => {
    setIsSubmitting(true);
    try {
      // Prepare post data, ensuring content is provided
      if (!data.content || data.content.trim() === '') {
        toast({
          title: "Content required",
          description: "Please add some content to your post.",
          variant: "destructive",
        });
        return;
      }

      const postData = {
        title: data.title,
        content: data.content,
        category: data.category,
        tags: data.tags,
        externalLinks: data.externalLinks,
        visibility: data.visibility === 'everyone' ? 'public' : data.visibility
      };

      // Create post
      const response = await apiService.createPost(postData);
      
      if (response.success) {
        toast({
          title: "Post created successfully!",
          description: "Your post has been shared with the community.",
        });
        
        form.reset();
        setOpen(false);
        
        if (onPostCreated && response.post) {
          onPostCreated(response.post);
        }
      } else {
        throw new Error(response.message || 'Failed to create post');
      }
    } catch (error) {
      toast({
        title: "Failed to create post",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            className={`bg-orange-500 text-white hover:bg-orange-600 rounded-lg px-4 py-2 transition-colors ${className}`}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Post
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white shadow-lg rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">Create New Post</DialogTitle>
        </DialogHeader>
        
        <div className="flex items-center gap-3 py-4 border-b border-gray-200">
          <Avatar className="h-10 w-10">
            <AvatarImage src={currentUser?.profileImage} />
            <AvatarFallback className="bg-orange-100 text-orange-700">
              {currentUser?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-gray-900">{currentUser?.name}</p>
            <p className="text-sm text-gray-600">{currentUser?.email}</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title Field */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">Title (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Give your post a title..."
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-orange-300 focus:border-orange-500"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content Field */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">What's on your mind?</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Share your thoughts, updates, or insights with the community..."
                      className="min-h-[120px] w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-orange-300 focus:border-orange-500 resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <div className="flex justify-between items-center">
                    <FormMessage />
                    <span className="text-sm text-gray-500">
                      {field.value.length}/2000
                    </span>
                  </div>
                </FormItem>
              )}
            />

            {/* Category and Visibility */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-orange-300">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg">
                        {categories.map((category) => (
                          <SelectItem 
                            key={category.value} 
                            value={category.value}
                            className="hover:bg-orange-50 focus:bg-orange-50"
                          >
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Visibility</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-orange-300">
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg">
                        {visibilityOptions.map((option) => (
                          <SelectItem 
                            key={option.value} 
                            value={option.value}
                            className="hover:bg-orange-50 focus:bg-orange-50"
                          >
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-gray-500">{option.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tags Section */}
            <div className="space-y-3">
              <FormLabel className="text-gray-700 font-medium">Tags</FormLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-orange-300"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addTag}
                  className="border border-orange-500 text-orange-500 px-3 py-1.5 hover:bg-orange-50"
                >
                  <Hash className="h-4 w-4" />
                </Button>
              </div>
              {form.getValues('tags')?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.getValues('tags')?.map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="secondary" 
                      className="bg-orange-100 text-orange-800 hover:bg-orange-200"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-orange-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* External Links Section */}
            <div className="space-y-3">
              <FormLabel className="text-gray-700 font-medium">External Links</FormLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a link (https://...)"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addExternalLink();
                    }
                  }}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-orange-300"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addExternalLink}
                  className="border border-orange-500 text-orange-500 px-3 py-1.5 hover:bg-orange-50"
                >
                  <Link2 className="h-4 w-4" />
                </Button>
              </div>
              {form.getValues('externalLinks')?.length > 0 && (
                <div className="space-y-2">
                  {form.getValues('externalLinks')?.map((link) => (
                    <div key={link} className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Link2 className="h-4 w-4 text-orange-500" />
                        <a 
                          href={link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-orange-500 hover:text-orange-700 underline text-sm truncate max-w-xs"
                        >
                          {link}
                        </a>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExternalLink(link)}
                        className="text-gray-500 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                className="bg-gray-100 text-gray-700 rounded-lg px-4 py-2 hover:bg-gray-200"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !form.getValues('content').trim()}
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-4 py-2 font-medium"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Publishing...
                  </>
                ) : (
                  'Publish Post'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
