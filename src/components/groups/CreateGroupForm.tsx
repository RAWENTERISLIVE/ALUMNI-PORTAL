import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Globe, Lock, Users, Camera, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import apiService from "@/services/apiService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CreateGroupFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export function CreateGroupForm({ isOpen, onClose, onSubmit }: CreateGroupFormProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      privacy: "public",
      category: "professional",
      imageUrl: ""
    }
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const response = await apiService.uploadFile(file);
      if (response.success && response.data?.url) {
        form.setValue('imageUrl', response.data.url);
        toast({ title: "Image uploaded" });
      }
    } catch (error) {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (data: any) => {
    if (!data.name.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive"
      });
      return;
    }

    onSubmit(data);
    
    toast({
      title: "Group Created Successfully",
      description: "Your group has been created and is now visible to other alumni.",
    });
    
    onClose();
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">Create New Group</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-20 w-20 border-2 border-primary/20">
                <AvatarImage src={form.watch('imageUrl')} />
                <AvatarFallback className="bg-primary/5 text-primary">
                  <Users className="h-10 w-10 opacity-20" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Camera className="h-4 w-4 mr-2" />}
                  Add Group Photo
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                <p className="text-[10px] text-muted-foreground">Optional profile photo for the group</p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Tech Alumni Network" 
                      {...field} 
                      className="rounded-lg border-gray-300 focus:border-primary/30 focus:ring-primary/30"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the purpose and goals of your group..."
                      className="min-h-[100px] rounded-lg border-gray-300 focus:border-primary/30 focus:ring-primary/30"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-lg border-gray-300 focus:border-primary/30 focus:ring-primary/30">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="regional">Regional</SelectItem>
                      <SelectItem value="tech">Technology</SelectItem>
                      <SelectItem value="entrepreneurship">Entrepreneurship</SelectItem>
                      <SelectItem value="mentorship">Mentorship</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the main focus of your group
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="privacy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Privacy Setting</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-lg border-gray-300 focus:border-primary/30 focus:ring-primary/30">
                        <SelectValue placeholder="Select privacy setting" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-foreground" />
                          <div>
                            <div className="font-medium">Public</div>
                            <div className="text-xs text-muted/300">Anyone can see and join</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-red-500" />
                          <div>
                            <div className="font-medium">Private</div>
                            <div className="text-xs text-muted/300">Invitation only</div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {field.value === 'public' 
                      ? "Public groups are discoverable and anyone can join"
                      : "Private groups require an invitation to join and are not listed publicly"
                    }
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="border-gray-300 hover:bg-muted/30 text-foreground/80"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-primary hover:bg-primary/90 text-white transform hover:scale-105 hover:shadow-md transition-all duration-300"
              >
                <Users className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
