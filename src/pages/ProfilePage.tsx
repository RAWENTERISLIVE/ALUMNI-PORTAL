import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { LinkedInImporter } from "@/components/profile/LinkedInImporter";
import { SkillsManager } from "@/components/profile/SkillsManager";
import { InterestsManager } from "@/components/profile/InterestsManager";
import { PrivacySettingsManager } from "@/components/profile/PrivacySettingsManager";
import apiService from "@/services/apiService";
import { EmptyState } from "@/components/common/EmptyState";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { User, Briefcase, MapPin, GraduationCap, Mail, Phone, Globe, Linkedin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const profileSchema = z.object({
  name: z.string().min(2, { message: "Name is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  bio: z.string().optional(),
  headline: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  linkedin: z.string().optional(),
  twitter: z.string().optional(),
  github: z.string().optional(),
  availableAsMentor: z.boolean().optional(),
});

export default function ProfilePage() {
  const { id } = useParams<{ id?: string }>();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isLinkedInModalOpen, setIsLinkedInModalOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  
  // Add states for experience, education and skills forms
  const [isExperienceModalOpen, setIsExperienceModalOpen] = useState(false);
  const [isEducationModalOpen, setIsEducationModalOpen] = useState(false);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const [currentExperience, setCurrentExperience] = useState<any>(null);
  const [currentEducation, setCurrentEducation] = useState<any>(null);
  const [newSkill, setNewSkill] = useState("");
  const [experiences, setExperiences] = useState<any[]>([
    {
      id: '1',
      title: 'Senior Software Engineer',
      company: 'TechCorp Inc.',
      startDate: 'Jan 2023',
      endDate: 'Present',
      location: 'San Francisco, CA',
      description: 'Led the development of a full-stack application using React, Node.js, and MongoDB, resulting in a 40% improvement in user engagement.'
    },
    {
      id: '2',
      title: 'Software Developer',
      company: 'WebSolutions LLC',
      startDate: 'Aug 2020',
      endDate: 'Dec 2022',
      location: 'Remote',
      description: 'Developed and maintained multiple client-facing web applications using modern JavaScript frameworks.'
    }
  ]);
  const [educations, setEducations] = useState<any[]>([
    {
      id: '1',
      degree: 'Master of Science in Computer Science',
      institution: 'Stanford University',
      startYear: '2018',
      endYear: '2020',
      location: 'Stanford, CA',
      description: 'Specialized in Artificial Intelligence and Machine Learning.'
    }
  ]);
  const [skills, setSkills] = useState<string[]>([
    'React', 'JavaScript', 'Node.js', 'TypeScript', 'MongoDB', 'SQL', 'GraphQL', 'REST APIs'
  ]);
  const [interests, setInterests] = useState<string[]>([
    'Artificial Intelligence', 'Machine Learning', 'Web Development'
  ]);
  
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      bio: "",
      headline: "",
      company: "",
      position: "",
      location: "",
      website: "",
      linkedin: "",
      twitter: "",
      github: "",
      availableAsMentor: false,
    },
  });
  
  // Fetch user profile either by ID or current user
  useEffect(() => {
    const fetchProfile = async () => {
      // If an ID is provided and it's not the current user's ID, fetch that profile
      if (id && (!currentUser || id !== currentUser.id)) {
        setIsLoading(true);
        setIsError(false);
        
        try {
          console.log('Fetching profile for user ID:', id);
          const response = await apiService.getUserById(id);
          console.log('Profile response:', response);
          
          if (response.success && response.user) {
            // Ensure id property exists alongside _id for consistency
            const userData = response.user;
            if (userData._id && !userData.id) {
              userData.id = userData._id;
            }
            setProfile(userData);
            setIsOwnProfile(false);
          } else {
            setIsError(true);
            toast({
              title: "Profile not found",
              description: "We couldn't find the requested profile.",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
          setIsError(true);
          toast({
            title: "Error",
            description: "Failed to load profile. Please try again later.",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        // If no ID provided, or ID matches current user, show current user's profile
        if (currentUser) {
          // Ensure id property exists for consistency
          const userData = {...currentUser};
          if (currentUser.id && !userData.id) {
            userData.id = currentUser.id;
          }
          setProfile(userData);
          setIsOwnProfile(true);
          setIsLoading(false);
          setIsError(false);
        } else {
          // If no current user (not logged in), redirect to login
          navigate('/login', { state: { returnUrl: `/directory/profile/${id}` } });
        }
      }
    };
    
    fetchProfile();
  }, [id, currentUser, toast, navigate]);
  
  // Update form values when profile changes
  useEffect(() => {
    if (profile) {
      // Update form values with profile data
      form.reset({
        name: profile.name || "",
        email: profile.email || "",
        bio: profile.bio || "",
        headline: profile.headline || "",
        company: profile.company || "",
        position: profile.jobTitle || "",
        location: profile.location || profile.city || "",
        website: profile.website || "",
        linkedin: profile.linkedInProfile || "",
        twitter: profile.twitterHandle || "",
        github: profile.githubHandle || "",
        availableAsMentor: profile.isAvailableAsMentor || false,
      });
    }
  }, [profile, form]);
  
  const handleImportLinkedInData = (data: any) => {
    form.setValue("headline", data.headline || form.getValues().headline);
    form.setValue("company", data.company || form.getValues().company);
    form.setValue("position", data.position || form.getValues().position);
    form.setValue("bio", data.bio || form.getValues().bio);
    form.setValue("website", data.website || form.getValues().website);
    form.setValue("linkedin", data.linkedin || form.getValues().linkedin);
    form.setValue("twitter", data.twitter || form.getValues().twitter);
    form.setValue("github", data.github || form.getValues().github);
  };
  
  const handleClearFilters = () => {
    setIsOwnProfile(true);
  };

  // Handle experience functions
  const handleAddExperience = () => {
    setCurrentExperience(null);
    setIsExperienceModalOpen(true);
  };

  const handleEditExperience = (experience: any) => {
    setCurrentExperience(experience);
    setIsExperienceModalOpen(true);
  };

  const handleDeleteExperience = (id: string) => {
    setExperiences(experiences.filter(exp => exp.id !== id));
    toast({
      title: "Experience deleted",
      description: "Your experience has been removed successfully."
    });
  };

  const handleSaveExperience = (experienceData: any) => {
    if (currentExperience) {
      // Edit existing experience
      setExperiences(experiences.map(exp => 
        exp.id === currentExperience.id ? { ...experienceData, id: exp.id } : exp
      ));
    } else {
      // Add new experience
      setExperiences([
        { ...experienceData, id: Date.now().toString() }, 
        ...experiences
      ]);
    }
    setIsExperienceModalOpen(false);
    toast({
      title: currentExperience ? "Experience updated" : "Experience added",
      description: "Your experience has been updated successfully."
    });
  };
  
  // Handle education functions
  const handleAddEducation = () => {
    setCurrentEducation(null);
    setIsEducationModalOpen(true);
  };

  const handleEditEducation = (education: any) => {
    setCurrentEducation(education);
    setIsEducationModalOpen(true);
  };

  const handleDeleteEducation = (id: string) => {
    setEducations(educations.filter(edu => edu.id !== id));
    toast({
      title: "Education deleted",
      description: "Your education record has been removed successfully."
    });
  };

  const handleSaveEducation = (educationData: any) => {
    if (currentEducation) {
      // Edit existing education
      setEducations(educations.map(edu => 
        edu.id === currentEducation.id ? { ...educationData, id: edu.id } : edu
      ));
    } else {
      // Add new education
      setEducations([
        { ...educationData, id: Date.now().toString() }, 
        ...educations
      ]);
    }
    setIsEducationModalOpen(false);
    toast({
      title: currentEducation ? "Education updated" : "Education added",
      description: "Your education has been updated successfully."
    });
  };

  // Handle skills and interests
  const handleAddSkill = () => {
    if (newSkill && !skills.includes(newSkill)) {
      setSkills([...skills, newSkill]);
      setNewSkill("");
      toast({
        title: "Skill added",
        description: `"${newSkill}" has been added to your skills.`
      });
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleAddInterest = (interest: string) => {
    if (!interests.includes(interest)) {
      setInterests([...interests, interest]);
    }
  };

  const handleRemoveInterest = (interestToRemove: string) => {
    setInterests(interests.filter(interest => interest !== interestToRemove));
  };
  
  if (isLoading && !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (isError || !profile) {
    return (
      <div>
        <PageHeader 
          title="Profile Not Found"
          description="We couldn't find the requested alumni profile"
        />
        <EmptyState 
          icon={<User className="h-12 w-12 text-muted-foreground" />}
          title="Profile not found"
          description="The requested profile could not be found or you don't have permission to view it."
          action={{
            label: "Back to Directory",
            onClick: () => navigate('/directory')
          }}
        />
      </div>
    );
  }
  
  return (
    <div>
      <PageHeader 
        title={isOwnProfile ? "My Profile" : `${profile?.name || "Alumni"}'s Profile`}
        description={isOwnProfile ? "Manage your profile information visible to other alumni" : "View alumni profile information"}
      />
      
      <Card className="mb-8 border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex flex-col items-center">
              <Avatar className="h-32 w-32 mb-2 ring-4 ring-orange-100">
                <AvatarImage src={profile.profileImage || undefined} alt={profile.name} />
                <AvatarFallback className="text-3xl font-medium bg-orange-100 text-orange-800">
                  {profile.firstName?.[0] || profile.name?.charAt(0)}
                  {profile.lastName?.[0] || profile.name?.split(' ')?.[1]?.charAt(0) || ''}
                </AvatarFallback>
              </Avatar>
              
              {isOwnProfile && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="mt-2 border-orange-500 text-orange-500 hover:bg-orange-50 transition-colors"
                  onClick={() => toast({
                    description: "Profile image upload feature coming soon"
                  })}
                >
                  Change Photo
                </Button>
              )}
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold">{profile.name}</h2>
                <p className="text-muted-foreground">{profile.headline || profile.jobTitle}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {profile.company && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.jobTitle ? `${profile.jobTitle} at ${profile.company}` : profile.company}</span>
                  </div>
                )}
                
                {(profile.location || profile.city || profile.country) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.location || `${profile.city || ''} ${profile.country || ''}`.trim()}</span>
                  </div>
                )}
                
                {profile.graduationYear && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span>Class of {profile.graduationYear}</span>
                  </div>
                )}
                
                {profile.email && !isOwnProfile && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.email}</span>
                  </div>
                )}
                
                {profile.contactPhone && !isOwnProfile && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.contactPhone}</span>
                  </div>
                )}
                
                {profile.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{profile.website}</a>
                  </div>
                )}
                
                {profile.linkedInProfile && (
                  <div className="flex items-center gap-2">
                    <Linkedin className="h-4 w-4 text-muted-foreground" />
                    <a href={profile.linkedInProfile} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">LinkedIn Profile</a>
                  </div>
                )}
              </div>
              
              {profile.bio && (
                <div className="mt-4">
                  <h3 className="font-medium mb-1">About</h3>
                  <p className="text-sm">{profile.bio}</p>
                </div>
              )}
              
              {!isOwnProfile && (
                <div className="flex gap-2 mt-4">
                  <Button>Connect</Button>
                  {profile.isAvailableAsMentor && (
                    <Button variant="outline">Request Mentorship</Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isOwnProfile && (
        <div>
          <Tabs defaultValue="profile" className="mt-6">
            <TabsList className="bg-gray-50 p-1 rounded-lg w-full">
              <TabsTrigger 
                value="profile"
                className="flex-1 data-[state=active]:bg-orange-500 data-[state=active]:text-white hover:text-orange-500"
              >
                Edit Profile
              </TabsTrigger>
              <TabsTrigger 
                value="experiences"
                className="flex-1 data-[state=active]:bg-orange-500 data-[state=active]:text-white hover:text-orange-500"
              >
                Experience
              </TabsTrigger>
              <TabsTrigger 
                value="education"
                className="flex-1 data-[state=active]:bg-orange-500 data-[state=active]:text-white hover:text-orange-500"
              >
                Education
              </TabsTrigger>
              <TabsTrigger 
                value="skills"
                className="flex-1 data-[state=active]:bg-orange-500 data-[state=active]:text-white hover:text-orange-500"
              >
                Skills & Interests
              </TabsTrigger>
              <TabsTrigger 
                value="privacy"
                className="flex-1 data-[state=active]:bg-orange-500 data-[state=active]:text-white hover:text-orange-500"
              >
                Privacy
              </TabsTrigger>
            </TabsList>
            <TabsContent value="profile" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-end mb-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsLinkedInModalOpen(true)}
                    >
                      Import from LinkedIn
                    </Button>
                  </div>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => {
                      if (isOwnProfile && profile) {
                        apiService.updateUserProfile(profile.id || profile._id, data)
                          .then(() => {
                            toast({
                              title: "Profile updated",
                              description: "Your profile has been updated successfully."
                            });
                          })
                          .catch((error) => {
                            toast({
                              title: "Update failed",
                              description: error.message || "Failed to update profile",
                              variant: "destructive"
                            });
                          });
                      }
                    })} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={!isOwnProfile} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input {...field} disabled />
                              </FormControl>
                              <FormDescription>
                                Your email is used for login and cannot be changed here.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="headline"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Headline</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={!isOwnProfile} />
                              </FormControl>
                              <FormDescription>
                                A brief description of your professional identity.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={!isOwnProfile} />
                              </FormControl>
                              <FormDescription>
                                City, State, Country
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="company"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={!isOwnProfile} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="position"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Position</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={!isOwnProfile} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                disabled={!isOwnProfile}
                                className="min-h-[120px]" 
                              />
                            </FormControl>
                            <FormDescription>
                              Tell others about yourself and your professional journey.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="linkedin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>LinkedIn URL</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={!isOwnProfile} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Personal Website</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={!isOwnProfile} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {isOwnProfile && (
                        <div className="flex justify-end">
                          <Button 
                            type="submit"
                            className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-4 py-2 transform hover:scale-105 hover:shadow-lg transition-all duration-300"
                          >
                            Save Changes
                          </Button>
                        </div>
                      )}
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="experiences" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium">Work Experience</h3>
                    {isOwnProfile && (
                      <Button 
                        className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg transform hover:scale-105 hover:shadow-lg transition-all duration-300"
                        onClick={handleAddExperience}
                      >
                        + Add Experience
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-6">
                    {experiences.map((experience) => (
                      <div key={experience.id} className="border-b pb-4">
                        <div className="flex justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{experience.title}</h4>
                            <p className="text-orange-600">{experience.company}</p>
                            <p className="text-sm text-gray-500">{experience.startDate} - {experience.endDate} · {experience.location}</p>
                            <p className="mt-2 text-gray-700">{experience.description}</p>
                          </div>
                          {isOwnProfile && (
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditExperience(experience)}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-500"
                                onClick={() => handleDeleteExperience(experience.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="education" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium">Education</h3>
                    {isOwnProfile && (
                      <Button
                        className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg transform hover:scale-105 hover:shadow-lg transition-all duration-300"
                        onClick={() => {
                          setCurrentEducation(null);
                          setIsEducationModalOpen(true);
                        }}
                      >
                        + Add Education
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-6">
                    {educations.map((education) => (
                      <div key={education.id} className="border-b pb-4">
                        <div className="flex justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{education.degree}</h4>
                            <p className="text-orange-600">{education.institution}</p>
                            <p className="text-sm text-gray-500">{education.startYear} - {education.endYear}</p>
                            <p className="mt-2 text-gray-700">{education.description}</p>
                          </div>
                          {isOwnProfile && (
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setCurrentEducation(education);
                                  setIsEducationModalOpen(true);
                                }}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-500"
                                onClick={() => {
                                  setEducations(educations.filter(edu => edu.id !== education.id));
                                  toast({
                                    title: "Education deleted",
                                    description: "The education record has been removed from your profile.",
                                    variant: "destructive"
                                  });
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="skills" className="mt-4">
              <div className="space-y-6">
                <SkillsManager
                  userId={profile?._id || profile?.id || ''}
                  initialSkills={profile?.skills || []}
                  isOwnProfile={isOwnProfile}
                  onSkillsUpdate={(skills) => {
                    setProfile(prev => ({ ...prev, skills }));
                  }}
                />
                
                <InterestsManager
                  userId={profile?._id || profile?.id || ''}
                  initialInterests={profile?.interests || []}
                  isOwnProfile={isOwnProfile}
                  onInterestsUpdate={(interests) => {
                    setProfile(prev => ({ ...prev, interests }));
                  }}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="privacy" className="mt-4">
              <PrivacySettingsManager
                userId={profile?._id || profile?.id || ''}
                initialSettings={profile?.privacySettings || {}}
                isOwnProfile={isOwnProfile}
                onSettingsUpdate={(privacySettings) => {
                  setProfile(prev => ({ ...prev, privacySettings }));
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
      
      {isOwnProfile && isLinkedInModalOpen && (
        <LinkedInImporter 
          isOpen={isLinkedInModalOpen}
          onClose={() => setIsLinkedInModalOpen(false)}
          onImport={handleImportLinkedInData}
        />
      )}
      
      {/* Experience Modal */}
      <Dialog open={isExperienceModalOpen} onOpenChange={setIsExperienceModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{currentExperience ? "Edit Experience" : "Add New Experience"}</DialogTitle>
            <DialogDescription>
              {currentExperience 
                ? "Update your work experience details below." 
                : "Add details about your work experience."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="title">Job Title</Label>
                <Input 
                  id="title" 
                  defaultValue={currentExperience?.title || ""} 
                  className="mt-2"
                  placeholder="e.g. Software Engineer"
                />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input 
                  id="company" 
                  defaultValue={currentExperience?.company || ""} 
                  className="mt-2"
                  placeholder="e.g. Tech Company Inc."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input 
                  id="startDate" 
                  defaultValue={currentExperience?.startDate || ""} 
                  className="mt-2"
                  placeholder="e.g. Jan 2020"
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input 
                  id="endDate" 
                  defaultValue={currentExperience?.endDate || ""} 
                  className="mt-2"
                  placeholder="e.g. Present or Dec 2022"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input 
                id="location" 
                defaultValue={currentExperience?.location || ""} 
                className="mt-2"
                placeholder="e.g. San Francisco, CA"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                defaultValue={currentExperience?.description || ""} 
                className="mt-2"
                placeholder="Describe your responsibilities and achievements"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExperienceModalOpen(false)}>Cancel</Button>
            <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => {
              const experienceData = {
                title: (document.getElementById('title') as HTMLInputElement).value,
                company: (document.getElementById('company') as HTMLInputElement).value,
                startDate: (document.getElementById('startDate') as HTMLInputElement).value,
                endDate: (document.getElementById('endDate') as HTMLInputElement).value,
                location: (document.getElementById('location') as HTMLInputElement).value,
                description: (document.getElementById('description') as HTMLTextAreaElement).value,
              };
              handleSaveExperience(experienceData);
            }}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Education Modal */}
      <Dialog open={isEducationModalOpen} onOpenChange={setIsEducationModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{currentEducation ? "Edit Education" : "Add New Education"}</DialogTitle>
            <DialogDescription>
              {currentEducation 
                ? "Update your education details below." 
                : "Add details about your education."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="degree">Degree / Certificate</Label>
              <Input 
                id="degree" 
                defaultValue={currentEducation?.degree || ""} 
                className="mt-2"
                placeholder="e.g. Bachelor of Science in Computer Science"
              />
            </div>
            <div>
              <Label htmlFor="institution">Institution</Label>
              <Input 
                id="institution" 
                defaultValue={currentEducation?.institution || ""} 
                className="mt-2"
                placeholder="e.g. Stanford University"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startYear">Start Year</Label>
                <Input 
                  id="startYear" 
                  defaultValue={currentEducation?.startYear || ""} 
                  className="mt-2"
                  placeholder="e.g. 2018"
                />
              </div>
              <div>
                <Label htmlFor="endYear">End Year</Label>
                <Input 
                  id="endYear" 
                  defaultValue={currentEducation?.endYear || ""} 
                  className="mt-2"
                  placeholder="e.g. 2022 or Present"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="eduLocation">Location</Label>
              <Input 
                id="eduLocation" 
                defaultValue={currentEducation?.location || ""} 
                className="mt-2"
                placeholder="e.g. Stanford, CA"
              />
            </div>
            <div>
              <Label htmlFor="eduDescription">Description</Label>
              <Textarea 
                id="eduDescription" 
                defaultValue={currentEducation?.description || ""} 
                className="mt-2"
                placeholder="Additional details about your studies"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEducationModalOpen(false)}>Cancel</Button>
            <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => {
              const educationData = {
                degree: (document.getElementById('degree') as HTMLInputElement).value,
                institution: (document.getElementById('institution') as HTMLInputElement).value,
                startYear: (document.getElementById('startYear') as HTMLInputElement).value,
                endYear: (document.getElementById('endYear') as HTMLInputElement).value,
                location: (document.getElementById('eduLocation') as HTMLInputElement).value,
                description: (document.getElementById('eduDescription') as HTMLTextAreaElement).value,
              };
              handleSaveEducation(educationData);
            }}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skills Modal */}
      {isOwnProfile && isSkillsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-medium mb-4">
              {newSkill ? "Add New Skill" : "Manage Skills"}
            </h3>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (newSkill) {
                  // Add new skill
                  setSkills([...skills, newSkill]);
                  setNewSkill("");
                  toast({
                    title: "Skill added",
                    description: `"${newSkill}" has been added to your skills.`
                  });
                }
              }} 
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">Skill</label>
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                  placeholder="e.g. Python"
                  required
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setIsSkillsModalOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-4 py-2 transform hover:scale-105 hover:shadow-lg transition-all duration-300 w-full sm:w-auto"
                >
                  Add Skill
                </Button>
              </div>
            </form>
            
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Existing Skills</h4>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge key={skill} className="bg-orange-100 text-orange-800 hover:bg-orange-200 px-3 py-1 rounded-lg">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
            
            <button
              onClick={() => setIsSkillsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
