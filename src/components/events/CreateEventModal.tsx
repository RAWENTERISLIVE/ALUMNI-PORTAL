import { useState } from \"react\";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from \"@/components/ui/dialog\";
import { Button } from \"@/components/ui/button\";
import { Input } from \"@/components/ui/input\";
import { Textarea } from \"@/components/ui/textarea\";
import { Label } from \"@/components/ui/label\";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from \"@/components/ui/select\";
import { Switch } from \"@/components/ui/switch\";
import { useToast } from \"@/hooks/use-toast\";
import apiService from \"@/services/apiService\";
import { CalendarIcon, Clock, MapPin, Users } from \"lucide-react\";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: () => void;
}

export function CreateEventModal({ isOpen, onClose, onEventCreated }: CreateEventModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    category: 'networking' as const,
    isVirtual: false,
    meetingLink: '',
    maxAttendees: '',
    isSchoolEvent: false,
    tags: ''
  });

  const categories = [
    { value: 'networking', label: 'Networking' },
    { value: 'career', label: 'Career' },
    { value: 'academic', label: 'Academic' },
    { value: 'social', label: 'Social' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.date || !formData.time) {
      toast({
        title: \"Validation Error\",
        description: \"Please fill in all required fields.\",
        variant: \"destructive\"
      });
      return;
    }

    if (formData.isVirtual && !formData.meetingLink) {
      toast({
        title: \"Validation Error\",
        description: \"Please provide a meeting link for virtual events.\",
        variant: \"destructive\"
      });
      return;
    }

    try {
      setLoading(true);
      const eventData = {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        location: formData.isVirtual ? 'Virtual Event' : formData.location,
        category: formData.category,
        isVirtual: formData.isVirtual,
        meetingLink: formData.meetingLink || undefined,
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : undefined,
        isSchoolEvent: formData.isSchoolEvent,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
      };

      const response = await apiService.createEvent(eventData);
      
      if (response.success) {
        toast({
          title: \"Event Created\",
          description: \"Your event has been created successfully.\"
        });
        onEventCreated();
        onClose();
        // Reset form
        setFormData({
          title: '',
          description: '',
          date: '',
          time: '',
          location: '',
          category: 'networking',
          isVirtual: false,
          meetingLink: '',
          maxAttendees: '',
          isSchoolEvent: false,
          tags: ''
        });
      } else {
        throw new Error(response.message || 'Failed to create event');
      }
    } catch (error) {
      console.error('Failed to create event:', error);
      toast({
        title: \"Error\",
        description: error instanceof Error ? error.message : \"Failed to create event. Please try again.\",
        variant: \"destructive\"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className=\"max-w-2xl max-h-[90vh] overflow-y-auto\">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            Create a new event to engage with the alumni community.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className=\"space-y-6\">
          {/* Basic Information */}
          <div className=\"space-y-4\">
            <div>
              <Label htmlFor=\"title\">Event Title *</Label>
              <Input
                id=\"title\"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder=\"Enter event title\"
                required
              />
            </div>

            <div>
              <Label htmlFor=\"description\">Description *</Label>
              <Textarea
                id=\"description\"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder=\"Describe your event...\"
                rows={4}
                required
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
            <div>
              <Label htmlFor=\"date\">Date *</Label>
              <div className=\"relative\">
                <CalendarIcon className=\"absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400\" />
                <Input
                  id=\"date\"
                  type=\"date\"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className=\"pl-10\"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor=\"time\">Time *</Label>
              <div className=\"relative\">
                <Clock className=\"absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400\" />
                <Input
                  id=\"time\"
                  type=\"time\"
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  className=\"pl-10\"
                  required
                />
              </div>
            </div>
          </div>

          {/* Location/Virtual */}
          <div className=\"space-y-4\">
            <div className=\"flex items-center space-x-2\">
              <Switch
                id=\"isVirtual\"
                checked={formData.isVirtual}
                onCheckedChange={(checked) => handleInputChange('isVirtual', checked)}
              />
              <Label htmlFor=\"isVirtual\">Virtual Event</Label>
            </div>

            {formData.isVirtual ? (
              <div>
                <Label htmlFor=\"meetingLink\">Meeting Link *</Label>
                <Input
                  id=\"meetingLink\"
                  value={formData.meetingLink}
                  onChange={(e) => handleInputChange('meetingLink', e.target.value)}
                  placeholder=\"https://zoom.us/j/...\"
                  type=\"url\"
                />
              </div>
            ) : (
              <div>
                <Label htmlFor=\"location\">Location *</Label>
                <div className=\"relative\">
                  <MapPin className=\"absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400\" />
                  <Input
                    id=\"location\"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder=\"Enter event location\"
                    className=\"pl-10\"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Category and Settings */}
          <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
            <div>
              <Label htmlFor=\"category\">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor=\"maxAttendees\">Max Attendees (Optional)</Label>
              <div className=\"relative\">
                <Users className=\"absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400\" />
                <Input
                  id=\"maxAttendees\"
                  type=\"number\"
                  value={formData.maxAttendees}
                  onChange={(e) => handleInputChange('maxAttendees', e.target.value)}
                  placeholder=\"Unlimited\"
                  className=\"pl-10\"
                  min=\"1\"
                />
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div className=\"space-y-4\">
            <div className=\"flex items-center space-x-2\">
              <Switch
                id=\"isSchoolEvent\"
                checked={formData.isSchoolEvent}
                onCheckedChange={(checked) => handleInputChange('isSchoolEvent', checked)}
              />
              <Label htmlFor=\"isSchoolEvent\">Official School Event</Label>
            </div>

            <div>
              <Label htmlFor=\"tags\">Tags (Optional)</Label>
              <Input
                id=\"tags\"
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                placeholder=\"Enter tags separated by commas\"
              />
            </div>
          </div>

          {/* Actions */}
          <div className=\"flex justify-end space-x-2 pt-4\">
            <Button type=\"button\" variant=\"outline\" onClick={onClose}>
              Cancel
            </Button>
            <Button type=\"submit\" disabled={loading} className=\"bg-orange-500 hover:bg-orange-600\">
              {loading ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
