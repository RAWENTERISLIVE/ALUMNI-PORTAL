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
import { User, Briefcase, MapPin, GraduationCap, Mail, Phone, Globe, LinkedinIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface ExperienceItem {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
}

interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  startYear: string;
  endYear: string;
  location: string;
  description: string;
}

const profileSchema = z.object({
  name: z.string().min(2, { message: "Name is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  bio: z.string().optional(),
  headline: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  location: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
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
  const [currentExperience, setCurrentExperience] = useState<ExperienceItem | null>(null);
  const [currentEducation, setCurrentEducation] = useState<EducationItem | null>(null);
  const [newSkill, setNewSkill] = useState("");
  const [experiences, setExperiences] = useState<ExperienceItem[]>([]);
  const [educations, setEducations] = useState<EducationItem[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [experienceFormData, setExperienceFormData] = useState<Omit<ExperienceItem, 'id'>>({
    title: '',
    company: '',
    startDate: '',
    endDate: '',
    location: '',
    description: '',
  });
  const [educationFormData, setEducationFormData] = useState<Omit<EducationItem, 'id'>>({
    degree: '',
    institution: '',
    startYear: '',
    endYear: '',
    location: '',
    description: '',
  });
  
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      bio: "",
      headline: "",
      contactEmail: "",
      contactPhone: "",
      company: "",
      position: "",
      location: "",
      city: "",
      country: "",
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
          setIsLoading(true);
          setIsError(false);

          try {
            const meResponse = await apiService.getCurrentUser();
            const userData = meResponse.user || meResponse.data || currentUser;
            setProfile({
              ...userData,
              id: userData.id || userData._id || currentUser.id,
            });
            setIsOwnProfile(true);
          } catch (error) {
            const fallbackUser = { ...currentUser, id: currentUser.id };
            setProfile(fallbackUser);
            setIsOwnProfile(true);
          } finally {
            setIsLoading(false);
            setIsError(false);
          }
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
        contactEmail: profile.contactEmail || profile.email || "",
        contactPhone: profile.contactPhone || "",
        company: profile.company || "",
        position: profile.jobTitle || "",
        location: profile.location || profile.city || "",
        city: profile.city || "",
        country: profile.country || "",
        website: profile.website || "",
        linkedin: profile.linkedInProfile || "",
        twitter: profile.twitterHandle || "",
        github: profile.githubHandle || "",
        availableAsMentor: profile.isAvailableAsMentor || false,
      });

      const normalizedExperiences = Array.isArray(profile.experiences)
        ? profile.experiences
            .map((item: any) => ({
              id: String(item?.id || crypto.randomUUID()),
              title: item?.title || '',
              company: item?.company || '',
              startDate: item?.startDate || '',
              endDate: item?.endDate || '',
              location: item?.location || '',
              description: item?.description || '',
            }))
            .filter((item: ExperienceItem) => item.title || item.company)
        : [];

      const normalizedEducations = Array.isArray(profile.educations)
        ? profile.educations
            .map((item: any) => ({
              id: String(item?.id || crypto.randomUUID()),
              degree: item?.degree || '',
              institution: item?.institution || '',
              startYear: item?.startYear || '',
              endYear: item?.endYear || '',
              location: item?.location || '',
              description: item?.description || '',
            }))
            .filter((item: EducationItem) => item.degree || item.institution)
        : [];

      setExperiences(normalizedExperiences);
      setEducations(normalizedEducations);
      setSkills(Array.isArray(profile.skills) ? profile.skills.filter((value: unknown) => typeof value === 'string') : []);
      setInterests(Array.isArray(profile.interests) ? profile.interests.filter((value: unknown) => typeof value === 'string') : []);
    }
  }, [profile, form]);
  
  const saveProfileSections = async (
    nextExperiences: ExperienceItem[],
    nextEducations: EducationItem[],
    nextSkills: string[],
    nextInterests: string[]
  ) => {
    if (!isOwnProfile || !profile) return false;

    const response = await apiService.updateUserProfile(profile.id || profile._id, {
      experiences: nextExperiences,
      educations: nextEducations,
      skills: nextSkills,
      interests: nextInterests,
    });

    if (!response.success) {
      toast({
        title: 'Update failed',
        description: response.message || 'Could not save profile sections.',
        variant: 'destructive',
      });
      return false;
    }

    const updatedProfile = response.data || response.user;
    if (updatedProfile) {
      setProfile((previous: any) => ({
        ...previous,
        ...updatedProfile,
      }));
    }

    return true;
  };

  const handleImportLinkedInData = async (data: any) => {
    form.setValue("name", data.name || form.getValues().name);
    form.setValue("headline", data.headline || form.getValues().headline);
    form.setValue("contactEmail", data.email || form.getValues().contactEmail);
    form.setValue("company", data.company || form.getValues().company);
    form.setValue("position", data.position || form.getValues().position);
    form.setValue("bio", data.bio || form.getValues().bio);
    form.setValue("location", data.location || form.getValues().location);
    form.setValue("website", data.website || form.getValues().website);
    form.setValue("linkedin", data.linkedin || form.getValues().linkedin);
    form.setValue("twitter", data.twitter || form.getValues().twitter);
    form.setValue("github", data.github || form.getValues().github);

    const nextExperiences = Array.isArray(data.experiences)
      ? data.experiences
          .map((item: any) => ({
            id: String(item?.id || crypto.randomUUID()),
            title: item?.title || '',
            company: item?.company || '',
            startDate: item?.startDate || '',
            endDate: item?.endDate || '',
            location: item?.location || '',
            description: item?.description || '',
          }))
          .filter((item: ExperienceItem) => item.title || item.company)
      : experiences;

    const nextEducations = Array.isArray(data.educations)
      ? data.educations
          .map((item: any) => ({
            id: String(item?.id || crypto.randomUUID()),
            degree: item?.degree || '',
            institution: item?.institution || '',
            startYear: item?.startYear || '',
            endYear: item?.endYear || '',
            location: item?.location || '',
            description: item?.description || '',
          }))
          .filter((item: EducationItem) => item.degree || item.institution)
      : educations;

    const nextSkills = Array.isArray(data.skills)
      ? data.skills.filter((value: unknown) => typeof value === 'string')
      : skills;

    setExperiences(nextExperiences);
    setEducations(nextEducations);
    setSkills(nextSkills);

    if (isOwnProfile && profile) {
      const profileResponse = await apiService.updateUserProfile(profile.id || profile._id, {
        headline: data.headline || form.getValues().headline,
        company: data.company || form.getValues().company,
        position: data.position || form.getValues().position,
        bio: data.bio || form.getValues().bio,
        location: data.location || form.getValues().location,
        linkedInProfile: data.connectLinkedIn ? data.linkedin : form.getValues().linkedin,
        experiences: nextExperiences,
        educations: nextEducations,
        skills: nextSkills,
        interests,
      });

      if (!profileResponse.success) {
        throw new Error(profileResponse.message || 'Failed to connect LinkedIn profile');
      }

      const updatedProfile = profileResponse.user || profileResponse.data;
      if (updatedProfile) {
        setProfile((previous: any) => ({
          ...previous,
          ...updatedProfile,
        }));
      }
    } else {
      await saveProfileSections(nextExperiences, nextEducations, nextSkills, interests);
    }

    if (isOwnProfile && Array.isArray(data.posts) && data.posts.length > 0 && data.importPosts) {
      const payloadPosts = data.posts
        .map((item: any) => ({
          title: typeof item?.title === 'string' ? item.title : undefined,
          content: typeof item?.content === 'string' ? item.content.trim() : '',
          postUrl: typeof item?.postUrl === 'string' ? item.postUrl : undefined,
          publishedAt: typeof item?.publishedAt === 'string' ? item.publishedAt : undefined,
        }))
        .filter((item: { content: string }) => item.content.length > 0);

      if (payloadPosts.length > 0) {
        const importResponse = await apiService.importLinkedInPosts({
          linkedInProfile: data.linkedin,
          posts: payloadPosts,
        });

        if (importResponse.success) {
          const importedCount = Number(importResponse.importedCount || importResponse.data?.length || 0);
          const skippedCount = Number(importResponse.skippedCount || 0);
          return { importedCount, skippedCount };
        } else {
          throw new Error(importResponse.message || 'LinkedIn profile connected, but posts could not be imported.');
        }
      }
    }

    return { importedCount: 0, skippedCount: 0 };
  };
  
  // Handle experience functions
  const handleAddExperience = () => {
    setCurrentExperience(null);
    setExperienceFormData({
      title: '',
      company: '',
      startDate: '',
      endDate: '',
      location: '',
      description: '',
    });
    setIsExperienceModalOpen(true);
  };

  const handleEditExperience = (experience: ExperienceItem) => {
    setCurrentExperience(experience);
    setExperienceFormData({
      title: experience.title,
      company: experience.company,
      startDate: experience.startDate,
      endDate: experience.endDate,
      location: experience.location,
      description: experience.description,
    });
    setIsExperienceModalOpen(true);
  };

  const handleDeleteExperience = async (id: string) => {
    const previousExperiences = experiences;
    const nextExperiences = experiences.filter((exp) => exp.id !== id);
    setExperiences(nextExperiences);
    const saved = await saveProfileSections(nextExperiences, educations, skills, interests);
    if (!saved) {
      setExperiences(previousExperiences);
      return;
    }
    toast({
      title: "Experience deleted",
      description: "Your experience has been removed successfully."
    });
  };

  const handleSaveExperience = async (experienceData: Omit<ExperienceItem, 'id'>) => {
    let nextExperiences: ExperienceItem[];

    if (currentExperience) {
      nextExperiences = experiences.map((exp) =>
        exp.id === currentExperience.id ? { ...experienceData, id: exp.id } : exp
      );
    } else {
      nextExperiences = [{ ...experienceData, id: crypto.randomUUID() }, ...experiences];
    }

    setExperiences(nextExperiences);
    const saved = await saveProfileSections(nextExperiences, educations, skills, interests);
    if (!saved) {
      return;
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
    setEducationFormData({
      degree: '',
      institution: '',
      startYear: '',
      endYear: '',
      location: '',
      description: '',
    });
    setIsEducationModalOpen(true);
  };

  const handleEditEducation = (education: EducationItem) => {
    setCurrentEducation(education);
    setEducationFormData({
      degree: education.degree,
      institution: education.institution,
      startYear: education.startYear,
      endYear: education.endYear,
      location: education.location,
      description: education.description,
    });
    setIsEducationModalOpen(true);
  };

  const handleDeleteEducation = async (id: string) => {
    const previousEducations = educations;
    const nextEducations = educations.filter((edu) => edu.id !== id);
    setEducations(nextEducations);
    const saved = await saveProfileSections(experiences, nextEducations, skills, interests);
    if (!saved) {
      setEducations(previousEducations);
      return;
    }
    toast({
      title: "Education deleted",
      description: "Your education record has been removed successfully."
    });
  };

  const handleSaveEducation = async (educationData: Omit<EducationItem, 'id'>) => {
    let nextEducations: EducationItem[];

    if (currentEducation) {
      nextEducations = educations.map((edu) =>
        edu.id === currentEducation.id ? { ...educationData, id: edu.id } : edu
      );
    } else {
      nextEducations = [{ ...educationData, id: crypto.randomUUID() }, ...educations];
    }

    setEducations(nextEducations);
    const saved = await saveProfileSections(experiences, nextEducations, skills, interests);
    if (!saved) {
      return;
    }

    setIsEducationModalOpen(false);
    toast({
      title: currentEducation ? "Education updated" : "Education added",
      description: "Your education has been updated successfully."
    });
  };

  // Handle skills and interests
  const handleAddSkill = async () => {
    if (newSkill && !skills.includes(newSkill)) {
      const nextSkills = [...skills, newSkill.trim()];
      setSkills(nextSkills);
      setNewSkill("");

      await saveProfileSections(experiences, educations, nextSkills, interests);

      toast({
        title: "Skill added",
        description: `"${newSkill}" has been added to your skills.`
      });
    }
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    const nextSkills = skills.filter(skill => skill !== skillToRemove);
    setSkills(nextSkills);
    await saveProfileSections(experiences, educations, nextSkills, interests);
  };

  const handleAddInterest = async (interest: string) => {
    if (!interests.includes(interest)) {
      const nextInterests = [...interests, interest];
      setInterests(nextInterests);
      await saveProfileSections(experiences, educations, skills, nextInterests);
    }
  };

  const handleRemoveInterest = async (interestToRemove: string) => {
    const nextInterests = interests.filter((interest) => interest !== interestToRemove);
    setInterests(nextInterests);
    await saveProfileSections(experiences, educations, skills, nextInterests);
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
      
      <Card className="mb-8 border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex flex-col items-center">
              <Avatar className="h-32 w-32 mb-2 ring-4 ring-primary/10">
                <AvatarImage src={profile.profileImage || undefined} alt={profile.name} />
                <AvatarFallback className="text-3xl font-medium bg-primary/10 text-foreground/90">
                  {profile.firstName?.[0] || profile.name?.charAt(0)}
                  {profile.lastName?.[0] || profile.name?.split(' ')?.[1]?.charAt(0) || ''}
                </AvatarFallback>
              </Avatar>
              
              {isOwnProfile && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="mt-2 border-primary text-foreground hover:bg-primary/5 transition-colors"
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
                
                {(profile.contactEmail || profile.email) && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.contactEmail || profile.email}</span>
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
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-foreground/90 hover:underline">{profile.website}</a>
                  </div>
                )}
                
                {profile.linkedInProfile && (
                  <div className="flex items-center gap-2">
                    <LinkedinIcon className="h-4 w-4 text-muted-foreground" />
                    <a href={profile.linkedInProfile} target="_blank" rel="noopener noreferrer" className="text-foreground/90 hover:underline">LinkedIn Profile</a>
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
                  <Button variant="outline" onClick={() => navigate(`/messages?user=${profile.id || profile._id}`)}>Message</Button>
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
            <TabsList className="bg-muted/30 p-1 rounded-lg w-full">
              <TabsTrigger 
                value="profile"
                className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-white hover:text-foreground"
              >
                Edit Profile
              </TabsTrigger>
              <TabsTrigger 
                value="experiences"
                className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-white hover:text-foreground"
              >
                Experience
              </TabsTrigger>
              <TabsTrigger 
                value="education"
                className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-white hover:text-foreground"
              >
                Education
              </TabsTrigger>
              <TabsTrigger 
                value="skills"
                className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-white hover:text-foreground"
              >
                Skills & Interests
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
                          .then((response) => {
                            const updatedProfile = response.user || response.data;
                            if (updatedProfile) {
                              setProfile((previous: any) => ({
                                ...previous,
                                ...updatedProfile,
                                id: updatedProfile.id || previous?.id,
                              }));
                            }
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
                          name="contactEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Email</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={!isOwnProfile} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="contactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Phone</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={!isOwnProfile} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={!isOwnProfile} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={!isOwnProfile} />
                              </FormControl>
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
                            className="bg-primary hover:bg-primary/90 text-white rounded-lg px-4 py-2 transform hover:scale-105 hover:shadow-lg transition-all duration-300"
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
                        className="bg-primary hover:bg-primary/90 text-white rounded-lg transform hover:scale-105 hover:shadow-lg transition-all duration-300"
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
                            <h4 className="font-semibold text-foreground">{experience.title}</h4>
                            <p className="text-foreground/90">{experience.company}</p>
                            <p className="text-sm text-muted-foreground/80">{experience.startDate} - {experience.endDate} · {experience.location}</p>
                            <p className="mt-2 text-foreground/80">{experience.description}</p>
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
                        className="bg-primary hover:bg-primary/90 text-white rounded-lg transform hover:scale-105 hover:shadow-lg transition-all duration-300"
                        onClick={handleAddEducation}
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
                            <h4 className="font-semibold text-foreground">{education.degree}</h4>
                            <p className="text-foreground/90">{education.institution}</p>
                            <p className="text-sm text-muted-foreground/80">{education.startYear} - {education.endYear}</p>
                            <p className="mt-2 text-foreground/80">{education.description}</p>
                          </div>
                          {isOwnProfile && (
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditEducation(education)}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-500"
                                onClick={() => handleDeleteEducation(education.id)}
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
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-8">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Skills</h3>
                        {isOwnProfile && (
                          <Button
                            className="bg-primary hover:bg-primary/90 text-white rounded-lg transform hover:scale-105 hover:shadow-lg transition-all duration-300"
                            onClick={() => setIsSkillsModalOpen(true)}
                          >
                            + Add Skills
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill) => (
                          <div key={skill} className="relative group">
                            <Badge className="bg-primary/10 text-foreground/90 hover:bg-primary/20 px-3 py-1 rounded-lg">
                              {skill}
                              {isOwnProfile && (
                                <button 
                                  className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleRemoveSkill(skill);
                                  }}
                                >
                                  ×
                                </button>
                              )}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Interests</h3>
                        {isOwnProfile && (
                          <Button
                            className="bg-primary hover:bg-primary/90 text-white rounded-lg transform hover:scale-105 hover:shadow-lg transition-all duration-300"
                            onClick={() => setIsSkillsModalOpen(true)}
                          >
                            + Add Interests
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {interests.map((interest) => (
                          <div key={interest} className="relative group">
                            <Badge className="bg-primary/10 text-blue-800 hover:bg-blue-200 px-3 py-1 rounded-lg">
                              {interest}
                              {isOwnProfile && (
                                <button 
                                  className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleRemoveInterest(interest);
                                  }}
                                >
                                  ×
                                </button>
                              )}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Languages</h3>
                        {isOwnProfile && (
                          <Button
                            className="bg-primary hover:bg-primary/90 text-white rounded-lg transform hover:scale-105 hover:shadow-lg transition-all duration-300"
                            onClick={() => setIsSkillsModalOpen(true)}
                          >
                            + Add Languages
                          </Button>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">English</span>
                          <span className="text-sm text-muted-foreground/80">Native or Bilingual</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Spanish</span>
                          <span className="text-sm text-muted-foreground/80">Professional Working</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">French</span>
                          <span className="text-sm text-muted-foreground/80">Elementary</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                  value={experienceFormData.title}
                  onChange={(e) => setExperienceFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="mt-2"
                  placeholder="e.g. Software Engineer"
                />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input 
                  id="company" 
                  value={experienceFormData.company}
                  onChange={(e) => setExperienceFormData((prev) => ({ ...prev, company: e.target.value }))}
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
                  value={experienceFormData.startDate}
                  onChange={(e) => setExperienceFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="mt-2"
                  placeholder="e.g. Jan 2020"
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input 
                  id="endDate" 
                  value={experienceFormData.endDate}
                  onChange={(e) => setExperienceFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="mt-2"
                  placeholder="e.g. Present or Dec 2022"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input 
                id="location" 
                value={experienceFormData.location}
                onChange={(e) => setExperienceFormData((prev) => ({ ...prev, location: e.target.value }))}
                className="mt-2"
                placeholder="e.g. San Francisco, CA"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={experienceFormData.description}
                onChange={(e) => setExperienceFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="mt-2"
                placeholder="Describe your responsibilities and achievements"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExperienceModalOpen(false)}>Cancel</Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={() => {
              handleSaveExperience(experienceFormData);
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
                value={educationFormData.degree}
                onChange={(e) => setEducationFormData((prev) => ({ ...prev, degree: e.target.value }))}
                className="mt-2"
                placeholder="e.g. Bachelor of Science in Computer Science"
              />
            </div>
            <div>
              <Label htmlFor="institution">Institution</Label>
              <Input 
                id="institution" 
                value={educationFormData.institution}
                onChange={(e) => setEducationFormData((prev) => ({ ...prev, institution: e.target.value }))}
                className="mt-2"
                placeholder="e.g. Stanford University"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startYear">Start Year</Label>
                <Input 
                  id="startYear" 
                  value={educationFormData.startYear}
                  onChange={(e) => setEducationFormData((prev) => ({ ...prev, startYear: e.target.value }))}
                  className="mt-2"
                  placeholder="e.g. 2018"
                />
              </div>
              <div>
                <Label htmlFor="endYear">End Year</Label>
                <Input 
                  id="endYear" 
                  value={educationFormData.endYear}
                  onChange={(e) => setEducationFormData((prev) => ({ ...prev, endYear: e.target.value }))}
                  className="mt-2"
                  placeholder="e.g. 2022 or Present"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="eduLocation">Location</Label>
              <Input 
                id="eduLocation" 
                value={educationFormData.location}
                onChange={(e) => setEducationFormData((prev) => ({ ...prev, location: e.target.value }))}
                className="mt-2"
                placeholder="e.g. Stanford, CA"
              />
            </div>
            <div>
              <Label htmlFor="eduDescription">Description</Label>
              <Textarea 
                id="eduDescription" 
                value={educationFormData.description}
                onChange={(e) => setEducationFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="mt-2"
                placeholder="Additional details about your studies"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEducationModalOpen(false)}>Cancel</Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={() => {
              handleSaveEducation(educationFormData);
            }}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skills Modal */}
      {isOwnProfile && isSkillsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-medium mb-4">
              {newSkill ? "Add New Skill" : "Manage Skills"}
            </h3>
            
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                await handleAddSkill();
              }} 
              className="space-y-4"
            >
              <div>
                <label htmlFor="new-skill" className="block text-sm font-medium text-foreground/80">Skill</label>
                <input
                  id="new-skill"
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  placeholder="e.g. Python"
                  required
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline"
                  type="button"
                  onClick={() => setIsSkillsModalOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-white rounded-lg px-4 py-2 transform hover:scale-105 hover:shadow-lg transition-all duration-300 w-full sm:w-auto"
                >
                  Add Skill
                </Button>
              </div>
            </form>
            
            <div className="mt-4">
              <h4 className="text-sm font-medium text-foreground/80 mb-2">Existing Skills</h4>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge key={skill} className="bg-primary/10 text-foreground/90 hover:bg-primary/20 px-3 py-1 rounded-lg">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
            
            <button
              onClick={() => setIsSkillsModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground/80 hover:text-foreground/80"
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
