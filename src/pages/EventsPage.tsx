import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Users, Plus, Clock } from "lucide-react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/services/apiService";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface EventAttendee {
  id: string;
}

interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category?: string;
  imageUrl?: string;
  isVirtual?: boolean;
  attendees?: EventAttendee[];
}

interface CreateEventPayload {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  isVirtual: boolean;
  maxAttendees?: number;
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [myEvents, setMyEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState<CreateEventPayload>({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    category: "networking",
    isVirtual: false,
  });
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getEvents();
      if (response.success) {
        setEvents(response.data || []);
      } else {
        setEvents([]);
        toast({ title: "Error", description: response.message || "Failed to load events", variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchMyEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getUserEvents();
      if (response.success) {
        setMyEvents(response.data || []);
      } else {
        setMyEvents([]);
        toast({ title: "Error", description: response.message || "Failed to load your events", variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (activeTab === "all") {
      void fetchEvents();
      return;
    }

    if (activeTab === "my") {
      void fetchMyEvents();
    }
  }, [activeTab, fetchEvents, fetchMyEvents]);

  const handleRSVP = async (eventId: string, isAttending: boolean) => {
    const response = isAttending
      ? await apiService.cancelRsvp(eventId)
      : await apiService.rsvpEvent(eventId);

    if (!response.success) {
      toast({
        title: "Error",
        description: response.message || "Failed to update RSVP. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const toastTitle = isAttending ? "RSVP Cancelled" : "RSVP Confirmed";
    const toastDescription = isAttending
      ? "You are no longer attending this event."
      : "You are now attending this event.";

    toast({
      title: toastTitle,
      description: toastDescription,
    });

    if (activeTab === "all") {
      fetchEvents();
      return;
    }

    fetchMyEvents();
  };

  const resetCreateForm = () => {
    setNewEvent({
      title: "",
      description: "",
      date: "",
      time: "",
      location: "",
      category: "networking",
      isVirtual: false,
    });
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title.trim() || !newEvent.description.trim() || !newEvent.date || !newEvent.time) {
      toast({
        title: "Missing fields",
        description: "Please fill title, description, date, and time.",
        variant: "destructive",
      });
      return;
    }

    const hasLocation = newEvent.location.trim().length > 0;
    if (!newEvent.isVirtual && !hasLocation) {
      toast({
        title: "Missing location",
        description: "Please provide a location or mark this as a virtual event.",
        variant: "destructive",
      });
      return;
    }

    const eventLocation = newEvent.isVirtual ? "Virtual" : newEvent.location;

    const payload = {
      ...newEvent,
      location: eventLocation,
      maxAttendees: newEvent.maxAttendees || undefined,
    };

    setIsSubmittingEvent(true);
    const response = await apiService.createEvent(payload);
    setIsSubmittingEvent(false);

    if (!response.success) {
      toast({
        title: "Error",
        description: response.message || "Failed to create event.",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Event created", description: "Your event has been published." });
    setIsCreateModalOpen(false);
    resetCreateForm();
    setActiveTab("all");
    void fetchEvents();
  };

  const renderEventCard = (event: EventItem) => {
    const eventDate = new Date(event.date);
    const isAttending = Boolean(currentUser?.id && event.attendees?.some((a) => a.id === currentUser.id));

    return (
      <Card key={event.id} className="flex flex-col">
        {event.imageUrl && (
          <div className="h-48 w-full overflow-hidden rounded-t-xl">
            <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
          </div>
        )}
        <CardContent className="flex-1 p-6">
          <div className="flex justify-between items-start mb-4">
            <Badge className="bg-primary/10 text-foreground" variant="secondary">{event.category || 'Event'}</Badge>
            <div className="text-right">
              <span className="text-2xl font-bold text-primary block">{eventDate.getDate()}</span>
              <span className="uppercase text-xs font-semibold text-muted-foreground">
                {eventDate.toLocaleString('default', { month: 'short' })}
              </span>
            </div>
          </div>
          
          <h3 className="text-xl font-bold mb-2">{event.title}</h3>
          
          <div className="space-y-2 mb-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{event.isVirtual ? 'Virtual Event' : event.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span>{event.attendees?.length || 0} attending</span>
            </div>
          </div>
          
          <p className="line-clamp-3 text-foreground/80">{event.description}</p>
        </CardContent>
        <CardFooter className="p-6 pt-0 mt-auto border-t border-border mt-4">
          <Button 
            className="w-full" 
            variant={isAttending ? "outline" : "default"}
            onClick={() => handleRSVP(event.id, isAttending)}
          >
            {isAttending ? 'Cancel RSVP' : 'RSVP Now'}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  const renderAllEventsContent = () => {
    if (isLoading) {
      return <div className="py-20"><LoadingSpinner /></div>;
    }

    if (events.length === 0) {
      return (
        <EmptyState
          icon={<Calendar className="h-10 w-10" />}
          title="No upcoming events"
          description="There are currently no scheduled events. Check back later or host your own."
        />
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map(renderEventCard)}
      </div>
    );
  };

  const renderMyEventsContent = () => {
    if (isLoading) {
      return <div className="py-20"><LoadingSpinner /></div>;
    }

    if (myEvents.length === 0) {
      return (
        <EmptyState
          icon={<Calendar className="h-10 w-10" />}
          title="No RSVPs yet"
          description="You haven't registered for any upcoming events."
        />
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myEvents.map(renderEventCard)}
      </div>
    );
  };

  const locationPlaceholder = newEvent.isVirtual ? "Virtual" : "Location";

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <PageHeader 
        title="Events & Meetups" 
        description="Discover and join alumni events, workshops, and networking sessions."
        action={
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Host Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[560px]">
              <DialogHeader>
                <DialogTitle>Host an Event</DialogTitle>
                <DialogDescription>
                  Create a meetup, workshop, or networking session for alumni.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="event-title">Event title</Label>
                  <Input
                    id="event-title"
                    placeholder="Event title"
                    value={newEvent.title}
                    onChange={(event) => setNewEvent((prev) => ({ ...prev, title: event.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event-description">Description</Label>
                  <Textarea
                    id="event-description"
                    placeholder="Describe your event"
                    rows={4}
                    value={newEvent.description}
                    onChange={(event) => setNewEvent((prev) => ({ ...prev, description: event.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="event-date">Date</Label>
                    <Input
                      id="event-date"
                      type="date"
                      value={newEvent.date}
                      onChange={(event) => setNewEvent((prev) => ({ ...prev, date: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-time">Time</Label>
                    <Input
                      id="event-time"
                      type="time"
                      value={newEvent.time}
                      onChange={(event) => setNewEvent((prev) => ({ ...prev, time: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event-category">Category</Label>
                  <Select
                    value={newEvent.category}
                    onValueChange={(value) => setNewEvent((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger id="event-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="networking">Networking</SelectItem>
                      <SelectItem value="career">Career</SelectItem>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event-location">Location</Label>
                  <Input
                    id="event-location"
                    placeholder={locationPlaceholder}
                    value={newEvent.location}
                    onChange={(event) => setNewEvent((prev) => ({ ...prev, location: event.target.value }))}
                    disabled={newEvent.isVirtual}
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">Virtual event</span>
                  <Button
                    type="button"
                    variant={newEvent.isVirtual ? "default" : "outline"}
                    onClick={() => {
                      setNewEvent((prev) => {
                        const nextIsVirtual = prev.isVirtual ? false : true;
                        const nextLocation = nextIsVirtual ? "" : prev.location;
                        return {
                          ...prev,
                          isVirtual: nextIsVirtual,
                          location: nextLocation,
                        };
                      });
                    }}
                  >
                    {newEvent.isVirtual ? "Yes" : "No"}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event-max-attendees">Max attendees (optional)</Label>
                  <Input
                    id="event-max-attendees"
                    type="number"
                    min={1}
                    placeholder="Max attendees (optional)"
                    value={newEvent.maxAttendees || ""}
                    onChange={(event) => {
                      const nextMaxAttendees = event.target.value ? Number(event.target.value) : undefined;
                      setNewEvent((prev) => ({
                        ...prev,
                        maxAttendees: nextMaxAttendees,
                      }));
                    }}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleCreateEvent} disabled={isSubmittingEvent}>
                  {isSubmittingEvent ? "Creating..." : "Create Event"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <TabsList className="mb-6">
          <TabsTrigger value="all">Upcoming Events</TabsTrigger>
          <TabsTrigger value="my">My RSVPs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-6">
          {renderAllEventsContent()}
        </TabsContent>
        
        <TabsContent value="my" className="space-y-6">
          {renderMyEventsContent()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
