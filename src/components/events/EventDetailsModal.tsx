import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Users, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/services/apiService";

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  organizer: { name: string; email: string };
  attendees: string[];
  category: string;
  status: string;
  isVirtual: boolean;
  meetingLink?: string;
}

interface EventDetailsModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onEventUpdated: () => void;
}

export function EventDetailsModal({ event, isOpen, onClose, onEventUpdated }: EventDetailsModalProps) {
  const { toast } = useToast();

  if (!event) return null;

  const handleRSVP = async () => {
    try {
      const response = await apiService.rsvpEvent(event._id);
      if (response.success) {
        toast({ title: "RSVP Successful", description: "You have successfully RSVP'd to this event." });
        onEventUpdated();
        onClose();
      }
    } catch (error) {
      toast({ title: "RSVP Failed", description: "Failed to RSVP. Please try again.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{event.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Badge>{event.category}</Badge>
            <Badge variant="outline">{event.status}</Badge>
          </div>
          
          <p className="text-gray-700">{event.description}</p>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center"><Calendar className="h-4 w-4 mr-2" />{new Date(event.date).toLocaleDateString()}</div>
            <div className="flex items-center"><Clock className="h-4 w-4 mr-2" />{event.time}</div>
            <div className="flex items-center"><MapPin className="h-4 w-4 mr-2" />{event.isVirtual ? 'Virtual Event' : event.location}</div>
            <div className="flex items-center"><Users className="h-4 w-4 mr-2" />{event.attendees.length} attending</div>
            <div className="flex items-center"><User className="h-4 w-4 mr-2" />Organized by {event.organizer.name}</div>
          </div>
          
          {event.isVirtual && event.meetingLink && (
            <div className="p-3 bg-blue-50 rounded">
              <strong>Meeting Link:</strong> <a href={event.meetingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{event.meetingLink}</a>
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Close</Button>
            {event.status === 'upcoming' && (
              <Button onClick={handleRSVP} className="bg-orange-500 hover:bg-orange-600">RSVP</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}