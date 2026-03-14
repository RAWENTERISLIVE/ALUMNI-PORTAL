import { useState, useEffect } from "react";
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

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [myEvents, setMyEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (activeTab === "all") {
      fetchEvents();
    } else if (activeTab === "my") {
      fetchMyEvents();
    }
  }, [activeTab]);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getEvents();
      if (response.success) {
        setEvents(response.data || []);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load events", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyEvents = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getUserEvents();
      if (response.success) {
        setMyEvents(response.data || []);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load your events", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRSVP = async (eventId: string, isAttending: boolean) => {
    try {
      if (isAttending) {
        await apiService.cancelRsvp(eventId);
        toast({ title: "RSVP Cancelled", description: "You are no longer attending this event." });
      } else {
        await apiService.rsvpEvent(eventId);
        toast({ title: "RSVP Confirmed", description: "You are now attending this event." });
      }
      if (activeTab === "all") fetchEvents();
      else fetchMyEvents();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update RSVP. Please try again.", variant: "destructive" });
    }
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

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <PageHeader 
        title="Events & Meetups" 
        description="Discover and join alumni events, workshops, and networking sessions."
        action={
          <Button className="bg-primary text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Host Event
          </Button>
        }
      />

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <TabsList className="mb-6">
          <TabsTrigger value="all">Upcoming Events</TabsTrigger>
          <TabsTrigger value="my">My RSVPs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-6">
          {isLoading ? (
            <div className="py-20"><LoadingSpinner /></div>
          ) : events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map(renderEventCard)}
            </div>
          ) : (
            <EmptyState 
              icon={<Calendar className="h-10 w-10" />} 
              title="No upcoming events" 
              description="There are currently no scheduled events. Check back later or host your own." 
            />
          )}
        </TabsContent>
        
        <TabsContent value="my" className="space-y-6">
          {isLoading ? (
            <div className="py-20"><LoadingSpinner /></div>
          ) : myEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myEvents.map(renderEventCard)}
            </div>
          ) : (
            <EmptyState 
              icon={<Calendar className="h-10 w-10" />} 
              title="No RSVPs yet" 
              description="You haven't registered for any upcoming events." 
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
