import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Briefcase, GraduationCap, MessageSquare, User } from "lucide-react";
import { RequestMentorshipModal } from "@/components/mentorship/RequestMentorshipModal";
import { BecomeMentorForm } from "@/components/mentorship/BecomeMentorForm";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/services/apiService";
import { useAuth } from "@/contexts/AuthContext";

export default function MentorshipPage() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("all");
  const [selectedMentor, setSelectedMentor] = useState<any>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isMentorFormOpen, setIsMentorFormOpen] = useState(false);
  const [isUserMentor, setIsUserMentor] = useState(false);
  const [activeMentorships, setActiveMentorships] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMentorshipData();
  }, []);

  const loadMentorshipData = async () => {
    try {
      setLoading(true);
      const [mentorsResponse, userMentorshipResponse] = await Promise.all([
        apiService.getMentors(),
        apiService.getMentorshipProfile()
      ]);
      
      if (mentorsResponse.success) {
        setMentors(mentorsResponse.data || []);
      }

      if (userMentorshipResponse.success && userMentorshipResponse.data) {
        setIsUserMentor(userMentorshipResponse.data.isMentor);
      }

      // TODO: Load active mentorships
      setActiveMentorships([]);
    } catch (error) {
      console.error('Error loading mentorship data:', error);
      toast({ title: "Error", description: "Failed to load mentorship data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  
  // Filter mentors based on search query and industry filter
  const filteredMentors = mentors.filter(mentor => {
    const user = mentor.userId;
    const matchesSearch = 
      (user.firstName && `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (mentor.position && mentor.position.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (mentor.company && mentor.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (mentor.expertise && mentor.expertise.some((skill: string) => skill.toLowerCase().includes(searchQuery.toLowerCase())));
    
    const matchesIndustry = filterIndustry === "all" || (mentor.industry && mentor.industry.toLowerCase() === filterIndustry.toLowerCase());
    
    return matchesSearch && matchesIndustry;
  });

  const handleRequestMentorship = async (mentor: any) => {
    try {
      await apiService.requestMentorship(mentor.userId._id);
      toast({ title: "Request Sent", description: `Your mentorship request to ${mentor.userId.firstName} ${mentor.userId.lastName} has been sent.` });
      setIsRequestModalOpen(false);
    } catch (error) {
      console.error('Error requesting mentorship:', error);
      toast({ title: "Error", description: "Failed to send mentorship request.", variant: "destructive" });
    }
  };

  const handleBecomeMentor = async (data: any) => {
    try {
      const response = await apiService.becomeMentor(data);
      if (response.success) {
        toast({ title: "Success", description: "You are now listed as a mentor!" });
        setIsMentorFormOpen(false);
        loadMentorshipData();
      } else {
        throw new Error(response.message || "Failed to become a mentor");
      }
    } catch (error) {
      console.error('Error becoming a mentor:', error);
      toast({ title: "Error", description: `Failed to become a mentor: ${error.message}`, variant: "destructive" });
    }
  };

  // This function will be triggered when a mentee accepts a mentorship request
  const handleAcceptMentorship = () => {
    // TODO: Replace with actual API call to accept mentorship request
    // const response = await apiService.acceptMentorshipRequest(requestId);
    
    toast({
      title: "Mentorship Request Accepted",
      description: "You are now connected with your new mentee.",
    });
  };
  
  // Fix the handleFindMentor function to use a proper DOM method
  const handleFindMentor = () => {
    setSearchQuery("");
    setFilterIndustry("all");
  };

  if (loading) {
    return (
      <div>
        <PageHeader 
          title="Mentorship Hub" 
          description="Connect with alumni mentors for guidance and advice"
        />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Mentorship Hub" 
        description="Connect with alumni mentors and accelerate your career growth"
        action={
          !isUserMentor && (
            <Button onClick={() => setIsMentorFormOpen(true)} className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Become a Mentor
            </Button>
          )
        }
      />
      
      <Tabs defaultValue="find-mentor" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="find-mentor" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Find Mentors
          </TabsTrigger>
          <TabsTrigger value="become-mentor" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Become a Mentor
          </TabsTrigger>
          <TabsTrigger value="my-mentorships" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            My Connections
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="find-mentor">
          {/* Search and filters */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name, skills, company..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-1/2">
                <Select value={filterIndustry} onValueChange={setFilterIndustry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full sm:w-1/2"
                onClick={() => {
                  setSearchQuery("");
                  setFilterIndustry("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
          
          {/* Mentors list */}
          {mentors.length === 0 ? (
            <EmptyState
              title="No mentors available"
              description="Check back later for available mentors or become a mentor yourself!"
              action={{
                label: "Become a Mentor",
                onClick: () => {
                  const becomeMentorTab = document.querySelector('[value="become-mentor"]') as HTMLElement;
                  becomeMentorTab?.click();
                }
              }}
            />
          ) : filteredMentors.length === 0 ? (
            <EmptyState
              title="No mentors found"
              description="Try adjusting your search criteria or clear filters to see all mentors."
              action={{
                label: "Clear Filters",
                onClick: handleFindMentor
              }}
            />
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredMentors.map(mentor => (
                <MentorCard 
                  key={mentor.id} 
                  mentor={mentor} 
                  onRequestMentorship={() => handleRequestMentorship(mentor)}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="become-mentor">
          {isUserMentor ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <GraduationCap className="h-16 w-16 mx-auto text-alumni-primary mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Thank You for Being a Mentor!</h3>
                  <p className="text-muted-foreground">
                    Your profile is now visible to potential mentees. You'll be notified when someone requests your mentorship.
                  </p>
                </div>
                
                <div className="mt-8 grid md:grid-cols-2 gap-6">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Tips for Great Mentoring</h4>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-alumni-primary font-bold">•</span>
                        <span>Schedule regular check-ins with your mentees</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-alumni-primary font-bold">•</span>
                        <span>Set clear expectations about your availability</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-alumni-primary font-bold">•</span>
                        <span>Listen actively and ask thoughtful questions</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Pending Requests</h4>
                    
                    {false ? (
                      <div>
                        {/* Pending request UI that would appear when there are requests */}
                        <div className="border-b pb-2 mb-2">
                          <div className="flex justify-between">
                            <span className="font-medium">Chris Thompson</span>
                            <span className="text-xs text-muted-foreground">2 hours ago</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">Topic: Career Transition to Tech</p>
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline">Decline</Button>
                            <Button size="sm" onClick={handleAcceptMentorship}>Accept</Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        No pending mentorship requests
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <GraduationCap className="h-16 w-16 mx-auto text-alumni-primary mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Share Your Expertise</h3>
                  <p className="text-muted-foreground">
                    Help guide the next generation of alumni by becoming a mentor.
                    Mentors typically spend 1-4 hours per month connecting with mentees.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6 my-8">
                  <div className="text-center">
                    <div className="rounded-full bg-muted h-12 w-12 flex items-center justify-center mx-auto mb-3">
                      <span className="font-bold">1</span>
                    </div>
                    <h4 className="font-medium mb-1">Create Your Profile</h4>
                    <p className="text-sm text-muted-foreground">
                      Set your expertise areas and availability
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="rounded-full bg-muted h-12 w-12 flex items-center justify-center mx-auto mb-3">
                      <span className="font-bold">2</span>
                    </div>
                    <h4 className="font-medium mb-1">Connect with Mentees</h4>
                    <p className="text-sm text-muted-foreground">
                      Review and accept mentorship requests
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="rounded-full bg-muted h-12 w-12 flex items-center justify-center mx-auto mb-3">
                      <span className="font-bold">3</span>
                    </div>
                    <h4 className="font-medium mb-1">Share Knowledge</h4>
                    <p className="text-sm text-muted-foreground">
                      Schedule meetings and provide guidance
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <Button size="lg" className="px-8" onClick={() => setIsMentorFormOpen(true)}>Become a Mentor</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="my-mentorships">
          {activeMentorships.length > 0 ? (
            <div className="space-y-4">
              {activeMentorships.map(mentorship => (
                <Card key={mentorship.id} className="card-hover">
                  <CardContent className="p-5">
                    <div className="flex gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={mentorship.mentee.avatar} />
                        <AvatarFallback>{mentorship.mentee.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className="font-medium">{mentorship.mentee.name}</h3>
                          <div className="text-xs bg-muted rounded-full px-2 py-1 flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" />
                            <span>Class of {mentorship.mentee.graduationYear}</span>
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <p className="text-sm">
                            <span className="font-medium">Topic:</span> {mentorship.topic}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            <span className="font-medium">Started:</span> {mentorship.startDate}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="px-5 py-3 border-t">
                    <div className="flex justify-between items-center w-full">
                      <span className="text-sm text-muted-foreground">Next meeting: {mentorship.nextMeeting}</span>
                      <Button variant="outline" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>Message</span>
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <h4 className="text-xl font-medium">No active mentorships</h4>
              <p className="text-muted-foreground mb-4">Connect with a mentor to get started</p>
              <Button onClick={handleFindMentor}>Find a Mentor</Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Request mentorship modal */}
      {selectedMentor && (
        <RequestMentorshipModal
          mentor={selectedMentor}
          isOpen={isRequestModalOpen}
          onClose={() => setIsRequestModalOpen(false)}
        />
      )}
      
      {/* Become a mentor form */}
      <BecomeMentorForm
        isOpen={isMentorFormOpen}
        onClose={() => setIsMentorFormOpen(false)}
        onSubmit={handleBecomeMentor}
      />
    </div>
  );
}

function MentorCard({ mentor, onRequestMentorship }: { mentor: any; onRequestMentorship: () => void }) {
  return (
    <Card className="card-hover">
      <CardContent className="p-5">
        <div className="flex gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={mentor.avatar} alt={mentor.name} />
            <AvatarFallback>{mentor.name.charAt(0)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h3 className="font-medium text-lg">{mentor.name}</h3>
              <div className="text-xs bg-muted rounded-full px-2 py-1 flex items-center gap-1">
                <GraduationCap className="h-3 w-3" />
                <span>Class of {mentor.graduationYear}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Briefcase className="h-3 w-3" />
              <span>{mentor.role} at {mentor.company}</span>
            </div>
            
            <div className="mt-3">
              <p className="text-sm mb-2">{mentor.bio}</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {mentor.expertise.map((skill: string, index: number) => (
                  <span 
                    key={index} 
                    className="bg-alumni-light text-alumni-dark text-xs px-2 py-1 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Availability:</span> {mentor.availability}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-5 py-3 border-t bg-muted/10">
        <Button className="w-full" onClick={onRequestMentorship}>Request Mentorship</Button>
      </CardFooter>
    </Card>
  );
}
