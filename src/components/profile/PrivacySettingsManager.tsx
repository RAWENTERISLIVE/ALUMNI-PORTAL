import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import apiService from '@/services/apiService';

interface PrivacySettings {
  profileVisibility: 'public' | 'alumni' | 'connections';
  showEmail: boolean;
  showPhone: boolean;
  showBio: boolean;
  showSkills: boolean;
  showInterests: boolean;
  showConnections: boolean;
  allowMessaging: boolean;
  allowConnection: boolean;
  allowProfileSearch: boolean;
}

interface PrivacySettingsManagerProps {
  userId: string;
  initialSettings: Partial<PrivacySettings>;
  isOwnProfile: boolean;
  onSettingsUpdate: (settings: PrivacySettings) => void;
}

export function PrivacySettingsManager({ 
  userId, 
  initialSettings, 
  isOwnProfile, 
  onSettingsUpdate 
}: PrivacySettingsManagerProps) {
  const [settings, setSettings] = useState<PrivacySettings>({
    profileVisibility: 'alumni',
    showEmail: false,
    showPhone: false,
    showBio: true,
    showSkills: true,
    showInterests: true,
    showConnections: true,
    allowMessaging: true,
    allowConnection: true,
    allowProfileSearch: true,
    ...initialSettings,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const initialSettingsWithDefaults = {
      profileVisibility: 'alumni' as const,
      showEmail: false,
      showPhone: false,
      showBio: true,
      showSkills: true,
      showInterests: true,
      showConnections: true,
      allowMessaging: true,
      allowConnection: true,
      allowProfileSearch: true,
      ...initialSettings,
    };
    
    setSettings(initialSettingsWithDefaults);
  }, [initialSettings]);

  const handleSettingChange = (key: keyof PrivacySettings, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.updatePrivacySettings(userId, settings);
      if (response.success) {
        onSettingsUpdate(settings);
        setHasChanges(false);
        toast({
          title: "Privacy settings updated",
          description: "Your privacy settings have been updated successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update privacy settings.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      toast({
        title: "Error",
        description: "Failed to update privacy settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOwnProfile) {
    return null; // Privacy settings are only visible to the profile owner
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Privacy Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Visibility */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Profile Visibility</Label>
          <RadioGroup
            value={settings.profileVisibility}
            onValueChange={(value) => handleSettingChange('profileVisibility', value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="public" id="public" />
              <Label htmlFor="public" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Public - Visible to everyone
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="alumni" id="alumni" />
              <Label htmlFor="alumni" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Alumni Only - Visible to verified alumni
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="connections" id="connections" />
              <Label htmlFor="connections" className="flex items-center gap-2">
                <EyeOff className="h-4 w-4" />
                Connections Only - Visible to your connections
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Contact Information */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Contact Information</Label>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="showEmail">Show email address</Label>
              <Switch
                id="showEmail"
                checked={settings.showEmail}
                onCheckedChange={(checked) => handleSettingChange('showEmail', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="showPhone">Show phone number</Label>
              <Switch
                id="showPhone"
                checked={settings.showPhone}
                onCheckedChange={(checked) => handleSettingChange('showPhone', checked)}
              />
            </div>
          </div>
        </div>

        {/* Profile Sections */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Profile Sections</Label>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="showBio">Show bio</Label>
              <Switch
                id="showBio"
                checked={settings.showBio}
                onCheckedChange={(checked) => handleSettingChange('showBio', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="showSkills">Show skills</Label>
              <Switch
                id="showSkills"
                checked={settings.showSkills}
                onCheckedChange={(checked) => handleSettingChange('showSkills', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="showInterests">Show interests</Label>
              <Switch
                id="showInterests"
                checked={settings.showInterests}
                onCheckedChange={(checked) => handleSettingChange('showInterests', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="showConnections">Show connections</Label>
              <Switch
                id="showConnections"
                checked={settings.showConnections}
                onCheckedChange={(checked) => handleSettingChange('showConnections', checked)}
              />
            </div>
          </div>
        </div>

        {/* Interaction Settings */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Interaction Settings</Label>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="allowMessaging">Allow messaging</Label>
              <Switch
                id="allowMessaging"
                checked={settings.allowMessaging}
                onCheckedChange={(checked) => handleSettingChange('allowMessaging', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="allowConnection">Allow connection requests</Label>
              <Switch
                id="allowConnection"
                checked={settings.allowConnection}
                onCheckedChange={(checked) => handleSettingChange('allowConnection', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="allowProfileSearch">Allow profile in search results</Label>
              <Switch
                id="allowProfileSearch"
                checked={settings.allowProfileSearch}
                onCheckedChange={(checked) => handleSettingChange('allowProfileSearch', checked)}
              />
            </div>
          </div>
        </div>

        {hasChanges && (
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleSaveSettings} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setSettings({
                  profileVisibility: 'alumni',
                  showEmail: false,
                  showPhone: false,
                  showBio: true,
                  showSkills: true,
                  showInterests: true,
                  showConnections: true,
                  allowMessaging: true,
                  allowConnection: true,
                  allowProfileSearch: true,
                  ...initialSettings,
                });
                setHasChanges(false);
              }}
            >
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
