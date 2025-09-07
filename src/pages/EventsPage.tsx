import { useState, useEffect } from \"react\";
import { PageHeader } from \"@/components/common/PageHeader\";
import { Card, CardContent, CardHeader, CardTitle } from \"@/components/ui/card\";
import { Button } from \"@/components/ui/button\";
import { Badge } from \"@/components/ui/badge\";
import { Input } from \"@/components/ui/input\";
import { Tabs, TabsList, TabsTrigger, TabsContent } from \"@/components/ui/tabs\";
import { Calendar, Clock, MapPin, Users, Plus, Search, Filter, User } from \"lucide-react\";
import { useToast } from \"@/hooks/use-toast\";
import { useAuth } from \"@/contexts/AuthContext\";
import { LoadingSpinner } from \"@/components/common/LoadingSpinner\";
import apiService from \"@/services/apiService\";
import { CreateEventModal } from \"@/components/events/CreateEventModal\";
import { EventDetailsModal } from \"@/components/events/EventDetailsModal\";

interface Event {
  _id: string;
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  organizer: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  attendees: string[];
  maxAttendees?: number;
  isVirtual: boolean;
  meetingLink?: string;
  category: 'networking' | 'career' | 'academic' | 'social' | 'workshop' | 'other';
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  imageUrl?: string;
  isSchoolEvent: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function EventsPage() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(\"\");
  const [selectedCategory, setSelectedCategory] = useState(\"all\");
  const [selectedStatus, setSelectedStatus] = useState(\"upcoming\");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await apiService.getEvents({
        page: currentPage,
        limit: 12,
        search: searchTerm || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined
      });
      
      if (response.success) {
        setEvents(response.data || []);
        if (response.pagination) {
          setTotalPages(response.pagination.pages);
        }
      } else {
        throw new Error(response.message || 'Failed to load events');
      }
    } catch (error) {
      console.error('Failed to load events:', error);
      toast({
        title: \"Error\",
        description: \"Failed to load events. Please try again.\",
        variant: \"destructive\"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [currentPage, selectedCategory, selectedStatus]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadEvents();
  };

  const handleRSVP = async (eventId: string) => {
    try {
      const response = await apiService.rsvpEvent(eventId);
      if (response.success) {
        toast({
          title: \"RSVP Successful\",
          description: \"You have successfully RSVP'd to this event.\"
        });
        loadEvents(); // Refresh events
      }
    } catch (error) {
      console.error('RSVP failed:', error);
      toast({
        title: \"RSVP Failed\",
        description: \"Failed to RSVP. Please try again.\",
        variant: \"destructive\"
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      networking: 'bg-blue-100 text-blue-800',
      career: 'bg-green-100 text-green-800',
      academic: 'bg-purple-100 text-purple-800',
      social: 'bg-pink-100 text-pink-800',
      workshop: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      upcoming: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || colors.upcoming;
  };

  const isUserAttending = (event: Event) => {
    return event.attendees.includes(currentUser?.id || '');
  };

  if (loading) {
    return (
      <div className=\"flex justify-center items-center h-96\">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className=\"space-y-6\">
      <PageHeader 
        title=\"Events\" 
        description=\"Discover and join alumni events, workshops, and networking sessions\"
        action={
          <Button onClick={() => setIsCreateModalOpen(true)} className=\"bg-orange-500 hover:bg-orange-600\">
            <Plus className=\"h-4 w-4 mr-2\" />
            Create Event
          </Button>
        }
      />

      {/* Search and Filters */}
      <Card>
        <CardContent className=\"p-6\">
          <div className=\"flex flex-col md:flex-row gap-4\">
            <div className=\"flex-1\">
              <div className=\"relative\">
                <Search className=\"absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400\" />
                <Input
                  placeholder=\"Search events...\"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className=\"pl-10\"
                />
              </div>
            </div>
            <Button onClick={handleSearch} variant=\"outline\">
              <Search className=\"h-4 w-4 mr-2\" />
              Search
            </Button>
          </div>

          <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className=\"mt-4\">
            <TabsList>
              <TabsTrigger value=\"upcoming\">Upcoming</TabsTrigger>
              <TabsTrigger value=\"ongoing\">Ongoing</TabsTrigger>
              <TabsTrigger value=\"completed\">Completed</TabsTrigger>
              <TabsTrigger value=\"all\">All Events</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className=\"flex flex-wrap gap-2 mt-4\">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size=\"sm\"
              onClick={() => setSelectedCategory('all')}
            >
              All Categories
            </Button>
            {['networking', 'career', 'academic', 'social', 'workshop', 'other'].map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size=\"sm\"
                onClick={() => setSelectedCategory(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Events Grid */}
      {events.length === 0 ? (
        <Card>
          <CardContent className=\"p-8 text-center\">
            <Calendar className=\"h-16 w-16 mx-auto text-gray-400 mb-4\" />
            <h3 className=\"text-lg font-semibold text-gray-900 mb-2\">No Events Found</h3>
            <p className=\"text-gray-500 mb-4\">There are no events matching your current filters.</p>
            <Button onClick={() => setIsCreateModalOpen(true)} className=\"bg-orange-500 hover:bg-orange-600\">
              <Plus className=\"h-4 w-4 mr-2\" />
              Create the First Event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6\">
          {events.map((event) => (
            <Card key={event._id} className=\"hover:shadow-lg transition-shadow cursor-pointer\" onClick={() => {
              setSelectedEvent(event);
              setIsDetailsModalOpen(true);
            }}>
              <CardHeader className=\"pb-2\">
                <div className=\"flex justify-between items-start mb-2\">
                  <Badge className={getCategoryColor(event.category)}>
                    {event.category}
                  </Badge>
                  <Badge className={getStatusColor(event.status)}>
                    {event.status}
                  </Badge>
                </div>
                <CardTitle className=\"text-lg line-clamp-2\">{event.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className=\"space-y-3\">
                  <div className=\"flex items-center text-sm text-gray-600\">
                    <Calendar className=\"h-4 w-4 mr-2\" />
                    {formatDate(event.date)}
                  </div>
                  <div className=\"flex items-center text-sm text-gray-600\">
                    <Clock className=\"h-4 w-4 mr-2\" />
                    {event.time}
                  </div>
                  <div className=\"flex items-center text-sm text-gray-600\">
                    <MapPin className=\"h-4 w-4 mr-2\" />
                    {event.isVirtual ? 'Virtual Event' : event.location}
                  </div>
                  <div className=\"flex items-center text-sm text-gray-600\">
                    <User className=\"h-4 w-4 mr-2\" />
                    {event.organizer.name}
                  </div>
                  <div className=\"flex items-center text-sm text-gray-600\">
                    <Users className=\"h-4 w-4 mr-2\" />
                    {event.attendees.length} {event.maxAttendees ? `/ ${event.maxAttendees}` : ''} attending
                  </div>
                  
                  <p className=\"text-sm text-gray-600 line-clamp-2\">
                    {event.description}
                  </p>

                  {event.status === 'upcoming' && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRSVP(event._id);
                      }}
                      disabled={isUserAttending(event)}
                      className={`w-full mt-4 ${
                        isUserAttending(event) 
                          ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                          : 'bg-orange-500 hover:bg-orange-600'
                      }`}
                    >
                      {isUserAttending(event) ? 'Already Attending' : 'RSVP'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className=\"flex justify-center gap-2\">
          <Button
            variant=\"outline\"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </Button>
          <span className=\"flex items-center px-4\">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant=\"outline\"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Modals */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onEventCreated={loadEvents}
      />

      <EventDetailsModal
        event={selectedEvent}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedEvent(null);
        }}
        onEventUpdated={loadEvents}
      />
    </div>
  );
}
