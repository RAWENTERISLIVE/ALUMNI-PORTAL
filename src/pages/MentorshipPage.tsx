import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { BecomeMentorForm } from "@/components/mentorship/BecomeMentorForm";
import { RequestMentorshipModal } from "@/components/mentorship/RequestMentorshipModal";
import { Search, Calendar, MessageSquare, GraduationCap, Briefcase, Star, Clock } from "lucide-react";
import apiService from "@/services/apiService";

// Mock data for mentors until we can fetch from API
const CATEGORIES = ["Career Guidance", "Industry Insights", "Technical Skills", "Entrepreneurship", "Leadership", "Graduate Studies"];
const YEARS_OF_EXPERIENCE = ["1-3 years", "3-5 years", "5-10 years", "10+ years"];

function MentorshipPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<string | null>(null);
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<any>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [myMentorships, setMyMentorships] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [assistDialogOpen, setAssistDialogOpen] = useState(false);
  const [assistTargetRequest, setAssistTargetRequest] = useState<any>(null);
  const [confirmationDraft, setConfirmationDraft] = useState("");
  const [proposedDay, setProposedDay] = useState("Monday");
  const [proposedStartTime, setProposedStartTime] = useState("18:00");
  const [proposedEndTime, setProposedEndTime] = useState("19:00");
  const [isMentor, setIsMentor] = useState(false);
  const [mentorProfile, setMentorProfile] = useState<any>(null);

  useEffect(() => {
    loadMentors();
    loadMyMentorships();
  }, []);

  const loadMentors = async () => {
    try {
      setLoading(true);
      const query: any = {};
      if (searchQuery) query.query = searchQuery;
      if (selectedCategory) query.expertise = selectedCategory;
      if (selectedExperience) query.experience = selectedExperience;
      
      const response = await apiService.getMentors(query);
      
      if (response.success) {
        setMentors(response.data || []);
      }
    } catch (error) {
      console.error("Error loading mentors:", error);
      toast({ description: "Failed to load mentors", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadMyMentorships = async () => {
    try {
      const response = await apiService.getMentorshipProfile();
      if (response.success && response.data) {
        setMyMentorships(response.data.requests || []);
        setIncomingRequests(response.data.incomingRequests || []);
        setIsMentor(!!response.data.isMentor);
        setMentorProfile(response.data.profile || null);
      }
    } catch (error) {
      console.error("Error loading mentorships:", error);
    }
  };

  const buildConfirmationDraft = (request: any) => {
    const menteeName = request?.mentee?.user?.name || "there";
    const topic = request?.topic || "your mentorship goals";
    const mode = request?.sessionMode || "chat";
    const preferredSlot = request?.preferredSlot
      ? `${request.preferredSlot.day} ${request.preferredSlot.startTime}-${request.preferredSlot.endTime}`
      : "a time that works for both of us";

    return `Hi ${menteeName}, happy to mentor you on ${topic}. I can do this on ${mode}. Let's start with ${preferredSlot}. Please confirm and we can begin.`;
  };

  const buildAlternativeSlotDraft = (
    request: any,
    day: string,
    startTime: string,
    endTime: string
  ) => {
    const menteeName = request?.mentee?.user?.name || "there";
    const topic = request?.topic || "your mentorship goals";
    const mode = request?.sessionMode || "chat";

    return `Hi ${menteeName}, happy to mentor you on ${topic}. I can do this on ${mode}. The requested slot may be tight, but I can offer ${day} ${startTime}-${endTime}. If this works, we can start there.`;
  };

  const handleRespondMentorshipRequest = async (request: any, action: 'accept' | 'reject') => {
    try {
      const response = await apiService.respondMentorshipRequest(request.id, action);
      if (!response.success) {
        throw new Error(response.message || `Failed to ${action} request.`);
      }

      // If accepted, immediately update state to show active connection
      await loadMyMentorships();

      if (action === 'accept') {
        const draft = buildConfirmationDraft(request);
        setAssistTargetRequest(request);
        setConfirmationDraft(draft);
        setProposedDay(request?.preferred_slot?.day || 'Monday');
        setProposedStartTime(request?.preferred_slot?.startTime || '18:00');
        setProposedEndTime(request?.preferred_slot?.endTime || '19:00');
        setAssistDialogOpen(true);
        toast({ title: 'Request accepted', description: 'First-session message draft is ready.' });
      } else {
        toast({ title: 'Request rejected', description: 'The mentee has been notified.' });
      }
    } catch (error: any) {
      toast({ title: 'Action failed', description: error.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const handleCopyConfirmation = async () => {
    try {
      await navigator.clipboard.writeText(confirmationDraft);
      toast({ title: 'Copied', description: 'Confirmation message copied to clipboard.' });
    } catch {
      toast({ title: 'Copy failed', description: 'Please copy manually.', variant: 'destructive' });
    }
  };

  const handleSendConfirmationInChat = async () => {
    const menteeId = assistTargetRequest?.mentee?.user?.id;
    if (!menteeId) {
      toast({ title: 'Unable to send', description: 'Mentee id missing.', variant: 'destructive' });
      return;
    }

    const response = await apiService.sendDirectMessage(menteeId, confirmationDraft);
    if (!response.success) {
      toast({ title: 'Message not sent', description: response.message || 'Failed to send in chat.', variant: 'destructive' });
      return;
    }

    toast({ title: 'Sent', description: 'Confirmation message sent in one-to-one chat.' });
    setAssistDialogOpen(false);
    navigate(`/messages?user=${menteeId}`);
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm("Are you sure you want to cancel this mentorship request?")) return;
    try {
      const response = await apiService.respondMentorshipRequest(requestId, 'cancel');
      if (response.success) {
        toast({ title: "Request Cancelled", description: "Your mentorship request has been removed." });
        loadMyMentorships();
      } else {
        toast({ title: "Error", description: response.message || "Failed to cancel request.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error cancelling request:", error);
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    }
  };

  const handleScheduleSession = (mentorship: any) => {
    const targetUserId = mentorship.mentor?.user?.id || mentorship.mentee?.user?.id;
    if (!targetUserId) {
      toast({ title: 'Unable to schedule', description: 'User ID missing.', variant: 'destructive' });
      return;
    }
    
    navigate(`/messages?user=${targetUserId}`);
    toast({ description: "Redirecting to chat to coordinate your next session." });
  };

  const handleUseRequestedSlotDraft = () => {
    if (!assistTargetRequest) return;
    setConfirmationDraft(buildConfirmationDraft(assistTargetRequest));
    toast({ title: 'Draft updated', description: 'Using requested-slot confirmation template.' });
  };

  const handleUseAlternativeSlotDraft = () => {
    if (!assistTargetRequest) return;
    setConfirmationDraft(
      buildAlternativeSlotDraft(
        assistTargetRequest,
        proposedDay,
        proposedStartTime,
        proposedEndTime
      )
    );
    toast({ title: 'Draft updated', description: 'Using alternative-slot suggestion template.' });
  };

  const renderMentorSlotSummary = (mentor: any) => {
    if (!Array.isArray(mentor.availableSlots) || mentor.availableSlots.length === 0) {
      return null;
    }

    const slotText = mentor.availableSlots
      .slice(0, 2)
      .map((slot: any) => `${slot.day} ${slot.startTime}-${slot.endTime}`)
      .join(' • ');

    const hasMoreSlots = mentor.availableSlots.length > 2;

    return (
      <p>
        Slots: {slotText}
        {hasMoreSlots && ' • ...'}
      </p>
    );
  };

  const renderMentorResults = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-muted-foreground">Looking for mentors...</span>
        </div>
      );
    }

    if (filteredMentors.length === 0) {
      return (
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
      );
    }

    return (
      <div className="space-y-4">
        {filteredMentors.map(mentor => (
          <Card key={mentor.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-border rounded-xl">
            <CardContent className="p-6">
              <div className="md:flex md:justify-between">
                <div className="flex gap-4 mb-4 md:mb-0">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={mentor.user.profileImage} />
                    <AvatarFallback className="bg-primary/10 text-foreground/90 text-xl font-medium">
                      {mentor.user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-lg text-foreground truncate">{mentor.user.name}</h3>
                    <p className="text-muted-foreground truncate">{mentor.user.title}</p>
                    <div className="flex items-center text-sm text-muted-foreground/80 mt-1">
                      <GraduationCap className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">Class of {mentor.user.graduationYear}</span>
                    </div>
                    <div className="flex items-center mt-1">
                      <Star className="h-3 w-3 text-yellow-400 flex-shrink-0" />
                      <span className="text-sm font-medium ml-1">{mentor.rating}</span>
                      <span className="text-xs text-muted-foreground/80 ml-1 truncate">({mentor.reviewCount} reviews)</span>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <Button
                    className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white rounded-lg px-4 py-2 transform hover:scale-105 hover:shadow-lg transition-all duration-300 mt-2"
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
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2 md:line-clamp-none">{mentor.bio}</p>

                <div className="flex flex-wrap gap-2 mb-2">
                  {mentor.expertise.map((expertise: string) => (
                    <Badge key={expertise} variant="outline">{expertise}</Badge>
                  ))}
                </div>

                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Briefcase className="h-3 w-3 mr-1 text-muted-foreground" />
                    <span>{mentor.experience}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                    <span>{mentor.availability}</span>
                  </div>
                </div>

                <div className="mt-2 text-sm text-muted-foreground space-y-1">
                  <p>
                    Preferred mode: <span className="font-medium text-foreground/80">{mentor.sessionMode || 'chat'}</span>
                  </p>
                  {renderMentorSlotSummary(mentor)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const filteredMentors = mentors.filter(mentor => {
    const matchesQuery = !searchQuery || 
      mentor.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.user?.title?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = !selectedCategory || mentor.expertise?.includes(selectedCategory);
      
    const matchesExperience = !selectedExperience || mentor.experience === selectedExperience;
    
    return matchesQuery && matchesCategory && matchesExperience;
  });

  const handleBecomeMentor = async (data: any) => {
    try {
      const response = await apiService.becomeMentor(data);
      if (!response.success) {
        throw new Error(response.message || "Failed to become mentor");
      }
      
      toast({ 
        title: "Success", 
        description: "Your mentor profile has been created. It will be reviewed shortly." 
      });
      setIsMentorModalOpen(false);
      
      // Refresh the list
      loadMentors();
    } catch (error) {
      console.error("Error creating mentor profile:", error);
      toast({ description: "Failed to create mentor profile", variant: "destructive" });
    }
  };

  const handleRequestMentorship = async (data: any) => {
    try {
      const response = await apiService.requestMentorship(data.mentorId, data.message, data.topic, {
        sessionMode: data.sessionMode,
        selectedSlot: data.selectedSlot,
      });
      
      if (response.success) {
        toast({ 
          title: "Request Sent", 
          description: "Your mentorship request has been sent. You will be notified when they respond." 
        });
        setIsRequestModalOpen(false);
      } else {
        throw new Error(response.message || "Failed to send request");
      }
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to send mentorship request.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground/90">Alumni Mentorship Network</h1>
        <p className="text-md text-muted-foreground/80 mt-1">Connect with experienced alumni for career guidance and professional growth.</p>
      </div>
      
      <Tabs defaultValue="find" className="mb-6">
        <TabsList className="w-full bg-muted/30 mb-2 p-1 rounded-lg">
          <TabsTrigger 
            value="find" 
            className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-white hover:text-foreground"
          >
            Find a Mentor
          </TabsTrigger>
          <TabsTrigger 
            value="my" 
            className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-white hover:text-foreground"
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
              
              {renderMentorResults()}
            </div>
            
            <div className="lg:col-span-1">
              <Card className="mb-6 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-border rounded-xl">
                <CardContent className="p-6">
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg px-4 py-2 transform hover:scale-105 hover:shadow-lg transition-all duration-300"
                    onClick={() => setIsMentorModalOpen(true)}
                  >
                    {isMentor ? "Update Mentor Profile" : "Become a Mentor"}
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="font-medium text-lg mb-4">Filters</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-foreground/80 mb-1 block">Expertise</p>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map(cat => (
                          <Button
                            key={cat}
                            size="sm"
                            variant={selectedCategory === cat ? "default" : "outline"}
                            className={selectedCategory === cat 
                              ? "bg-primary hover:bg-primary/90 text-white" 
                              : "hover:bg-muted/50 text-foreground/80"}
                            onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                          >
                            {cat}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-foreground/80 mb-1 block">Experience Level</p>
                      <div className="flex flex-wrap gap-2">
                        {YEARS_OF_EXPERIENCE.map(exp => (
                          <Button
                            key={exp}
                            size="sm"
                            variant={selectedExperience === exp ? "default" : "outline"}
                            className={selectedExperience === exp ? "bg-primary" : ""}
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
                        className="w-full text-foreground hover:text-foreground/90"
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
                  <p className="text-sm text-muted-foreground mb-4">
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
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight mb-2">Mentorship Management</h2>
            <p className="text-muted-foreground">Manage your connections, tracking outgoing requests, and active sessions.</p>
          </div>
          
          {myMentorships.length === 0 && incomingRequests.length === 0 ? (
            <EmptyState
              title="No mentorship activity"
              description="You haven't sent or received any mentorship requests yet."
              action={{
                label: "Explore Mentors",
                onClick: () => {
                  const trigger = document.querySelector<HTMLElement>('[data-value="find"]');
                  if (trigger) trigger.click();
                }
              }}
            />
          ) : (
            <div className="space-y-10">
              {/* Incoming Requests Section (Mentor View) */}
              {incomingRequests.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-1 bg-primary rounded-full" />
                    <h3 className="text-lg font-semibold">Incoming Requests</h3>
                    <Badge variant="secondary" className="ml-2">{incomingRequests.length}</Badge>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {incomingRequests.map((request) => (
                      <Card key={request.id} className="border border-border/60 hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md rounded-xl overflow-hidden flex flex-col">
                        <CardContent className="p-5 space-y-4 flex-grow">
                          <div className="flex gap-4 items-start">
                            <Avatar className="h-12 w-12 border border-border/50">
                              <AvatarImage src={request.mentee?.user?.profileImage} />
                              <AvatarFallback>{request.mentee?.user?.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-bold truncate">{request.mentee?.user?.name}</p>
                              <p className="text-sm text-muted-foreground truncate">{request.mentee?.user?.title || 'Alumni'}</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {request.topic && (
                              <div className="flex items-center gap-2 text-sm">
                                <Star className="h-4 w-4 text-primary" />
                                <span className="font-medium truncate">{request.topic}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span>{request.sessionMode || 'Chat'} session</span>
                            </div>
                            {request.message && (
                              <div className="bg-muted/40 p-3 rounded-lg text-sm italic text-foreground/80 line-clamp-3 mt-2 border border-border/30">
                                "{request.message}"
                              </div>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter className="bg-muted/20 border-t flex justify-end gap-2 p-4 mt-auto">
                          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleRespondMentorshipRequest(request, 'reject')}>Reject</Button>
                          <Button size="sm" className="shadow-sm" onClick={() => handleRespondMentorshipRequest(request, 'accept')}>Accept Request</Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {/* Active Connections & Sent Requests Section (Mentee View) */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-1 bg-primary rounded-full" />
                  <h3 className="text-lg font-semibold">My Mentorships & Requests</h3>
                </div>
                
                {myMentorships.length === 0 ? (
                  <div className="bg-muted/30 border-2 border-dashed rounded-2xl p-8 text-center">
                    <p className="text-muted-foreground">No active sessions or sent requests found.</p>
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {myMentorships.map(mentorship => (
                      <Card key={mentorship.id} className="border border-border/60 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 rounded-2xl overflow-hidden flex flex-col h-full">
                        <CardContent className="p-6 flex-grow">
                          <div className="flex gap-4 mb-5">
                            <Avatar className="h-14 w-14 ring-2 ring-primary/10">
                              <AvatarImage src={mentorship.mentor?.user?.profileImage} />
                              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                                {mentorship.mentor?.user?.name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <h4 className="font-bold text-lg leading-tight truncate">{mentorship.mentor?.user?.name}</h4>
                              <p className="text-sm text-muted-foreground truncate mb-2">{mentorship.mentor?.experience || 'Expert Mentor'}</p>
                              <Badge className={`shadow-none font-medium ${
                                mentorship.status === 'accepted' 
                                  ? 'bg-green-500/10 text-green-700 border-green-200 hover:bg-green-500/10' 
                                  : 'bg-orange-500/10 text-orange-700 border-orange-200 hover:bg-orange-500/10'
                              }`}>
                                {mentorship.status === 'accepted' ? 'Active' : 'Awaiting Approval'}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="p-3 bg-muted/30 rounded-xl border border-border/30">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Inquiry Focus</p>
                              <p className="text-sm font-medium text-foreground line-clamp-2">{mentorship.topic || 'General Guidance'}</p>
                            </div>
                            
                            {mentorship.status === 'accepted' && (
                              <div className="flex items-center gap-3 py-1">
                                <div className="flex-1 h-px bg-border/50" />
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">Ready to Connect</span>
                                <div className="flex-1 h-px bg-border/50" />
                              </div>
                            )}
                          </div>
                        </CardContent>
                        
                        <CardFooter className="bg-muted/10 border-t p-4 flex flex-wrap gap-2 justify-end mt-auto">
                          {mentorship.status === 'pending' ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors border-dashed"
                              onClick={() => handleCancelRequest(mentorship.id)}
                            >
                              Withdraw Request
                            </Button>
                          ) : (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="gap-2 border-primary/20 hover:border-primary/50 text-primary"
                                onClick={() => navigate(`/messages?user=${mentorship.mentor?.user?.id}`)}
                              >
                                <MessageSquare className="h-4 w-4" />
                                Chat
                              </Button>
                              <Button 
                                size="sm" 
                                className="gap-2 shadow-sm bg-primary hover:bg-primary/90"
                                onClick={() => handleScheduleSession(mentorship)}
                              >
                                <Calendar className="h-4 w-4" />
                                Meet
                              </Button>
                            </>
                          )}
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <BecomeMentorForm 
        isOpen={isMentorModalOpen}
        onClose={() => setIsMentorModalOpen(false)}
        onSubmit={handleBecomeMentor}
        initialData={mentorProfile}
      />
      
      {selectedMentor && (
        <RequestMentorshipModal 
          isOpen={isRequestModalOpen}
          onClose={() => setIsRequestModalOpen(false)}
          mentor={selectedMentor}
          onSubmit={handleRequestMentorship}
        />
      )}

      <Dialog open={assistDialogOpen} onOpenChange={setAssistDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>First Session Confirmation</DialogTitle>
            <DialogDescription>
              Pick a quick template and send a concise confirmation to align on the first mentorship session.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Request accepted. Send this as an ice-breaker to quickly align on first session.
            </p>
            <Textarea
              value={confirmationDraft}
              onChange={(e) => setConfirmationDraft(e.target.value)}
              className="min-h-[140px]"
            />
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleUseRequestedSlotDraft}>Use Confirm Requested Slot</Button>
              <Button variant="outline" onClick={handleUseAlternativeSlotDraft}>Use Alternative Slot</Button>
            </div>
            <div className="border rounded-md p-3 space-y-2">
              <p className="text-sm font-medium">Propose alternative slot</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={proposedDay}
                  onChange={(e) => setProposedDay(e.target.value)}
                >
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </select>
                <Input type="time" value={proposedStartTime} onChange={(e) => setProposedStartTime(e.target.value)} />
                <Input type="time" value={proposedEndTime} onChange={(e) => setProposedEndTime(e.target.value)} />
              </div>
              <p className="text-xs text-muted-foreground">
                Set a different day/time, then click <span className="font-medium">Use Alternative Slot</span> to regenerate the draft.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCopyConfirmation}>Copy</Button>
              <Button variant="outline" onClick={() => setAssistDialogOpen(false)}>Close</Button>
              <Button className="bg-primary hover:bg-primary/90" onClick={handleSendConfirmationInChat}>Send in Chat</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MentorshipPage;
