import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, GraduationCap } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export interface RequestMentorshipModalProps {
  mentor: any;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => Promise<void>;
}

export function RequestMentorshipModal({ mentor, isOpen, onClose, onSubmit }: RequestMentorshipModalProps) {
  const [message, setMessage] = useState("");
  const [topic, setTopic] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!message.trim() || !topic) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields before submitting your request.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      if (onSubmit) {
        await onSubmit({
          mentorId: mentor.id,
          topic,
          message
        });
      } else {
        // Default behavior if no onSubmit provided
        toast({
          title: "Mentorship Request Sent",
          description: `Your request has been sent to ${mentor.user?.name || mentor.name}. You'll be notified when they respond.`,
        });
      }
      
      onClose();
      setMessage("");
      setTopic("");
    } catch (error) {
      console.error("Error submitting mentorship request:", error);
      toast({
        title: "Error",
        description: "Failed to send mentorship request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Request Mentorship</DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-4 items-start">
          <Avatar className="h-16 w-16">
            <AvatarImage src={mentor?.avatar} alt={mentor?.name} />
            <AvatarFallback>{mentor?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          
          <div>
            <h3 className="text-lg font-medium">{mentor?.name}</h3>
            
            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
              <Briefcase className="h-3 w-3" />
              <span>{mentor?.role} at {mentor?.company}</span>
            </div>
            
            <div className="text-xs bg-muted rounded-full px-2 py-1 flex items-center gap-1 w-fit mt-1">
              <GraduationCap className="h-3 w-3" />
              <span>Class of {mentor?.graduationYear}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Choose a Topic</label>
            <Select onValueChange={setTopic}>
              <SelectTrigger>
                <SelectValue placeholder="Select a topic" />
              </SelectTrigger>
              <SelectContent>
                {mentor?.expertise?.map((skill: string, index: number) => (
                  <SelectItem key={index} value={skill}>{skill}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Your Message</label>
            <Textarea 
              placeholder="Introduce yourself and explain what you'd like to learn from this mentor..."
              className="min-h-[150px]"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Be specific about your goals and what you hope to gain from this mentorship.
              Mention your background and why you're interested in this mentor's expertise.
            </p>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Request'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
