import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bell,
  Lock,
  User,
  LogOut,
  Save,
  Trash2,
  Globe,
  Eye,
  Key,
  GraduationCap,
  Users,
  ExternalLink,
  AlertCircle,
  HelpCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import apiService from "@/services/apiService";
import HelpSection from "@/components/settings/HelpSection";

// Define types for form data
interface ProfileFormData {
  name: string;
  email: string;
  jobTitle: string;
  company: string;
  city: string;
  country: string;
  bio: string;
  contactPhone: string;
  linkedInProfile: string;
}

interface NotificationSettings {
  emailMessages: boolean;
  emailJobs: boolean;
  emailEvents: boolean;
  emailGroups: boolean;
  pushMessages: boolean;
  pushJobs: boolean;
  pushEvents: boolean;
  pushGroups: boolean;
}

interface PrivacySettings {
  profileVisibility: 'public' | 'alumni' | 'connections';
  showEmail: boolean;
  showPhone: boolean;
  allowMessaging: boolean;
  allowConnection: boolean;
  allowProfileSearch: boolean;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface SessionActivityItem {
  id: string;
  device: string;
  location: string;
  time: string;
  browser: string;
  isCurrent: boolean;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const { currentUser, logout, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState("notifications");
  const [loading, setLoading] = useState(false);

  // Profile settings
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    jobTitle: currentUser?.jobTitle || "",
    company: currentUser?.company || "",
    city: currentUser?.city || "",
    country: currentUser?.country || "",
    bio: currentUser?.bio || "",
    contactPhone: currentUser?.contactPhone || "",
    linkedInProfile: currentUser?.linkedInProfile || ""
  });

  // Notification settings with defaults
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailMessages: currentUser?.notificationSettings?.emailMessages ?? true,
    emailJobs: currentUser?.notificationSettings?.emailJobs ?? true,
    emailEvents: currentUser?.notificationSettings?.emailEvents ?? true,
    emailGroups: currentUser?.notificationSettings?.emailGroups ?? true,
    pushMessages: currentUser?.notificationSettings?.pushMessages ?? true,
    pushJobs: currentUser?.notificationSettings?.pushJobs ?? false,
    pushEvents: currentUser?.notificationSettings?.pushEvents ?? true,
    pushGroups: currentUser?.notificationSettings?.pushGroups ?? true
  });

  // Privacy settings with defaults
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisibility: currentUser?.privacySettings?.profileVisibility ?? 'alumni',
    showEmail: currentUser?.privacySettings?.showEmail ?? false,
    showPhone: currentUser?.privacySettings?.showPhone ?? false,
    allowMessaging: currentUser?.privacySettings?.allowMessaging ?? true,
    allowConnection: currentUser?.privacySettings?.allowConnection ?? true,
    allowProfileSearch: currentUser?.privacySettings?.allowProfileSearch ?? true
  });

  // Security settings
  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profilePhotoLoading, setProfilePhotoLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionActivity, setSessionActivity] = useState<SessionActivityItem[]>([]);

  const loadSessions = async () => {
    try {
      setSessionLoading(true);
      const response = await apiService.getActiveSessions();
      if (response.success && response.data?.sessions) {
        setSessionActivity(response.data.sessions as SessionActivityItem[]);
      } else {
        setSessionActivity([]);
      }
    } catch {
      setSessionActivity([]);
    } finally {
      setSessionLoading(false);
    }
  };

  // Update state when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        name: currentUser.name || "",
        email: currentUser.email || "",
        jobTitle: currentUser.jobTitle || "",
        company: currentUser.company || "",
        city: currentUser.city || "",
        country: currentUser.country || "",
        bio: currentUser.bio || "",
        contactPhone: currentUser.contactPhone || "",
        linkedInProfile: currentUser.linkedInProfile || ""
      });

      setNotificationSettings({
        emailMessages: currentUser.notificationSettings?.emailMessages ?? true,
        emailJobs: currentUser.notificationSettings?.emailJobs ?? true,
        emailEvents: currentUser.notificationSettings?.emailEvents ?? true,
        emailGroups: currentUser.notificationSettings?.emailGroups ?? true,
        pushMessages: currentUser.notificationSettings?.pushMessages ?? true,
        pushJobs: currentUser.notificationSettings?.pushJobs ?? false,
        pushEvents: currentUser.notificationSettings?.pushEvents ?? true,
        pushGroups: currentUser.notificationSettings?.pushGroups ?? true
      });

      setPrivacySettings({
        profileVisibility: currentUser.privacySettings?.profileVisibility ?? 'alumni',
        showEmail: currentUser.privacySettings?.showEmail ?? false,
        showPhone: currentUser.privacySettings?.showPhone ?? false,
        allowMessaging: currentUser.privacySettings?.allowMessaging ?? true,
        allowConnection: currentUser.privacySettings?.allowConnection ?? true,
        allowProfileSearch: currentUser.privacySettings?.allowProfileSearch ?? true
      });

      loadSessions();
    }
  }, [currentUser]);

  const handlePhotoChangeClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    try {
      setProfilePhotoLoading(true);
      const uploadResponse = await apiService.uploadFile(selectedFile);
      const imageUrl = uploadResponse.data?.url;

      if (!uploadResponse.success || !imageUrl) {
        throw new Error(uploadResponse.message || "Failed to upload profile photo");
      }

      const profileResponse = await apiService.updateProfile({ profileImage: imageUrl });
      if (!profileResponse.success) {
        throw new Error(profileResponse.message || "Failed to update profile photo");
      }

      await refreshUser();
      toast({
        title: "Photo Updated",
        description: "Your profile photo has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile photo.",
        variant: "destructive",
      });
    } finally {
      event.target.value = "";
      setProfilePhotoLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;

    try {
      setLoading(true);
      const response = await apiService.updateProfile(profileForm);
      
      if (response.success) {
        toast({ 
          title: "Profile Updated", 
          description: "Your profile has been successfully updated." 
        });
        await refreshUser(); // Refresh user data in context
      } else {
        throw new Error(response.message || "Failed to update profile");
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update profile settings.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await apiService.updateNotificationSettings(notificationSettings);
      
      if (response.success) {
        toast({ 
          title: "Notifications Updated", 
          description: "Your notification preferences have been updated." 
        });
        await refreshUser(); // Refresh user data in context
      } else {
        throw new Error(response.message || "Failed to update notification settings");
      }
    } catch (error: any) {
      console.error("Error updating notifications:", error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update notification settings.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await apiService.updatePrivacySettings(privacySettings);
      
      if (response.success) {
        toast({ 
          title: "Privacy Settings Updated", 
          description: "Your privacy settings have been updated." 
        });
        await refreshUser(); // Refresh user data in context
      } else {
        throw new Error(response.message || "Failed to update privacy settings");
      }
    } catch (error: any) {
      console.error("Error updating privacy settings:", error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update privacy settings.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ 
        title: "Error", 
        description: "New passwords do not match.", 
        variant: "destructive" 
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast({ 
        title: "Error", 
        description: "New password must be at least 8 characters long.", 
        variant: "destructive" 
      });
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.changePassword(
        passwordForm.currentPassword, 
        passwordForm.newPassword
      );
      
      if (response.success) {
        toast({ 
          title: "Password Updated", 
          description: "Your password has been successfully changed." 
        });
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        throw new Error(response.message || "Failed to update password");
      }
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update password.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error: any) {
      console.error("Error logging out:", error);
      toast({ 
        title: "Error", 
        description: "Failed to log out.", 
        variant: "destructive" 
      });
    }
  };

  const handleAccountDeactivation = async () => {
    if (globalThis.confirm("Are you sure you want to deactivate your account? This action cannot be undone.")) {
      try {
        setLoading(true);
        const response = await apiService.deactivateAccount();

        if (!response.success) {
          throw new Error(response.message || "Failed to deactivate account");
        }

        toast({ 
          title: "Account Deactivated", 
          description: "Your account has been deactivated." 
        });
        await logout();
      } catch (error: any) {
        console.error("Error deactivating account:", error);
        toast({ 
          title: "Error", 
          description: "Failed to deactivate account.", 
          variant: "destructive" 
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLogoutOtherSessions = async () => {
    try {
      setSessionLoading(true);
      const response = await apiService.logoutOtherSessions();

      if (!response.success) {
        throw new Error(response.message || "Failed to sign out other devices");
      }

      toast({
        title: "Other Devices Signed Out",
        description: "All other active sessions have been ended.",
      });

      await loadSessions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign out other devices.",
        variant: "destructive",
      });
    } finally {
      setSessionLoading(false);
    }
  };

  const handleContactSupport = () => {
    const subject = encodeURIComponent("Support request - Account settings");
    const body = encodeURIComponent(
      `Hi Support Team,\n\nI need help with my account settings.\n\nUser: ${currentUser?.email || ""}\n\nThanks.`
    );
    globalThis.open(`mailto:support@mpsajmerconnect.com?subject=${subject}&body=${body}`, "_self");
  };

  const renderSessionsContent = () => {
    if (sessionLoading) {
      return (
        <div className="py-8 flex justify-center">
          <LoadingSpinner />
        </div>
      );
    }

    if (sessionActivity.length === 0) {
      return <p className="text-sm text-muted-foreground py-2">No active session details available.</p>;
    }

    return sessionActivity.map((session) => (
      <div key={session.id} className="flex items-center justify-between py-3 border-b last:border-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{session.device}</p>
              {session.isCurrent && (
                <Badge className="bg-green-100 text-green-800 text-xs">Current</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{session.browser}</span>
              <span>•</span>
              <span>{session.location}</span>
              <span>•</span>
              <span>{session.time}</span>
            </div>
          </div>
        </div>

        {!session.isCurrent && (
          <Button variant="ghost" size="sm" className="text-red-500" onClick={handleLogoutOtherSessions}>
            Sign Out Others
          </Button>
        )}
      </div>
    ));
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground/90">Account Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your profile, notifications, privacy, and account security.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1 max-w-4xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-auto gap-1">
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Privacy</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
              <TabsTrigger value="help" className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Help</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              {/* Profile Settings */}
              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Profile Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProfileSubmit} className="space-y-6">
                      {/* Profile Picture Section */}
                      <div className="flex flex-col sm:flex-row items-start gap-6">
                        <div className="flex flex-col items-center space-y-4">
                          <Avatar className="h-24 w-24">
                            <AvatarImage src={currentUser.profileImage} />
                            <AvatarFallback className="bg-primary/10 text-foreground/90 text-xl">
                              {currentUser.name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoUpload}
                          />
                          <Button type="button" variant="outline" size="sm" onClick={handlePhotoChangeClick} disabled={profilePhotoLoading}>
                            {profilePhotoLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                            Change Photo
                          </Button>
                        </div>

                        <div className="flex-1 space-y-4 w-full">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label htmlFor="settings-full-name" className="text-sm font-medium">Full Name</label>
                              <Input
                                id="settings-full-name"
                                value={profileForm.name}
                                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="settings-email" className="text-sm font-medium">Email</label>
                              <Input
                                id="settings-email"
                                type="email"
                                value={profileForm.email}
                                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label htmlFor="settings-job-title" className="text-sm font-medium">Job Title</label>
                              <Input
                                id="settings-job-title"
                                value={profileForm.jobTitle}
                                onChange={(e) => setProfileForm({ ...profileForm, jobTitle: e.target.value })}
                                placeholder="Software Engineer, Product Manager, etc."
                              />
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="settings-company" className="text-sm font-medium">Company</label>
                              <Input
                                id="settings-company"
                                value={profileForm.company}
                                onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })}
                                placeholder="Company or Organization"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label htmlFor="settings-city" className="text-sm font-medium">City</label>
                              <Input
                                id="settings-city"
                                value={profileForm.city}
                                onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                                placeholder="San Francisco"
                              />
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="settings-country" className="text-sm font-medium">Country</label>
                              <Input
                                id="settings-country"
                                value={profileForm.country}
                                onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                                placeholder="United States"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label htmlFor="settings-phone" className="text-sm font-medium">Phone</label>
                              <Input
                                id="settings-phone"
                                value={profileForm.contactPhone}
                                onChange={(e) => setProfileForm({ ...profileForm, contactPhone: e.target.value })}
                                placeholder="(555) 123-4567"
                              />
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="settings-linkedin" className="text-sm font-medium">LinkedIn Profile</label>
                              <Input
                                id="settings-linkedin"
                                value={profileForm.linkedInProfile}
                                onChange={(e) => setProfileForm({ ...profileForm, linkedInProfile: e.target.value })}
                                placeholder="https://linkedin.com/in/username"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label htmlFor="settings-bio" className="text-sm font-medium">Bio</label>
                            <textarea
                              id="settings-bio"
                              className="w-full min-h-[100px] p-3 border border-input bg-background rounded-md focus:ring-2 focus:ring-ring focus:border-ring resize-y"
                              value={profileForm.bio}
                              onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                              placeholder="Tell others about yourself, your interests, and your professional background..."
                              maxLength={500}
                            />
                            <p className="text-xs text-muted-foreground">{profileForm.bio.length}/500 characters</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t">
                        <Button
                          type="submit"
                          disabled={loading}
                          className="bg-primary hover:bg-primary/90 min-w-[120px]"
                        >
                          {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                          Save Profile
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notification Settings */}
              <TabsContent value="notifications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Notification Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleNotificationSubmit} className="space-y-6">
                      <div>
                        <h3 className="font-medium mb-4">Email Notifications</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Direct Messages</p>
                              <p className="text-sm text-muted-foreground">Receive email when someone sends you a message</p>
                            </div>
                            <Switch
                              checked={notificationSettings.emailMessages}
                              onCheckedChange={(checked) =>
                                setNotificationSettings({ ...notificationSettings, emailMessages: checked })
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Job Recommendations</p>
                              <p className="text-sm text-muted-foreground">Get notified about job opportunities matching your profile</p>
                            </div>
                            <Switch
                              checked={notificationSettings.emailJobs}
                              onCheckedChange={(checked) =>
                                setNotificationSettings({ ...notificationSettings, emailJobs: checked })
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Events & Announcements</p>
                              <p className="text-sm text-muted-foreground">Stay informed about upcoming alumni events</p>
                            </div>
                            <Switch
                              checked={notificationSettings.emailEvents}
                              onCheckedChange={(checked) =>
                                setNotificationSettings({ ...notificationSettings, emailEvents: checked })
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Group Activities</p>
                              <p className="text-sm text-muted-foreground">Updates from groups you've joined</p>
                            </div>
                            <Switch
                              checked={notificationSettings.emailGroups}
                              onCheckedChange={(checked) =>
                                setNotificationSettings({ ...notificationSettings, emailGroups: checked })
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t">
                        <h3 className="font-medium mb-4">Push Notifications</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Direct Messages</p>
                              <p className="text-sm text-muted-foreground">Receive push notifications for new messages</p>
                            </div>
                            <Switch
                              checked={notificationSettings.pushMessages}
                              onCheckedChange={(checked) =>
                                setNotificationSettings({ ...notificationSettings, pushMessages: checked })
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Job Recommendations</p>
                              <p className="text-sm text-muted-foreground">Get push notifications for job opportunities</p>
                            </div>
                            <Switch
                              checked={notificationSettings.pushJobs}
                              onCheckedChange={(checked) =>
                                setNotificationSettings({ ...notificationSettings, pushJobs: checked })
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Events & Announcements</p>
                              <p className="text-sm text-muted-foreground">Event reminders and announcements</p>
                            </div>
                            <Switch
                              checked={notificationSettings.pushEvents}
                              onCheckedChange={(checked) =>
                                setNotificationSettings({ ...notificationSettings, pushEvents: checked })
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Group Activities</p>
                              <p className="text-sm text-muted-foreground">Notifications from your groups</p>
                            </div>
                            <Switch
                              checked={notificationSettings.pushGroups}
                              onCheckedChange={(checked) =>
                                setNotificationSettings({ ...notificationSettings, pushGroups: checked })
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t">
                        <Button
                          type="submit"
                          disabled={loading}
                          className="bg-primary hover:bg-primary/90 min-w-[140px]"
                        >
                          {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                          Save Preferences
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Privacy Settings */}
              <TabsContent value="privacy" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Privacy Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePrivacySubmit} className="space-y-6">
                      <div>
                        <h3 className="font-medium mb-4">Profile Visibility</h3>
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <input
                              type="radio"
                              id="visibility-public"
                              name="profileVisibility"
                              value="public"
                              checked={privacySettings.profileVisibility === "public"}
                              onChange={() => setPrivacySettings({ ...privacySettings, profileVisibility: "public" })}
                              className="h-4 w-4 text-foreground"
                            />
                            <div className="flex-1">
                              <label htmlFor="visibility-public" className="block font-medium">Public</label>
                              <p className="text-sm text-muted-foreground">Anyone on the internet can view your profile</p>
                            </div>
                            <Globe className="h-5 w-5 text-muted-foreground" />
                          </div>

                          <div className="flex items-center gap-4">
                            <input
                              type="radio"
                              id="visibility-alumni"
                              name="profileVisibility"
                              value="alumni"
                              checked={privacySettings.profileVisibility === "alumni"}
                              onChange={() => setPrivacySettings({ ...privacySettings, profileVisibility: "alumni" })}
                              className="h-4 w-4 text-foreground"
                            />
                            <div className="flex-1">
                              <label htmlFor="visibility-alumni" className="block font-medium">Alumni Only</label>
                              <p className="text-sm text-muted-foreground">Only alumni from your school can view your profile</p>
                            </div>
                            <GraduationCap className="h-5 w-5 text-muted-foreground" />
                          </div>

                          <div className="flex items-center gap-4">
                            <input
                              type="radio"
                              id="visibility-connections"
                              name="profileVisibility"
                              value="connections"
                              checked={privacySettings.profileVisibility === "connections"}
                              onChange={() => setPrivacySettings({ ...privacySettings, profileVisibility: "connections" })}
                              className="h-4 w-4 text-foreground"
                            />
                            <div className="flex-1">
                              <label htmlFor="visibility-connections" className="block font-medium">Connections Only</label>
                              <p className="text-sm text-muted-foreground">Only people you've connected with can view your full profile</p>
                            </div>
                            <Users className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t">
                        <h3 className="font-medium mb-4">Contact Information</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Show Email Address</p>
                              <p className="text-sm text-muted-foreground">Allow others to see your email address</p>
                            </div>
                            <Switch
                              checked={privacySettings.showEmail}
                              onCheckedChange={(checked) =>
                                setPrivacySettings({ ...privacySettings, showEmail: checked })
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Show Phone Number</p>
                              <p className="text-sm text-muted-foreground">Allow others to see your phone number</p>
                            </div>
                            <Switch
                              checked={privacySettings.showPhone}
                              onCheckedChange={(checked) =>
                                setPrivacySettings({ ...privacySettings, showPhone: checked })
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t">
                        <h3 className="font-medium mb-4">Social Interactions</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Allow Messaging</p>
                              <p className="text-sm text-muted-foreground">Let others send you direct messages</p>
                            </div>
                            <Switch
                              checked={privacySettings.allowMessaging}
                              onCheckedChange={(checked) =>
                                setPrivacySettings({ ...privacySettings, allowMessaging: checked })
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Allow Connection Requests</p>
                              <p className="text-sm text-muted-foreground">Let others send you connection requests</p>
                            </div>
                            <Switch
                              checked={privacySettings.allowConnection}
                              onCheckedChange={(checked) =>
                                setPrivacySettings({ ...privacySettings, allowConnection: checked })
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Appear in Search Results</p>
                              <p className="text-sm text-muted-foreground">Allow your profile to appear in the alumni directory</p>
                            </div>
                            <Switch
                              checked={privacySettings.allowProfileSearch}
                              onCheckedChange={(checked) =>
                                setPrivacySettings({ ...privacySettings, allowProfileSearch: checked })
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t">
                        <Button
                          type="submit"
                          disabled={loading}
                          className="bg-primary hover:bg-primary/90 min-w-[160px]"
                        >
                          {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                          Save Privacy Settings
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Settings */}
              <TabsContent value="security" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5" />
                      Change Password
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="settings-current-password" className="text-sm font-medium">Current Password</label>
                        <Input
                          id="settings-current-password"
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="settings-new-password" className="text-sm font-medium">New Password</label>
                        <Input
                          id="settings-new-password"
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Must be at least 8 characters with a mix of letters, numbers, and symbols.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="settings-confirm-password" className="text-sm font-medium">Confirm New Password</label>
                        <Input
                          id="settings-confirm-password"
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          required
                        />
                      </div>

                      <div className="flex justify-end pt-4 border-t">
                        <Button
                          type="submit"
                          disabled={loading}
                          className="bg-primary hover:bg-primary/90 min-w-[140px]"
                        >
                          {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <Key className="h-4 w-4 mr-2" />}
                          Update Password
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Active Sessions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {renderSessionsContent()}
                    </div>

                    <div className="flex justify-end mt-4">
                      <Button variant="outline" className="flex items-center gap-2" onClick={handleLogoutOtherSessions} disabled={sessionLoading}>
                        <LogOut className="h-4 w-4" />
                        Sign Out Other Devices
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="help" className="space-y-6">
                <HelpSection />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="lg:w-80 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-6">
                <Avatar className="h-16 w-16 mr-4">
                  <AvatarImage src={currentUser.profileImage} />
                  <AvatarFallback className="bg-primary/10 text-foreground/90 text-xl">
                    {currentUser.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{currentUser.name || "User"}</h3>
                  <p className="text-sm text-muted-foreground">{currentUser.email || "user@example.com"}</p>
                  <Badge className="mt-1 bg-primary/10 text-foreground/90">Alumni</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => setActiveTab("profile")}
                  variant="ghost"
                  className="w-full justify-start"
                >
                  <User className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <Button
                  onClick={() => setActiveTab("security")}
                  variant="ghost"
                  className="w-full justify-start"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-medium text-red-500 mb-2">Danger Zone</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Actions here are permanent and cannot be undone. Please be careful.
              </p>
              <Button
                onClick={handleAccountDeactivation}
                variant="outline"
                className="w-full border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Deactivate Account
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-medium mb-2">Need Help?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                If you're having trouble with your account settings, our support team is here to help.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleContactSupport}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}