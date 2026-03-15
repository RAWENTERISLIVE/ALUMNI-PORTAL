
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { useState } from "react";

interface BecomeMentorFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export function BecomeMentorForm({ isOpen, onClose, onSubmit }: Readonly<BecomeMentorFormProps>) {
  const { toast } = useToast();
  const [sessionMode, setSessionMode] = useState<"chat" | "video" | "meet">("chat");
  const [iceBreakerTemplate, setIceBreakerTemplate] = useState(
    "Hi {{mentorName}}, I am {{menteeName}}. I need guidance on {{topic}} and would love a quick {{sessionMode}} session if possible."
  );
  const [slots, setSlots] = useState<Array<{ day: string; startTime: string; endTime: string }>>([
    { day: "Monday", startTime: "18:00", endTime: "19:00" }
  ]);

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
      expertise: data.expertise.split(',').map((item: string) => item.trim()).filter(Boolean),
      sessionMode,
      availableSlots: slots.filter((slot) => slot.day && slot.startTime && slot.endTime),
      iceBreakerTemplate,
      communicationPreferences: [sessionMode, 'email']
    };
    
    onSubmit(processedData);
    
    toast({
      title: "Mentor Application Submitted",
      description: "Your mentor application has been submitted successfully. We'll review and update your profile soon.",
    });
    
    onClose();
    form.reset();
    setSessionMode("chat");
    setIceBreakerTemplate("Hi {{mentorName}}, I am {{menteeName}}. I need guidance on {{topic}} and would love a quick {{sessionMode}} session if possible.");
    setSlots([{ day: "Monday", startTime: "18:00", endTime: "19:00" }]);
  };

  const updateSlot = (index: number, key: 'day' | 'startTime' | 'endTime', value: string) => {
    setSlots((prev) => prev.map((slot, i) => (i === index ? { ...slot, [key]: value } : slot)));
  };

  const addSlot = () => {
    setSlots((prev) => [...prev, { day: 'Monday', startTime: '18:00', endTime: '19:00' }]);
  };

  const removeSlot = (index: number) => {
    setSlots((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Become a Mentor</DialogTitle>
          <DialogDescription>
            Share your expertise, preferred mentorship format, and available slots so mentees can request focused sessions.
          </DialogDescription>
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

            <div className="space-y-2">
              <FormLabel>Preferred Mentorship Mode</FormLabel>
              <Select value={sessionMode} onValueChange={(value: "chat" | "video" | "meet") => setSessionMode(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chat">One-to-one Chat</SelectItem>
                  <SelectItem value="video">Video Meet</SelectItem>
                  <SelectItem value="meet">In-person Meet</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>Mentees see this as your default session style.</FormDescription>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Available Time Slots</FormLabel>
                <Button type="button" variant="outline" size="sm" onClick={addSlot}>+ Add Slot</Button>
              </div>
              {slots.map((slot, index) => (
                <div key={`${slot.day}-${slot.startTime}-${slot.endTime}-${index}`} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                  <Select value={slot.day} onValueChange={(value) => updateSlot(index, 'day', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monday">Monday</SelectItem>
                      <SelectItem value="Tuesday">Tuesday</SelectItem>
                      <SelectItem value="Wednesday">Wednesday</SelectItem>
                      <SelectItem value="Thursday">Thursday</SelectItem>
                      <SelectItem value="Friday">Friday</SelectItem>
                      <SelectItem value="Saturday">Saturday</SelectItem>
                      <SelectItem value="Sunday">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="time" value={slot.startTime} onChange={(e) => updateSlot(index, 'startTime', e.target.value)} />
                  <Input type="time" value={slot.endTime} onChange={(e) => updateSlot(index, 'endTime', e.target.value)} />
                  <Button type="button" variant="outline" onClick={() => removeSlot(index)} disabled={slots.length <= 1}>Remove</Button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <FormLabel>Ice-breaker Message Template</FormLabel>
              <Textarea
                value={iceBreakerTemplate}
                onChange={(e) => setIceBreakerTemplate(e.target.value)}
                className="min-h-[90px]"
                placeholder="Use {{mentorName}}, {{menteeName}}, {{topic}}, {{sessionMode}} placeholders"
              />
              <FormDescription>Used to prefill mentee messages and reduce long back-and-forth.</FormDescription>
            </div>
            
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
