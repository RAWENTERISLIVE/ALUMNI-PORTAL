import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Plus, Laptop, Leaf, GraduationCap, Lightbulb, Lock, Globe, MessageSquare, Trash2 } from "lucide-react";
import { GroupDiscussionModal } from "@/components/groups/GroupDiscussionModal";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { CreateGroupForm } from "@/components/groups/CreateGroupForm";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/services/apiService";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";

const groupCategories = [
  { id: 'all', name: 'All Groups', active: true },
  { id: 'my', name: 'My Groups', active: false },
  { id: 'professional', name: 'Professional', active: false },
  { id: 'social', name: 'Social', active: false },
  { id: 'academic', name: 'Academic', active: false },
  { id: 'regional', name: 'Regional', active: false },
];

const getCategoryIcon = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'tech':
    case 'technology':
      return Laptop;
    case 'sustainability':
    case 'environment':
      return Leaf;
    case 'mentorship':
    case 'education':
      return GraduationCap;
    case 'entrepreneurship':
    case 'business':
      return Lightbulb;
    default:
      return Users;
  }
};

const getCategoryColor = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'tech':
    case 'technology':
      return 'bg-primary/5 text-foreground';
    case 'sustainability':
    case 'environment':
      return 'bg-green-50 text-green-500';
    case 'mentorship':
    case 'education':
      return 'bg-purple-50 text-purple-500';
    case 'entrepreneurship':
    case 'business':
      return 'bg-amber-50 text-amber-500';
    default:
      return 'bg-muted/30 text-muted/300';
  }
};

const getBadgeColor = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'tech':
    case 'technology':
      return 'bg-primary/10 text-blue-800';
    case 'sustainability':
    case 'environment':
      return 'bg-green-100 text-green-800';
    case 'mentorship':
    case 'education':
      return 'bg-purple-100 text-purple-800';
    case 'entrepreneurship':
    case 'business':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-gray-100 text-foreground/90';
  }
};

// Helper function to consistently check if a user is a member of a group
const checkMembership = (member: any, userId: string | undefined): boolean => {
  if (!userId) return false;
  
  // If member is just a string (ID)
  if (typeof member === 'string') {
    return member === userId;
  }
  
  // If member is an object with _id
  if (member?._id) {
    return member._id.toString() === userId.toString();
  }
  
  // If member is an object with id
  if (member?.id) {
    return member.id.toString() === userId.toString();
  }
  
  return false;
};

export default function GroupsPage() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [isDiscussionModalOpen, setIsDiscussionModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingInviteToken, setProcessingInviteToken] = useState(false);

  const normalizedRole = (currentUser?.role || '').toLowerCase();
  const isWatcher = normalizedRole === 'admin' || normalizedRole === 'super_admin' || normalizedRole === 'moderator';
  const isSuperAdmin = normalizedRole === 'super_admin';

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    const inviteToken = searchParams.get('inviteToken');
    if (!inviteToken || processingInviteToken || !currentUser?.id) return;

    const acceptInviteToken = async () => {
      try {
        setProcessingInviteToken(true);
        const response = await apiService.acceptGroupInviteLink(inviteToken);

        if (!response.success) {
          throw new Error(response.message || 'Failed to accept invite link');
        }

        toast({
          title: 'Invite accepted',
          description: response.message || 'You have been invited. Open the group notification to join.',
        });

        await loadGroups();
      } catch (error: any) {
        toast({
          title: 'Invite link invalid',
          description: error?.message || 'This invite link is invalid or expired.',
          variant: 'destructive',
        });
      } finally {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('inviteToken');
        setSearchParams(nextParams, { replace: true });
        setProcessingInviteToken(false);
      }
    };

    void acceptInviteToken();
  }, [searchParams, setSearchParams, toast, currentUser?.id, processingInviteToken]);

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
    groups.filter(group => {
      const matchesSearch = (group.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (group.description?.toLowerCase().includes(searchQuery.toLowerCase()));

      // Check if user is a member by comparing ids or comparing with string values for flexibility
      const checkMembership = (memberId: any, userId: string) => {
        return (
          memberId === userId || 
          memberId?.toString() === userId?.toString() ||
          (memberId?._id && memberId._id === userId) || 
          (memberId?._id && memberId._id?.toString() === userId?.toString()) ||
          (memberId?.id === userId) || 
          (memberId?.id?.toString() === userId?.toString())
        );
      };

      if (selectedCategory === 'all') return matchesSearch;
      
      if (selectedCategory === 'my') {
        // First check if current user is in members array as a string ID
        if (group.members?.includes(currentUser?.id)) {
          return matchesSearch;
        }
        
        // If not, check if current user ID matches any member object's ID
        const isJoined = group.members?.some((member: any) => 
          checkMembership(member, currentUser?.id)
        );
        
        return matchesSearch && isJoined;
      }

      // Handle case sensitivity in category
      return matchesSearch && 
        (group.category?.toLowerCase() === selectedCategory.toLowerCase() ||
         (!group.category && selectedCategory === 'professional')); // Default to professional if no category
    }), [groups, searchQuery, selectedCategory, currentUser]);

  const handleViewDiscussion = (group: any) => {
    setSelectedGroup(group);
    setIsDiscussionModalOpen(true);
  };

  const handleJoinLeaveGroup = async (group: any) => {
    if (!currentUser) {
      toast({ title: "Authentication Error", description: "You must be logged in to join or leave groups.", variant: "destructive" });
      return;
    }

    const isJoined = group.members?.some((member: any) => 
      checkMembership(member, currentUser.id)
    );

    try {
      const groupId = group.id || group._id;
      if (isJoined) {
        const response = await apiService.leaveGroup(groupId);
        if (!response.success) throw new Error(response.message || 'Failed to leave group');
        toast({ title: "Left Group", description: `You have left the "${group.name}" group.` });
      } else {
        const response = await apiService.joinGroup(groupId);
        if (!response.success) throw new Error(response.message || 'Failed to join group');

        if (group.privacy === 'private') {
          toast({ title: "Join Request Sent", description: response.message || `Your request to join "${group.name}" was sent to the admin.` });
        } else {
          toast({ title: "Joined Group", description: response.message || `You have successfully joined the "${group.name}" group.` });
        }
      }
      loadGroups();
    } catch (error: any) {
      console.error('Error joining/leaving group:', error);
      toast({ title: "Error", description: error.message || "An error occurred. Please try again.", variant: "destructive" });
    }
  };

  const handleCreateGroup = async (groupData: any) => {
    try {
      const response = await apiService.createGroup(groupData);
      if (response.success) {
        toast({ title: "Group Created", description: `The "${response.data.name}" group has been created.` });
        setIsCreateGroupModalOpen(false);
        loadGroups();
      } else {
        throw new Error(response.message || "Failed to create group");
      }
    } catch (error: any) {
      console.error('Error creating group:', error);
      toast({ title: "Error", description: `Failed to create group: ${error.message}`, variant: "destructive" });
    }
  };

  const handleDeleteGroup = async (group: any) => {
    if (!isSuperAdmin) {
      toast({ title: "Unauthorized", description: "Only super admin can delete groups.", variant: "destructive" });
      return;
    }

    const shouldDelete = globalThis.confirm(`Delete group "${group.name}"? This action cannot be undone.`);
    if (!shouldDelete) return;

    try {
      const groupId = group.id || group._id;
      const response = await apiService.deleteGroup(groupId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete group');
      }

      toast({ title: "Group Deleted", description: response.message || `"${group.name}" has been deleted.` });
      await loadGroups();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete group.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
        <span className="ml-4 text-muted-foreground">Loading groups...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      {/* Page Header */}
      <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground/90">Alumni Groups</h1>
          <p className="text-md text-muted/300 mt-1">Connect, collaborate, and grow with your alumni community.</p>
      </div>

      {/* Search and Filter Section */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search groups..."
            className="pl-10 pr-4 py-2 w-full rounded-lg border-gray-300 focus:ring-primary/30 focus:border-primary/30"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setIsCreateGroupModalOpen(true)}
            className="bg-primary text-white rounded-lg hover:bg-primary/90 transform hover:scale-105 hover:shadow-lg transition-all duration-300"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </Button>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex items-center space-x-2 mb-8 overflow-x-auto pb-2">
        {groupCategories.map((category) => (
          <Button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            variant={selectedCategory === category.id ? "default" : "outline"}
            className={cn(
              "rounded-full whitespace-nowrap transition-all duration-300",
              selectedCategory === category.id
                ? "bg-primary text-white border-primary shadow-sm"
                : "border-gray-300 text-foreground/80 hover:bg-gray-100 hover:border-gray-400"
            )}
          >
            {category.name}
          </Button>
        ))}
      </div>

      {/* Groups Grid */}
      {filteredGroups.length === 0 ? (
        <EmptyState
          title="No Groups Found"
          description={searchQuery ? "Try adjusting your search or filter." : "Be the first to create a group!"}
          action={{
            label: "Create a New Group",
            onClick: () => setIsCreateGroupModalOpen(true)
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredGroups.map((group) => {
            const IconComponent = getCategoryIcon(group.category);
            // Use the helper function to check membership
            const isJoined = group.members?.some((member: any) => 
              checkMembership(member, currentUser?.id)
            );
            const isPrivate = group.privacy === 'private';

            return (
              <Card
                key={group.id || group._id}
                className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col"
              >
                <CardContent className="p-5 flex-grow">
                  <div className="flex justify-between items-start mb-3">
                     <div className={cn("p-2 rounded-lg inline-block shadow-sm", getCategoryColor(group.category))}>
                        <IconComponent className="h-5 w-5" />
                     </div>
                     <Badge variant={isPrivate ? "destructive" : "secondary"} className="capitalize flex items-center gap-1 font-medium">
                        {isPrivate ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                        {group.privacy}
                     </Badge>
                  </div>

                  <h3 className="text-lg font-bold line-clamp-2 mb-2 h-14 text-foreground hover:text-foreground/90 transition-colors">{group.name}</h3>

                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3 h-16 leading-relaxed">
                    {group.description || "No description available."}
                  </p>

                  <div className="flex items-center justify-between text-sm text-muted/300">
                     <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-foreground" />
                        <span className="font-medium">{group.memberCount || group.members?.length || 0} members</span>
                     </div>
                     <div className="flex -space-x-2 overflow-hidden">
                        {Array.isArray(group.members) && group.members.slice(0, 3).map((member: any, index: number) => (
                           <Avatar key={typeof member === 'string' ? member : (member.id || member._id || index)} className="inline-block h-8 w-8 rounded-full border-2 border-white ring-1 ring-gray-200">
                             <AvatarImage src={typeof member === 'object' ? member.profileImage : undefined} />
                             <AvatarFallback className="bg-primary/10 text-foreground/90 font-medium">
                               {(() => {
                                 if (typeof member === 'object' && member?.name) return member.name[0];
                                 if (typeof member === 'object' && member?.firstName) return member.firstName[0];
                                 return 'A';
                               })()}
                             </AvatarFallback>
                           </Avatar>
                        ))}
                        {(group.memberCount > 3 || (Array.isArray(group.members) && group.members.length > 3)) && (
                           <div className="w-8 h-8 bg-gray-200 border-2 border-white rounded-full flex items-center justify-center text-xs text-foreground/90 font-medium shadow-sm">
                             +{(group.memberCount || group.members.length) - 3}
                           </div>
                        )}
                     </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 bg-muted/30 border-t">
                    <div className="flex w-full gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDiscussion(group)}
                        className={`w-full border-gray-300 hover:border-primary hover:text-foreground/90 transition-colors ${isPrivate && !isJoined && !isWatcher ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isPrivate && !isJoined && !isWatcher}
                      >
                        <MessageSquare className="h-4 w-4 mr-2"/>
                        {isPrivate && !isJoined && !isWatcher ? 'Private' : 'Discuss'}
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleJoinLeaveGroup(group)}
                        className={`w-full ${isJoined 
                          ? 'bg-gray-200 hover:bg-gray-300 text-foreground/90' 
                          : 'bg-primary hover:bg-primary/90 text-white transform hover:scale-105 hover:shadow-sm transition-all duration-300'}`}
                        variant={isJoined ? "secondary" : "default"}
                      >
                        {(() => {
                          if (isJoined) return "Leave";
                          if (isPrivate) return "Request Join";
                          return "Join";
                        })()}
                      </Button>

                      {(isSuperAdmin || 
                        group.creator_id === currentUser?.id || 
                        group.creatorId === currentUser?.id ||
                        group.creator?.id === currentUser?.id ||
                        (Array.isArray(group.members) && group.members.some((m: any) => 
                          (m.id === currentUser?.id || m._id === currentUser?.id) && m.role === 'ADMIN'
                        ))
                      ) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteGroup(group)}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <GroupDiscussionModal
        group={selectedGroup}
        isOpen={isDiscussionModalOpen}
        onClose={() => setIsDiscussionModalOpen(false)}
      />

      <CreateGroupForm
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onSubmit={handleCreateGroup}
      />
    </div>
  );
}
