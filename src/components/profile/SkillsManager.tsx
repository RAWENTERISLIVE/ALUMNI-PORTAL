import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, Edit2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import apiService from '@/services/apiService';

interface SkillsManagerProps {
  userId: string;
  initialSkills: string[];
  isOwnProfile: boolean;
  onSkillsUpdate: (skills: string[]) => void;
}

export function SkillsManager({ userId, initialSkills, isOwnProfile, onSkillsUpdate }: SkillsManagerProps) {
  const [skills, setSkills] = useState<string[]>(initialSkills || []);
  const [isEditing, setIsEditing] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim()) && skills.length < 20) {
      const updatedSkills = [...skills, newSkill.trim()];
      setSkills(updatedSkills);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const updatedSkills = skills.filter(skill => skill !== skillToRemove);
    setSkills(updatedSkills);
  };

  const handleSaveSkills = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.updateUserSkills(userId, skills);
      if (response.success) {
        onSkillsUpdate(skills);
        setIsEditing(false);
        toast({
          title: "Skills updated",
          description: "Your skills have been updated successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update skills.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to update skills:', error);
      toast({
        title: "Error",
        description: "Failed to update skills.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setSkills(initialSkills || []);
    setNewSkill('');
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Skills</CardTitle>
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
                placeholder="Add a skill..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                onClick={handleAddSkill}
                disabled={!newSkill.trim() || skills.includes(newSkill.trim()) || skills.length >= 20}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                  {skill}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSkill(skill)}
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            
            {skills.length >= 20 && (
              <p className="text-sm text-muted-foreground">
                Maximum of 20 skills allowed.
              </p>
            )}
            
            <div className="flex gap-2">
              <Button onClick={handleSaveSkills} disabled={isLoading} size="sm">
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                {isOwnProfile ? 'Add your skills to help others find you.' : 'No skills listed.'}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
