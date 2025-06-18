
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";

interface BecomeMentorFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export function BecomeMentorForm({ isOpen, onClose, onSubmit }: BecomeMentorFormProps) {
  const { toast } = useToast();
  const form = useForm({
    defaultValues: {
      expertise: "",
      availability: "1-2 hours/month",
      bio: "",
    }
  });

  const handleSubmit = (data: any) => {
    // Convert expertise string to array
    const processedData = {
      ...data,
      expertise: data.expertise.split(',').map((item: string) => item.trim()).filter((item: string) => item)
    };
    
    onSubmit(processedData);
    
    toast({
      title: "Mentor Application Submitted",
      description: "Your mentor application has been submitted successfully. We'll review and update your profile soon.",
    });
    
    onClose();
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Become a Mentor</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="expertise"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Areas of Expertise</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Product Management, UX Design, Career Transitions" {...field} />
                  </FormControl>
                  <FormDescription>
                    Separate each skill with commas
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="availability"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Availability</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select availability" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1-2 hours/month">1-2 hours/month</SelectItem>
                      <SelectItem value="2-3 hours/month">2-3 hours/month</SelectItem>
                      <SelectItem value="4+ hours/month">4+ hours/month</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mentor Bio</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Write a brief description about your professional background and what you can offer as a mentor..."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Submit Application</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
