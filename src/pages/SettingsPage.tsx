
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Lock,
  User,
  Shield,
  LogOut,
  Mail,
  Key,
  Save,
  Trash
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [emailSettings, setEmailSettings] = useState({
    newMessages: true,
    mentorshipRequests: true,
    jobAlerts: false,
    groupUpdates: true,
    schoolAnnouncements: true,
    marketingEmails: false
  });
  
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "alumni",
    showEmail: false,
    showPhone: false,
    allowMessages: true
  });
  
  const handleEmailSettingChange = (setting: keyof typeof emailSettings) => {
    setEmailSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };
  
  const handleSaveEmailSettings = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Settings saved",
        description: "Your email preferences have been updated successfully."
      });
    }, 1000);
  };
  
  const handleSavePrivacySettings = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Settings saved",
        description: "Your privacy settings have been updated successfully."
      });
    }, 1000);
  };
  
  const handleSavePasswordChange = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully."
      });
    }, 1000);
  };
  
  return (
    <div>
      <PageHeader 
        title="Settings" 
        description="Manage your account settings and preferences"
      />
      
      <Tabs defaultValue="account">
        <div className="flex overflow-x-auto mb-6">
          <TabsList className="inline-flex h-auto">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Account</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span>Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Security</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="account">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Account Information</h3>
              
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <Input defaultValue="John Doe" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Email Address</label>
                  <Input defaultValue="john.doe@example.com" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number</label>
                  <Input defaultValue="+1 (555) 123-4567" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Graduation Year</label>
                  <Select defaultValue="2020">
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2020">2020</SelectItem>
                      <SelectItem value="2019">2019</SelectItem>
                      <SelectItem value="2018">2018</SelectItem>
                      <SelectItem value="2017">2017</SelectItem>
                      <SelectItem value="2016">2016</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Major/Degree</label>
                  <Input defaultValue="Computer Science" />
                </div>
                
                <div className="pt-2">
                  <Button className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </Button>
                </div>
              </form>
              
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-lg font-medium text-destructive mb-2">Delete Account</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Once you delete your account, all of your data will be permanently removed. This action cannot be undone.
                </p>
                <Button variant="destructive" className="flex items-center gap-2">
                  <Trash className="h-4 w-4" />
                  <span>Delete Account</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Email Notifications</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">New Messages</p>
                    <p className="text-sm text-muted-foreground">Receive email notifications for new messages</p>
                  </div>
                  <Switch 
                    checked={emailSettings.newMessages} 
                    onCheckedChange={() => handleEmailSettingChange('newMessages')} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Mentorship Requests</p>
                    <p className="text-sm text-muted-foreground">Receive email notifications for mentorship requests</p>
                  </div>
                  <Switch 
                    checked={emailSettings.mentorshipRequests} 
                    onCheckedChange={() => handleEmailSettingChange('mentorshipRequests')} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Job Alerts</p>
                    <p className="text-sm text-muted-foreground">Receive email notifications for new job postings matching your profile</p>
                  </div>
                  <Switch 
                    checked={emailSettings.jobAlerts} 
                    onCheckedChange={() => handleEmailSettingChange('jobAlerts')} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Group Updates</p>
                    <p className="text-sm text-muted-foreground">Receive email notifications for updates in your groups</p>
                  </div>
                  <Switch 
                    checked={emailSettings.groupUpdates} 
                    onCheckedChange={() => handleEmailSettingChange('groupUpdates')} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">School Announcements</p>
                    <p className="text-sm text-muted-foreground">Receive email notifications for important school announcements</p>
                  </div>
                  <Switch 
                    checked={emailSettings.schoolAnnouncements} 
                    onCheckedChange={() => handleEmailSettingChange('schoolAnnouncements')} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Marketing Emails</p>
                    <p className="text-sm text-muted-foreground">Receive promotional emails about alumni events and services</p>
                  </div>
                  <Switch 
                    checked={emailSettings.marketingEmails} 
                    onCheckedChange={() => handleEmailSettingChange('marketingEmails')} 
                  />
                </div>
                
                <div className="pt-4">
                  <Button 
                    onClick={handleSaveEmailSettings}
                    disabled={loading}
                  >
                    {loading ? <LoadingSpinner size="sm" /> : "Save Preferences"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="privacy">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Privacy Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Profile Visibility</label>
                  <Select 
                    value={privacySettings.profileVisibility}
                    onValueChange={(value) => setPrivacySettings(prev => ({ ...prev, profileVisibility: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public (Anyone)</SelectItem>
                      <SelectItem value="alumni">Alumni Only</SelectItem>
                      <SelectItem value="connections">My Connections Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Controls who can see your full profile
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show Email Address</p>
                    <p className="text-sm text-muted-foreground">Make your email address visible to other users</p>
                  </div>
                  <Switch 
                    checked={privacySettings.showEmail} 
                    onCheckedChange={() => setPrivacySettings(prev => ({ ...prev, showEmail: !prev.showEmail }))} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show Phone Number</p>
                    <p className="text-sm text-muted-foreground">Make your phone number visible to other users</p>
                  </div>
                  <Switch 
                    checked={privacySettings.showPhone} 
                    onCheckedChange={() => setPrivacySettings(prev => ({ ...prev, showPhone: !prev.showPhone }))} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Allow Direct Messages</p>
                    <p className="text-sm text-muted-foreground">Allow other users to send you direct messages</p>
                  </div>
                  <Switch 
                    checked={privacySettings.allowMessages} 
                    onCheckedChange={() => setPrivacySettings(prev => ({ ...prev, allowMessages: !prev.allowMessages }))} 
                  />
                </div>
                
                <div className="pt-4">
                  <Button 
                    onClick={handleSavePrivacySettings}
                    disabled={loading}
                  >
                    {loading ? <LoadingSpinner size="sm" /> : "Save Privacy Settings"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Change Password</h3>
              
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Current Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input type="password" className="pl-10" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">New Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input type="password" className="pl-10" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input type="password" className="pl-10" />
                  </div>
                </div>
                
                <div className="pt-2">
                  <Button 
                    className="flex items-center gap-2"
                    onClick={handleSavePasswordChange}
                    disabled={loading}
                  >
                    <Lock className="h-4 w-4" />
                    {loading ? <LoadingSpinner size="sm" /> : "Change Password"}
                  </Button>
                </div>
              </form>
              
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Enable 2FA</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                  </div>
                  <Switch />
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-lg font-medium mb-4">Active Sessions</h3>
                
                <div className="p-3 rounded-md bg-muted/50 mb-3">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">Current Device</p>
                      <p className="text-xs text-muted-foreground">Chrome on MacOS • San Francisco, CA</p>
                    </div>
                    <Badge>Active Now</Badge>
                  </div>
                </div>
                
                <div className="text-right">
                  <Button variant="outline" className="flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    <span>Logout from all devices</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
