import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, Edit2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import apiService from '@/services/apiService';

interface InterestsManagerProps {
  userId: string;
  initialInterests: string[];
  isOwnProfile: boolean;
  onInterestsUpdate: (interests: string[]) => void;
}

export function InterestsManager({ userId, initialInterests, isOwnProfile, onInterestsUpdate }: InterestsManagerProps) {
  const [interests, setInterests] = useState<string[]>(initialInterests || []);
  const [isEditing, setIsEditing] = useState(false);
  const [newInterest, setNewInterest] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAddInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim()) && interests.length < 15) {
      const updatedInterests = [...interests, newInterest.trim()];
      setInterests(updatedInterests);
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interestToRemove: string) => {
    const updatedInterests = interests.filter(interest => interest !== interestToRemove);
    setInterests(updatedInterests);
  };

  const handleSaveInterests = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.updateUserInterests(userId, interests);
      if (response.success) {
        onInterestsUpdate(interests);
        setIsEditing(false);
        toast({
          title: "Interests updated",
          description: "Your interests have been updated successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update interests.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to update interests:', error);
      toast({
        title: "Error",
        description: "Failed to update interests.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setInterests(initialInterests || []);
    setNewInterest('');
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddInterest();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Interests</CardTitle>
        {isOwnProfile && !isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-8 w-8 p-0"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add an interest..."
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                onClick={handleAddInterest}
                disabled={!newInterest.trim() || interests.includes(newInterest.trim()) || interests.length >= 15}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <Badge key={interest} variant="outline" className="flex items-center gap-1">
                  {interest}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveInterest(interest)}
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            
            {interests.length >= 15 && (
              <p className="text-sm text-muted-foreground">
                Maximum of 15 interests allowed.
              </p>
            )}
            
            <div className="flex gap-2">
              <Button onClick={handleSaveInterests} disabled={isLoading} size="sm">
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {interests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {interests.map((interest) => (
                  <Badge key={interest} variant="outline">
                    {interest}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                {isOwnProfile ? 'Add your interests to connect with like-minded alumni.' : 'No interests listed.'}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
