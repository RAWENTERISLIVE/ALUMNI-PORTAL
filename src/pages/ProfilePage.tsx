import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { User, Briefcase, MapPin, GraduationCap, Mail, Phone, Globe, Linkedin } from "lucide-react";

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
      
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex flex-col items-center">
              <Avatar className="h-32 w-32 mb-2">
                <AvatarImage src={profile.profileImage || undefined} alt={profile.name} />
                <AvatarFallback className="text-2xl">
                  {profile.firstName?.[0] || profile.name?.charAt(0)}
                  {profile.lastName?.[0] || profile.name?.split(' ')?.[1]?.charAt(0) || ''}
                </AvatarFallback>
              </Avatar>
              
              {isOwnProfile && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="mt-2"
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
            <TabsList>
              <TabsTrigger value="profile">Edit Profile</TabsTrigger>
              <TabsTrigger value="settings">Account Settings</TabsTrigger>
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
                          <Button type="submit">Save Changes</Button>
                        </div>
                      )}
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4">Account Settings</h3>
                  <p className="text-muted-foreground mb-4">
                    Manage your account settings and preferences.
                  </p>
                  
                  <Button variant="destructive">Change Password</Button>
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
    </div>
  );
}
