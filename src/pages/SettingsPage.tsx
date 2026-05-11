import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  Layout,
  FileText,
  ShieldCheck,
  CheckCircle,
  Clock,
  Upload,
  Bell,
  Palette,
  Eye,
  Lock,
  HelpCircle,
  Sun,
  Moon,
  Monitor,
  Save,
  ExternalLink,
  AlertCircle,
  Globe,
  GraduationCap,
  UserCheck,
  Mail,
  MessageSquare,
  Shield,
  Key,
  LogOut,
  User,
  Trash2
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import apiService from "@/services/apiService";

import HelpSection from "@/components/settings/HelpSection";

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
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser, logout, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("notifications");
  const [loading, setLoading] = useState(false);

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
    globalThis.open(`mailto:support@alumniconnect.com?subject=${subject}&body=${body}`, "_self");
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
            <TabsList className={`grid w-full ${currentUser?.accountType === 'faculty' || currentUser?.needsManualVerification ? 'grid-cols-6' : 'grid-cols-5'} h-auto gap-1`}>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Appearance</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Privacy</span>
              </TabsTrigger>
              {(currentUser?.accountType === 'faculty' || currentUser?.needsManualVerification) && (
                <TabsTrigger value="verification" className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Verification</span>
                </TabsTrigger>
              )}
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
                          Save Social Settings
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Verification Settings */}
              {(currentUser?.accountType === 'faculty' || currentUser?.needsManualVerification) && (
                <TabsContent value="verification" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5" />
                        Account Verification
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/30">
                        <div className={`p-3 rounded-full ${currentUser?.isVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {currentUser?.isVerified ? <CheckCircle className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                        </div>
                        <div>
                          <p className="font-bold text-lg">
                            Status: {currentUser?.isVerified ? 'Verified' : 'Pending Verification'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {currentUser?.isVerified 
                              ? 'Your account has been fully verified by the administration.' 
                              : 'Your account is currently awaiting administrative review.'}
                          </p>
                        </div>
                      </div>

                      {currentUser?.accountType === 'faculty' && (
                        <div className="space-y-4">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Faculty ID Card
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Please upload a clear image of your official Faculty ID card for verification.
                          </p>

                          {currentUser?.facultyIdCardUrl ? (
                            <div className="space-y-4">
                              <div className="relative group rounded-xl overflow-hidden border border-border aspect-video max-w-md mx-auto">
                                <img 
                                  src={currentUser.facultyIdCardUrl} 
                                  alt="Faculty ID Card" 
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Button 
                                    variant="secondary" 
                                    size="sm"
                                    onClick={() => globalThis.open(currentUser.facultyIdCardUrl, '_blank')}
                                  >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    View Full Size
                                  </Button>
                                </div>
                              </div>
                              
                              {!currentUser.isVerified && (
                                <div className="flex flex-col items-center gap-3">
                                  <p className="text-xs text-muted-foreground italic">
                                    You can update your ID card if the current one is incorrect or blurry.
                                  </p>
                                  <input
                                    type="file"
                                    id="faculty-id-upload"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      
                                      try {
                                        setLoading(true);
                                        const uploadRes = await apiService.uploadVerificationIdCard(file);
                                        if (uploadRes.success && uploadRes.url) {
                                          const updateRes = await apiService.updateProfile({ 
                                            facultyIdCardUrl: uploadRes.url,
                                            needsManualVerification: true 
                                          });
                                          if (updateRes.success) {
                                            toast({ title: "ID Card Uploaded", description: "Your ID card has been updated and is pending review." });
                                            await refreshUser();
                                          }
                                        }
                                      } catch (err: any) {
                                        toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
                                      } finally {
                                        setLoading(false);
                                      }
                                    }}
                                  />
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    disabled={loading}
                                    onClick={() => document.getElementById('faculty-id-upload')?.click()}
                                  >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Update ID Card
                                  </Button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border rounded-xl bg-muted/10">
                              <div className="p-4 bg-muted rounded-full mb-4">
                                <Upload className="h-8 w-8 text-muted-foreground" />
                              </div>
                              <p className="font-medium text-center mb-2">No ID Card Uploaded</p>
                              <p className="text-xs text-muted-foreground text-center mb-6 max-w-xs">
                                Upload your faculty ID to get access to all faculty-exclusive features.
                              </p>
                              <input
                                type="file"
                                id="faculty-id-upload-new"
                                className="hidden"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  
                                  try {
                                    setLoading(true);
                                    const uploadRes = await apiService.uploadVerificationIdCard(file);
                                    if (uploadRes.success && uploadRes.url) {
                                      const updateRes = await apiService.updateProfile({ 
                                        facultyIdCardUrl: uploadRes.url,
                                        needsManualVerification: true 
                                      });
                                      if (updateRes.success) {
                                        toast({ title: "ID Card Uploaded", description: "Your ID card has been submitted for review." });
                                        await refreshUser();
                                      }
                                    }
                                  } catch (err: any) {
                                    toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
                                  } finally {
                                    setLoading(false);
                                  }
                                }}
                              />
                              <Button 
                                disabled={loading}
                                onClick={() => document.getElementById('faculty-id-upload-new')?.click()}
                              >
                                {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                                Upload ID Card
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {currentUser?.needsManualVerification && currentUser?.accountType === 'alumni' && (
                        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-blue-800">
                          <h4 className="font-semibold flex items-center gap-2 mb-2">
                            <AlertCircle className="h-4 w-4" />
                            Manual Admission Verification
                          </h4>
                          <p className="text-sm">
                            You've requested manual verification because you couldn't find your admission number. 
                            The administrators are reviewing your provided details:
                          </p>
                          <div className="mt-4 p-3 bg-white/50 rounded-lg text-sm border border-blue-200">
                            {currentUser.verificationDetails || 'No additional details provided.'}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {/* Appearance Settings */}
              <TabsContent value="appearance" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Appearance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      <section className="space-y-4">
                        <div className="flex items-center gap-2 text-lg font-semibold">
                          <Layout className="h-5 w-5 text-primary" />
                          <h4>Theme Preference</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Choose how the platform looks to you. Select a theme or let it match your system settings.
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                          {[
                            { 
                              id: 'light', 
                              label: 'Light Mode', 
                              desc: 'Classic bright look',
                              icon: Sun,
                              color: 'bg-white border-gray-200'
                            },
                            { 
                              id: 'dark', 
                              label: 'Dark Mode', 
                              desc: 'Easier on the eyes',
                              icon: Moon,
                              color: 'bg-slate-950 border-slate-800'
                            },
                            { 
                              id: 'system', 
                              label: 'System', 
                              desc: 'Match your device',
                              icon: Monitor,
                              color: 'bg-gradient-to-br from-white to-slate-950 border-gray-300'
                            }
                          ].map((option) => (
                            <div 
                              key={option.id}
                              className={`relative group cursor-pointer`}
                              onClick={() => setTheme(option.id)}
                            >
                              <div className={`h-32 rounded-xl border-2 transition-all p-4 flex flex-col items-center justify-center gap-3 ${
                                theme === option.id 
                                  ? 'border-primary ring-2 ring-primary/20 bg-primary/5' 
                                  : 'border-border hover:border-muted-foreground/30 hover:bg-muted/50'
                              }`}>
                                <div className={`p-3 rounded-full ${
                                  theme === option.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                }`}>
                                  <option.icon className="h-6 w-6" />
                                </div>
                                <div className="text-center">
                                  <p className="font-bold text-sm">{option.label}</p>
                                  <p className="text-[10px] text-muted-foreground">{option.desc}</p>
                                </div>
                                
                                {theme === option.id && (
                                  <div className="absolute top-2 right-2 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                                    <div className="h-2 w-2 bg-white rounded-full" />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                      
                      <Separator />
                      
                      <section className="space-y-4">
                        <div className="flex items-center gap-2 text-lg font-semibold">
                          <Layout className="h-5 w-5 text-primary" />
                          <h4>Interface Options</h4>
                        </div>
                        <div className="p-4 rounded-xl border border-border bg-muted/30">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="font-medium text-sm">Compact View</p>
                              <p className="text-xs text-muted-foreground">Reduce spacing to show more content at once</p>
                            </div>
                            <Switch disabled checked={false} />
                          </div>
                        </div>
                      </section>
                    </div>
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
                    <div className="space-y-8">
                      {/* Profile Visibility */}
                      <section className="space-y-4">
                        <div className="flex items-center gap-2 text-lg font-semibold">
                          <Eye className="h-5 w-5 text-primary" />
                          <h4>Profile Visibility</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Control who can find you and view your full profile details.
                        </p>
                        <div className="grid gap-4 mt-4">
                          {[
                            { 
                              id: 'public', 
                              label: 'Public', 
                              desc: 'Anyone on the internet can view your profile',
                              icon: Globe
                            },
                            { 
                              id: 'alumni', 
                              label: 'Alumni Only', 
                              desc: 'Only verified alumni can view your full profile',
                              icon: GraduationCap
                            },
                            { 
                              id: 'connections', 
                              label: 'Connections Only', 
                              desc: 'Only people you are connected with can see your details',
                              icon: UserCheck
                            }
                          ].map((option) => (
                            <div 
                              key={option.id}
                              className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                                privacySettings.profileVisibility === option.id 
                                  ? 'border-primary bg-primary/5' 
                                  : 'border-border hover:border-muted-foreground/20'
                              }`}
                              onClick={() => setPrivacySettings({ ...privacySettings, profileVisibility: option.id as any })}
                            >
                              <div className={`p-2 rounded-lg ${
                                privacySettings.profileVisibility === option.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                              }`}>
                                <option.icon className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{option.label}</span>
                                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                                    privacySettings.profileVisibility === option.id ? 'border-primary' : 'border-muted-foreground/30'
                                  }`}>
                                    {privacySettings.profileVisibility === option.id && <div className="h-2 w-2 rounded-full bg-primary" />}
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{option.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>

                      <Separator />

                      {/* Contact Info */}
                      <section className="space-y-4">
                        <div className="flex items-center gap-2 text-lg font-semibold">
                          <Mail className="h-5 w-5 text-primary" />
                          <h4>Contact Information</h4>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                            <div className="space-y-0.5">
                              <div className="font-medium">Show Email Address</div>
                              <div className="text-xs text-muted-foreground">Allow others to see your email on your profile</div>
                            </div>
                            <Switch 
                              checked={privacySettings.showEmail} 
                              onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, showEmail: checked })} 
                            />
                          </div>
                          <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                            <div className="space-y-0.5">
                              <div className="font-medium">Show Phone Number</div>
                              <div className="text-xs text-muted-foreground">Allow others to see your phone number</div>
                            </div>
                            <Switch 
                              checked={privacySettings.showPhone} 
                              onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, showPhone: checked })} 
                            />
                          </div>
                        </div>
                      </section>

                      <Separator />

                      {/* Social Interactions */}
                      <section className="space-y-4">
                        <div className="flex items-center gap-2 text-lg font-semibold">
                          <MessageSquare className="h-5 w-5 text-primary" />
                          <h4>Social Interactions</h4>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                            <div className="space-y-0.5">
                              <div className="font-medium">Allow Messaging</div>
                              <div className="text-xs text-muted-foreground">Let others send you direct messages</div>
                            </div>
                            <Switch 
                              checked={privacySettings.allowMessaging} 
                              onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, allowMessaging: checked })} 
                            />
                          </div>
                          <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                            <div className="space-y-0.5">
                              <div className="font-medium">Allow Connection Requests</div>
                              <div className="text-xs text-muted-foreground">Let others send you connection requests</div>
                            </div>
                            <Switch 
                              checked={privacySettings.allowConnection} 
                              onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, allowConnection: checked })} 
                            />
                          </div>
                          <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                            <div className="space-y-0.5">
                              <div className="font-medium">Appear in Search Results</div>
                              <div className="text-xs text-muted-foreground">Allow your profile to appear in the directory search</div>
                            </div>
                            <Switch 
                              checked={privacySettings.allowProfileSearch} 
                              onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, allowProfileSearch: checked })} 
                            />
                          </div>
                        </div>
                      </section>

                      <div className="pt-4 flex justify-end">
                        <Button 
                          onClick={handlePrivacySubmit} 
                          className="rounded-full px-8 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                          disabled={loading}
                        >
                          {loading ? (
                            <div className="flex items-center gap-2">
                              <LoadingSpinner size="sm" />
                              <span>Saving...</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              <span>Save Privacy Settings</span>
                            </div>
                          )}
                        </Button>
                      </div>
                    </div>

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
                  onClick={() => navigate("/profile")}
                  variant="ghost"
                  className="w-full justify-start"
                >
                  <User className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <Button
                  onClick={() => setActiveTab("appearance")}
                  variant="ghost"
                  className="w-full justify-start"
                >
                  <Palette className="h-4 w-4 mr-2" />
                  Appearance
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