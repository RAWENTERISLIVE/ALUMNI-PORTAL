import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Plus, MessageSquare, Lock, Globe } from "lucide-react";
import { GroupDiscussionModal } from "@/components/groups/GroupDiscussionModal";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { CreateGroupForm } from "@/components/groups/CreateGroupForm";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/services/apiService";
import { useAuth } from "@/contexts/AuthContext";

export default function GroupsPage() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [isDiscussionModalOpen, setIsDiscussionModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const response = await apiService.getGroups();
      if (response.success) {
        setGroups(response.data || []);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
      toast({ title: "Error", description: "Failed to load groups.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  
  const filteredGroups = useMemo(() => 
    groups.filter(group =>
      (group.name && group.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (group.description && group.description.toLowerCase().includes(searchQuery.toLowerCase()))
    ), [groups, searchQuery]);

  const handleViewDiscussion = (group: any) => {
    setSelectedGroup(group);
    setIsDiscussionModalOpen(true);
  };

  const handleJoinLeaveGroup = async (group: any) => {
    if (!currentUser) {
      toast({ title: "Authentication Error", description: "You must be logged in to join or leave groups.", variant: "destructive" });
      return;
    }

    const isJoined = group.members.some((member: any) => 
      (member._id === currentUser.id) || (member.id === currentUser.id)
    );

    try {
      const groupId = group.id || group._id; // Use id if available, fallback to _id
      if (isJoined) {
        await apiService.leaveGroup(groupId);
        toast({ title: "Left Group", description: `You have left the "${group.name}" group.` });
      } else {
        await apiService.joinGroup(groupId);
        toast({ title: "Joined Group", description: `You have successfully joined the "${group.name}" group.` });
      }
      loadGroups(); // Refresh groups data
    } catch (error) {
      console.error('Error joining/leaving group:', error);
      toast({ title: "Error", description: "An error occurred. Please try again.", variant: "destructive" });
    }
  };

  const handleCreateGroup = async (groupData: any) => {
    try {
      const response = await apiService.createGroup(groupData);
      if (response.success) {
        toast({ title: "Group Created", description: `The "${response.data.name}" group has been created.` });
        setIsCreateGroupModalOpen(false);
        loadGroups(); // Refresh groups data
      } else {
        throw new Error(response.message || "Failed to create group");
      }
    } catch (error) {
      console.error('Error creating group:', error);
      toast({ title: "Error", description: `Failed to create group: ${error.message}`, variant: "destructive" });
    }
  };
  
  if (loading) {
    return (
      <div>
        <PageHeader 
          title="Alumni Groups" 
          description="Connect with specific alumni communities"
        />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Alumni Groups" 
        description="Connect with specific alumni communities"
        action={<Button className="flex items-center gap-2" onClick={() => setIsCreateGroupModalOpen(true)}><Plus className="h-4 w-4" /> Create Group</Button>}
      />
      
      {/* Search and filters */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search groups by name or description..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {groups.length === 0 ? (
        <EmptyState
          title="No groups yet"
          description="Be the first to create a group and connect with your alumni community!"
          action={{
            label: "Create First Group",
            onClick: () => setIsCreateGroupModalOpen(true)
          }}
        />
      ) : (
        <div>
          {filteredGroups.length === 0 ? (
            <div className="text-center py-10">
              <Users className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <h4 className="text-xl font-medium">No groups found</h4>
              <p className="text-muted-foreground">Try a different search term or create a new group</p>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-medium mb-4">All Groups</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {filteredGroups.map(group => (
                  <GroupCard 
                    key={group._id} 
                    group={group} 
                    isJoined={currentUser ? group.members.some((member: any) => member._id === currentUser.id) : false}
                    onJoin={() => handleJoinLeaveGroup(group)}
                    onViewDiscussion={() => handleViewDiscussion(group)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Group discussion modal */}
      {selectedGroup && (
        <GroupDiscussionModal
          group={selectedGroup}
          isOpen={isDiscussionModalOpen}
          onClose={() => setIsDiscussionModalOpen(false)}
        />
      )}
      
      {/* Create group modal */}
      <CreateGroupForm
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onSubmit={handleCreateGroup}
      />
    </div>
  );
}

function GroupCard({ group, isJoined, onJoin, onViewDiscussion }: { 
  group: any; 
  isJoined: boolean;
  onJoin: () => void;
  onViewDiscussion: () => void;
}) {
  const isPrivate = group.privacy === 'private';
  
  return (
    <Card className="group-card transition-all duration-300 hover:shadow-md hover:-translate-y-1">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <Avatar className="h-12 w-12">
            {group.image ? (
              <AvatarImage src={group.image} alt={group.name} />
            ) : (
              <AvatarFallback className="bg-alumni-primary text-white">
                {group.name.charAt(0)}
              </AvatarFallback>
            )}
          </Avatar>
          
          <div className="flex gap-2">
            <Badge 
              variant={isPrivate ? "destructive" : "secondary"} 
              className="h-6 flex items-center gap-1"
            >
              {isPrivate ? (
                <>
                  <Lock className="h-3 w-3" />
                  Private
                </>
              ) : (
                <>
                  <Globe className="h-3 w-3" />
                  Public
                </>
              )}
            </Badge>
            {group.category && (
              <Badge variant="outline" className="h-6">
                {group.category}
              </Badge>
            )}
          </div>
        </div>
        
        <h4 className="text-lg font-medium mb-1">{group.name}</h4>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{group.description}</p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{group.memberCount || group.members?.length || 0} members</span>
          </div>
          <span>Active {group.lastActivity || 'recently'}</span>
        </div>
      </CardContent>
      
      <CardFooter className="px-4 py-3 pt-0 flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 flex items-center justify-center gap-1"
          onClick={onViewDiscussion}
          disabled={isPrivate && !isJoined}
        >
          <MessageSquare className="h-3 w-3" />
          <span>{isPrivate && !isJoined ? "Private" : "View"}</span>
        </Button>
        <Button 
          size="sm" 
          className="flex-1"
          variant={isJoined ? "secondary" : "default"}
          onClick={onJoin}
          disabled={isPrivate && !isJoined}
        >
          {isPrivate && !isJoined ? "Private Group" : (isJoined ? "Leave" : "Join")}
        </Button>
      </CardFooter>
    </Card>
  );
}
