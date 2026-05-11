import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, GraduationCap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

export function RequestMentorshipModal({ mentor, isOpen, onClose, onSubmit }: Readonly<RequestMentorshipModalProps>) {
  const [message, setMessage] = useState("");
  const [topic, setTopic] = useState("");
  const [sessionMode, setSessionMode] = useState<"chat" | "video" | "meet">("chat");
  const [slotKey, setSlotKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const mentorName = mentor?.user?.name || mentor?.name || "Mentor";
  const mentorAvatar = mentor?.user?.profileImage || mentor?.avatar;
  const mentorTitle = mentor?.user?.title || mentor?.role || "Alumni Mentor";
  const mentorCompany = mentor?.user?.company || mentor?.company || "Alumni Network";
  const mentorGraduationYear = mentor?.user?.graduationYear || mentor?.graduationYear;
  const availableSlots = Array.isArray(mentor?.availableSlots) ? mentor.availableSlots : [];
  const defaultTemplate =
    mentor?.iceBreakerTemplate ||
    "Hi {{mentorName}}, I am {{menteeName}}. I need guidance on {{topic}} and would love a quick {{sessionMode}} session if possible.";

  useEffect(() => {
    if (!isOpen) return;
    const defaultMode = mentor?.sessionMode;
    setSessionMode(defaultMode === 'video' || defaultMode === 'meet' || defaultMode === 'chat' ? defaultMode : 'chat');
    setSlotKey("");
  }, [isOpen, mentor?.sessionMode]);

  const selectedSlot = useMemo(() => {
    if (!slotKey) return null;
    const [day, startTime, endTime] = slotKey.split('|');
    if (!day || !startTime || !endTime) return null;
    return { day, startTime, endTime };
  }, [slotKey]);

  const fillIceBreakerTemplate = () => {
    const nextMessage = defaultTemplate
      .replaceAll('{{mentorName}}', mentorName)
      .replaceAll('{{menteeName}}', 'I')
      .replaceAll('{{topic}}', topic || 'career growth')
      .replaceAll('{{sessionMode}}', sessionMode);

    setMessage(nextMessage);
  };

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
          mentorId: mentor.user?.id || mentor.id,
          topic,
          message,
          sessionMode,
          selectedSlot
        });
      } else {
        // Default behavior if no onSubmit provided
        toast({
          title: "Mentorship Request Sent",
          description: `Your request has been sent to ${mentorName}. You'll be notified when they respond.`,
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
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Request Mentorship</DialogTitle>
          <DialogDescription>
            Choose a topic, preferred session mode, and an optional time slot to send a focused mentorship request.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex gap-4 items-start">
          <Avatar className="h-16 w-16">
            <AvatarImage src={mentorAvatar} alt={mentorName} />
            <AvatarFallback>{mentorName?.charAt(0)}</AvatarFallback>
          </Avatar>
          
          <div>
            <h3 className="text-lg font-medium">{mentorName}</h3>
            
            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
              <Briefcase className="h-3 w-3" />
              <span>{mentorTitle} at {mentorCompany}</span>
            </div>
            
            {mentorGraduationYear && (
              <div className="text-xs bg-muted rounded-full px-2 py-1 flex items-center gap-1 w-fit mt-1">
                <GraduationCap className="h-3 w-3" />
                <span>Class of {mentorGraduationYear}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="mentorship-topic" className="block text-sm font-medium mb-1">Choose a Topic</label>
            <Select onValueChange={setTopic}>
              <SelectTrigger id="mentorship-topic">
                <SelectValue placeholder="Select a topic" />
              </SelectTrigger>
              <SelectContent>
                {mentor?.expertise?.map((skill: string) => (
                  <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="mentorship-mode" className="block text-sm font-medium mb-1">Preferred Session Mode</label>
            <Select value={sessionMode} onValueChange={(value: "chat" | "video" | "meet") => setSessionMode(value)}>
              <SelectTrigger id="mentorship-mode">
                <SelectValue placeholder="Select a mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chat">One-to-one Chat</SelectItem>
                <SelectItem value="video">Video Meet</SelectItem>
                <SelectItem value="meet">In-person Meet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {availableSlots.length > 0 && (
            <div>
              <label htmlFor="mentorship-slot" className="block text-sm font-medium mb-1">Preferred Time Slot</label>
              <Select value={slotKey} onValueChange={setSlotKey}>
                <SelectTrigger id="mentorship-slot">
                  <SelectValue placeholder="Select an available slot" />
                </SelectTrigger>
                <SelectContent>
                  {availableSlots.map((slot: any, index: number) => {
                    const key = `${slot.day}|${slot.startTime}|${slot.endTime}`;
                    return (
                      <SelectItem key={`${key}-${index}`} value={key}>
                        {slot.day} • {slot.startTime} - {slot.endTime}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="mentorship-message" className="block text-sm font-medium">Your Message</label>
              <Button type="button" variant="outline" size="sm" onClick={fillIceBreakerTemplate}>
                Use Ice-breaker Template
              </Button>
            </div>
            <Textarea 
              id="mentorship-message"
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
