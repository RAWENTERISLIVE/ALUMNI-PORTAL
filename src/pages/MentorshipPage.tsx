import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { BecomeMentorForm } from "@/components/mentorship/BecomeMentorForm";
import { RequestMentorshipModal } from "@/components/mentorship/RequestMentorshipModal";
import { Search, Calendar, MessageSquare, Filter, GraduationCap, Users, Briefcase, Tag, Star, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import apiService from "@/services/apiService";
import { ApiResponse, MentorshipProfile, MentorshipRelationship, MentorshipFormData, MentorshipRequestData } from "@/types";

// Mock data for mentors until we can fetch from API
const CATEGORIES = ["Career Guidance", "Industry Insights", "Technical Skills", "Entrepreneurship", "Leadership", "Graduate Studies"];
const YEARS_OF_EXPERIENCE = ["1-3 years", "3-5 years", "5-10 years", "10+ years"];

function MentorshipPage() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<string | null>(null);
  const [mentors, setMentors] = useState<MentorshipProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<MentorshipProfile | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [myMentorships, setMyMentorships] = useState<MentorshipRelationship[]>([]);

  const loadMentors = useCallback(async () => {
    try {
      setLoading(true);
      // Call real API instead of mock data
      const response = await apiService.getMentorshipProfiles({});
      
      if (response.success) {
        setMentors(response.data || []);
      } else {
        toast({ 
          description: response.message || "Failed to load mentors", 
          variant: "destructive" 
        });
      }
    } catch (error) {
      console.error("Error loading mentors:", error);
      toast({ description: "Failed to load mentors", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadMyMentorships = useCallback(async () => {
    try {
      // Load both sent and received mentorship requests
      const [menteeRequestsResponse, mentorRequestsResponse] = await Promise.all([
        apiService.getMenteeRequests(),
        apiService.getMentorRequests()
      ]);
      
      const allRequests = [];
      
      if (menteeRequestsResponse.success) {
        allRequests.push(...(menteeRequestsResponse.data || []).map((req: any) => ({
          ...req,
          type: 'sent'
        })));
      }
      
      if (mentorRequestsResponse.success) {
        allRequests.push(...(mentorRequestsResponse.data || []).map((req: any) => ({
          ...req,
          type: 'received'
        })));
      }
      
      setMyMentorships(allRequests);
    } catch (error) {
      console.error("Error loading mentorships:", error);
      toast({ description: "Failed to load your mentorships", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    loadMentors();
    loadMyMentorships();
  }, [loadMentors, loadMyMentorships]);

  const filteredMentors = mentors.filter(mentor => {
    const matchesQuery = !searchQuery || 
      mentor.userId.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (mentor.userId.title && mentor.userId.title.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesCategory = !selectedCategory || 
      mentor.expertise.some((expertise: string) => expertise === selectedCategory);
      
    const matchesExperience = !selectedExperience || mentor.experience === selectedExperience;
    
    return matchesQuery && matchesCategory && matchesExperience;
  });

  const handleBecomeMentor = async (data: MentorshipFormData) => {
    try {
      const response = await apiService.createMentorshipProfile(data);
      
      if (response.success) {
        toast({ 
          title: "Success", 
          description: "Your mentor profile has been created successfully." 
        });
        setIsMentorModalOpen(false);
        // Refresh the list
        loadMentors();
      } else {
        toast({ 
          description: response.message || "Failed to create mentor profile", 
          variant: "destructive" 
        });
      }
    } catch (error) {
      console.error("Error creating mentor profile:", error);
      toast({ description: "Failed to create mentor profile", variant: "destructive" });
    }
  };

  const handleRequestMentorship = async (data: MentorshipRequestData) => {
    try {
      if (!selectedMentor?.id) {
        toast({ description: "Please select a mentor", variant: "destructive" });
        return;
      }

      const response = await apiService.requestMentorship(selectedMentor.id, {
        message: data.message || "",
        topics: data.topic ? [data.topic] : [],
        preferredSchedule: data.preferredSchedule
      });
      
      if (response.success) {
        toast({ 
          title: "Request Sent", 
          description: "Your mentorship request has been sent. You will be notified when they respond." 
        });
        setIsRequestModalOpen(false);
        // Refresh the list
        loadMyMentorships();
      } else {
        toast({ 
          description: response.message || "Failed to send mentorship request", 
          variant: "destructive" 
        });
      }
    } catch (error) {
      console.error("Error requesting mentorship:", error);
      toast({ description: "Failed to send mentorship request", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Alumni Mentorship Network</h1>
        <p className="text-md text-gray-500 mt-1">Connect with experienced alumni for career guidance and professional growth.</p>
      </div>
      
      <Tabs defaultValue="find" className="mb-6">
        <TabsList className="w-full bg-gray-50 mb-2 p-1 rounded-lg">
          <TabsTrigger 
            value="find" 
            className="flex-1 data-[state=active]:bg-orange-500 data-[state=active]:text-white hover:text-orange-500"
          >
            Find a Mentor
          </TabsTrigger>
          <TabsTrigger 
            value="my" 
            className="flex-1 data-[state=active]:bg-orange-500 data-[state=active]:text-white hover:text-orange-500"
          >
            My Mentorships
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="find">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex flex-col md:flex-row items-start gap-3 mb-6">
                <div className="relative flex-grow w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search mentors by name, expertise or keywords..."
                    className="pl-10 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <LoadingSpinner size="lg" />
                  <span className="ml-3 text-gray-600">Looking for mentors...</span>
                </div>
              ) : filteredMentors.length === 0 ? (
                <EmptyState
                  title="No mentors found"
                  description="Try adjusting your filters or search terms."
                  action={{
                    label: "Clear Filters",
                    onClick: () => {
                      setSearchQuery("");
                      setSelectedCategory(null);
                      setSelectedExperience(null);
                    }
                  }}
                />
              ) : (
                <div className="space-y-4">
                  {filteredMentors.map(mentor => (
                    <Card key={mentor.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 rounded-xl">
                      <CardContent className="p-6">
                        <div className="md:flex md:justify-between">
                          <div className="flex gap-4 mb-4 md:mb-0">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={mentor.userId.profileImage} />
                              <AvatarFallback className="bg-orange-100 text-orange-800 text-xl font-medium">
                                {mentor.userId.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900">{mentor.userId.name}</h3>
                              <p className="text-gray-600">{mentor.userId.title || 'Alumni'}</p>
                              {mentor.userId.graduationYear && (
                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                  <GraduationCap className="h-3 w-3 mr-1" />
                                  <span>Class of {mentor.userId.graduationYear}</span>
                                </div>
                              )}
                              {mentor.rating && (
                                <div className="flex items-center mt-1">
                                  <Star className="h-3 w-3 text-yellow-400" />
                                  <span className="text-sm font-medium ml-1">{mentor.rating}</span>
                                  <span className="text-xs text-gray-500 ml-1">({mentor.reviewCount || 0} reviews)</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <Button
                              className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-4 py-2 transform hover:scale-105 hover:shadow-lg transition-all duration-300 mt-2"
                              onClick={() => {
                                setSelectedMentor(mentor);
                                setIsRequestModalOpen(true);
                              }}
                            >
                              Request Mentorship
                            </Button>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <p className="text-sm text-gray-600 mb-3">{mentor.bio}</p>
                          
                          <div className="flex flex-wrap gap-2 mb-2">
                            {mentor.expertise.map((expertise: string) => (
                              <Badge key={expertise} variant="outline">{expertise}</Badge>
                            ))}
                          </div>
                          
                          <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Briefcase className="h-3 w-3 mr-1 text-gray-400" />
                              <span>{mentor.experience}</span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1 text-gray-400" />
                              <span>{mentor.availability}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            
            <div className="lg:col-span-1">
              <Card className="mb-6 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 rounded-xl">
                <CardContent className="p-6">
                  <Button 
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-4 py-2 transform hover:scale-105 hover:shadow-lg transition-all duration-300"
                    onClick={() => setIsMentorModalOpen(true)}
                  >
                    Become a Mentor
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="font-medium text-lg mb-4">Filters</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Expertise</label>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map(cat => (
                          <Button
                            key={cat}
                            size="sm"
                            variant={selectedCategory === cat ? "default" : "outline"}
                            className={selectedCategory === cat 
                              ? "bg-orange-500 hover:bg-orange-600 text-white" 
                              : "hover:bg-gray-100 text-gray-700"}
                            onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                          >
                            {cat}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Experience Level</label>
                      <div className="flex flex-wrap gap-2">
                        {YEARS_OF_EXPERIENCE.map(exp => (
                          <Button
                            key={exp}
                            size="sm"
                            variant={selectedExperience === exp ? "default" : "outline"}
                            className={selectedExperience === exp ? "bg-orange-500" : ""}
                            onClick={() => setSelectedExperience(selectedExperience === exp ? null : exp)}
                          >
                            {exp}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    {(selectedCategory || selectedExperience) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCategory(null);
                          setSelectedExperience(null);
                        }}
                        className="w-full text-orange-500 hover:text-orange-600"
                      >
                        Clear all filters
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-medium text-lg mb-2">Why Find a Mentor?</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Mentoring relationships can help you navigate career challenges, expand your network, and gain valuable insights from experienced alumni.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      document.querySelector<HTMLElement>('[data-value="find"]')?.click();
                    }}
                  >
                    Learn More
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="my">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Your Mentorship Relationships</h2>
            <p className="text-gray-600">Manage your ongoing mentorship connections and scheduled sessions.</p>
          </div>
          
          {myMentorships.length === 0 ? (
            <EmptyState
              title="No active mentorships"
              description="You don't have any active mentorship relationships yet."
              action={{
                label: "Find a Mentor",
                onClick: () => {
                  document.querySelector<HTMLElement>('[data-value="find"]')?.click();
                }
              }}
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {myMentorships.map(mentorship => (
                <Card key={mentorship.id} className="border border-gray-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 rounded-xl overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex gap-4 mb-4">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={mentorship.mentor.user.profileImage} />
                        <AvatarFallback className="bg-orange-100 text-orange-800 text-lg font-medium">
                          {mentorship.mentor.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold text-lg">{mentorship.mentor.user.name}</h4>
                        <p className="text-sm text-gray-600">{mentorship.mentor.user.title}</p>
                        <Badge className="mt-1 bg-green-100 text-green-800 hover:bg-green-100">
                          Active Mentorship
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Focus Areas:</h5>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {mentorship.topics.map((topic: string) => (
                          <Badge key={topic} variant="outline" className="text-xs">{topic}</Badge>
                        ))}
                      </div>
                      
                      <div className="text-sm text-gray-600 flex items-center mt-4">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>Next Session: {mentorship.nextSession ? new Date(mentorship.nextSession).toLocaleDateString() + ' at ' + new Date(mentorship.nextSession).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Not scheduled'}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-gray-50 px-6 py-3 flex justify-between gap-2 border-t">
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Send Message
                    </Button>
                    <Button variant="default" size="sm" className="bg-orange-500 hover:bg-orange-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      Schedule Session
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <BecomeMentorForm 
        isOpen={isMentorModalOpen}
        onClose={() => setIsMentorModalOpen(false)}
        onSubmit={handleBecomeMentor}
      />
      
      {selectedMentor && (
        <RequestMentorshipModal 
          isOpen={isRequestModalOpen}
          onClose={() => setIsRequestModalOpen(false)}
          mentor={selectedMentor}
          onSubmit={handleRequestMentorship}
        />
      )}
    </div>
  );
}

export default MentorshipPage;
