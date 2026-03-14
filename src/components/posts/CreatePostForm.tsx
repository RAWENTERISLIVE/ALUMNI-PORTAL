import { useState, useRef } from 'react';
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
  Image, 
  Upload, 
  FileText, 
  Link2, 
  X,
  Tag,
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

const rawApiUrl = import.meta.env.VITE_API_URL?.trim();
const API_BASE_URL = rawApiUrl
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/+$/, '')}/api`)
  : '/api';

// Post schema focusing on essential features only
const postSchema = z.object({
  title: z.string().max(200, 'Title cannot exceed 200 characters').optional(),
  content: z.string().min(1, 'Please share what\'s on your mind').max(2000, 'Content cannot exceed 2000 characters'),
  category: z.enum(['general', 'career', 'networking', 'events', 'achievements', 'announcements']).default('general'),
  tags: z.array(z.string()).optional(),
  visibility: z.enum(['everyone', 'alumni_only', 'faculty_only']).default('everyone'),
  attachments: z.array(z.any()).optional(),
  externalLinks: z.array(z.string().url('Please enter a valid URL')).optional()
});

type PostFormData = z.infer<typeof postSchema>;

type CreatePostFormProps = {
  onPostCreated?: (post: any) => void;
  trigger?: React.ReactNode;
  className?: string;
};

export function CreatePostForm({ onPostCreated, trigger, className = "" }: CreatePostFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      attachments: [],
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

  // File upload handler
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles: File[] = [];
    
    for (const file of files) {
      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 50MB limit`,
          variant: "destructive",
        });
        continue;
      }
      
      // Check file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Unsupported file type",
          description: `${file.name} is not a supported file type`,
          variant: "destructive",
        });
        continue;
      }
      
      validFiles.push(file);
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  // Remove file
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

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

  // Real file upload function
  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/uploads/single`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      if (result.success) {
        return result.data.url; // Use the URL from the database record
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('File upload error:', error);
      throw new Error(error.message || 'Failed to upload file');
    }
  };

  const onSubmit = async (data: PostFormData) => {
    setIsSubmitting(true);
    try {
      // Upload files first
      const uploadedAttachments = [];
      for (const file of selectedFiles) {
        const uploadedUrl = await uploadFile(file);
        uploadedAttachments.push({
          type: file.type.startsWith('image/') ? 'image' : 'document',
          url: uploadedUrl,
          name: file.name,
          size: file.size
        });
      }

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
        attachments: uploadedAttachments,
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
        setSelectedFiles([]);
        setUploadProgress({});
        setOpen(false);
        
        if (onPostCreated) {
          onPostCreated(response.post);
        }
      } else {
        throw new Error(response.message || 'Failed to create post');
      }
    } catch (error: any) {
      toast({
        title: "Failed to create post",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            variant="outline" 
            className={`bg-card border-2 border-border hover:border-blue-300 hover:bg-primary/5 transition-all duration-200 ${className}`}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Post
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">Create New Post</DialogTitle>
        </DialogHeader>
        
        <div className="flex items-center gap-3 py-4 border-b border-border">
          <Avatar className="h-10 w-10">
            <AvatarImage src={currentUser?.profileImage} />
            <AvatarFallback className="bg-primary/10 text-blue-700">
              {currentUser?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-foreground">{currentUser?.name}</p>
            <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
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
                  <FormLabel className="text-slate-700 font-medium">Title (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Give your post a title..."
                      className="border-slate-300 focus:border-primary focus:ring-primary"
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
                  <FormLabel className="text-slate-700 font-medium">What's on your mind?</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Share your thoughts, updates, or insights with the community..."
                      className="min-h-[120px] border-slate-300 focus:border-primary focus:ring-primary resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <div className="flex justify-between items-center">
                    <FormMessage />
                    <span className="text-sm text-muted/300">
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
                    <FormLabel className="text-slate-700 font-medium">Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-slate-300 focus:border-primary">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card border-border">
                        {categories.map((category) => (
                          <SelectItem 
                            key={category.value} 
                            value={category.value}
                            className="hover:bg-primary/5 focus:bg-primary/5"
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
                    <FormLabel className="text-slate-700 font-medium">Visibility</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-slate-300 focus:border-primary">
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card border-border">
                        {visibilityOptions.map((option) => (
                          <SelectItem 
                            key={option.value} 
                            value={option.value}
                            className="hover:bg-primary/5 focus:bg-primary/5"
                          >
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-muted/300">{option.description}</div>
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
              <FormLabel className="text-slate-700 font-medium">Tags</FormLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="border-slate-300 focus:border-primary"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addTag}
                  className="border-slate-300 hover:bg-primary/5"
                >
                  <Hash className="h-4 w-4" />
                </Button>
              </div>
              {form.getValues('tags')?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.getValues('tags')?.map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="bg-primary/10 text-blue-800 hover:bg-blue-200"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-blue-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* File Upload Section */}
            <div className="space-y-3">
              <FormLabel className="text-slate-700 font-medium">Attachments</FormLabel>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-muted-foreground mb-2">
                  Drag files here or <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-foreground/90 hover:text-blue-700 underline"
                  >
                    browse
                  </button>
                </p>
                <p className="text-xs text-muted/300">
                  Supports images, PDFs, documents up to 50MB each
                </p>
              </div>
              
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file)}
                        <div>
                          <p className="text-sm font-medium text-foreground">{file.name}</p>
                          <p className="text-xs text-muted/300">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      {uploadProgress[file.name] && (
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${uploadProgress[file.name]}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted/300">{uploadProgress[file.name]}%</span>
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-muted/300 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* External Links Section */}
            <div className="space-y-3">
              <FormLabel className="text-slate-700 font-medium">External Links</FormLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a link (https://...)"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExternalLink())}
                  className="border-slate-300 focus:border-primary"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addExternalLink}
                  className="border-slate-300 hover:bg-primary/5"
                >
                  <Link2 className="h-4 w-4" />
                </Button>
              </div>
              {form.getValues('externalLinks')?.length > 0 && (
                <div className="space-y-2">
                  {form.getValues('externalLinks')?.map((link, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Link2 className="h-4 w-4 text-foreground/90" />
                        <a 
                          href={link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-foreground/90 hover:text-blue-700 underline text-sm truncate max-w-xs"
                        >
                          {link}
                        </a>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExternalLink(link)}
                        className="text-muted/300 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                className="border-slate-300 text-slate-700 hover:bg-muted/30"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !form.getValues('content').trim()}
                className="bg-primary/90 hover:bg-blue-700 text-white font-medium px-6"
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
