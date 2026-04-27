import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, Send, Users, Lock, Globe, ChevronsUpDown, Check, Link2, Copy } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import apiService from "@/services/apiService";
import { useAuth } from "@/contexts/AuthContext";

interface GroupDiscussionModalProps {
  readonly group: any;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

interface InvitableUser {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  location?: string;
  city?: string;
  country?: string;
  company?: string;
  jobTitle?: string;
}

export function GroupDiscussionModal({ group, isOpen, onClose }: Readonly<GroupDiscussionModalProps>) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [groupDetails, setGroupDetails] = useState<any>(null);
  const [settings, setSettings] = useState({
    name: "",
    description: "",
    category: "",
    privacy: "public",
  });
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [loadingJoinRequests, setLoadingJoinRequests] = useState(false);
  const [respondingRequestId, setRespondingRequestId] = useState<string | null>(null);
  const [invitingMember, setInvitingMember] = useState(false);
  const [invitableUsers, setInvitableUsers] = useState<InvitableUser[]>([]);
  const [loadingInvitableUsers, setLoadingInvitableUsers] = useState(false);
  const [inviteSearchQuery, setInviteSearchQuery] = useState("");
  const [inviteSearchOpen, setInviteSearchOpen] = useState(false);
  const [selectedInviteUser, setSelectedInviteUser] = useState<InvitableUser | null>(null);
  const [creatingInviteLink, setCreatingInviteLink] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState("");
  const [copyingInviteLink, setCopyingInviteLink] = useState(false);

  const groupId = group?.id || group?._id;
  const activeGroup = groupDetails || group || {};
  const members = Array.isArray(activeGroup?.members) ? activeGroup.members : [];

  const isCurrentUserGroupAdmin =
    activeGroup?.creatorId?.toString?.() === currentUser?.id?.toString?.() ||
    activeGroup?.creator?.id?.toString?.() === currentUser?.id?.toString?.();

  const normalizedRole = (currentUser?.role || '').toLowerCase();
  const isWatcher = normalizedRole === 'admin' || normalizedRole === 'super_admin' || normalizedRole === 'moderator';
  const canManageInvites = isCurrentUserGroupAdmin || isWatcher;

  const isCurrentUserMember =
    isCurrentUserGroupAdmin ||
    members.some((member: any) =>
      member?.id?.toString?.() === currentUser?.id?.toString?.() ||
      member?._id?.toString?.() === currentUser?.id?.toString?.()
    );

  useEffect(() => {
    if (isOpen && groupId) {
      void loadGroupDetails();
      void loadMessages();
      if (isCurrentUserGroupAdmin || isWatcher) {
        void loadJoinRequests();
      }
    }
  }, [isOpen, groupId, isCurrentUserGroupAdmin, isWatcher]);

  useEffect(() => {
    if (!isOpen) {
      setInviteSearchOpen(false);
      setInviteSearchQuery("");
      setSelectedInviteUser(null);
      setGeneratedInviteLink("");
      setInvitableUsers([]);
    }
  }, [isOpen, groupId]);

  useEffect(() => {
    if (!inviteSearchOpen || !groupId || !canManageInvites || activeGroup?.privacy !== 'private') return;

    const timeout = setTimeout(() => {
      void loadInvitableUsers(inviteSearchQuery);
    }, 250);

    return () => clearTimeout(timeout);
  }, [inviteSearchQuery, inviteSearchOpen, groupId, canManageInvites, activeGroup?.privacy]);

  const loadGroupDetails = async () => {
    if (!groupId) return;

    try {
      const response = await apiService.getGroup(groupId);
      if (response.success && response.data) {
        const details = response.data;
        setGroupDetails(details);
        setSettings({
          name: details.name || "",
          description: details.description || "",
          category: details.category || "",
          privacy: details.privacy || "public",
        });
      }
    } catch (error) {
      console.error('Error loading group details:', error);
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      if (!groupId) return;
      const response = await apiService.getGroupMessages(groupId);
      if (response.success) {
        setMessages(response.data || []);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadJoinRequests = async () => {
    if (!groupId || (!isCurrentUserGroupAdmin && !isWatcher)) return;

    try {
      setLoadingJoinRequests(true);
      const response = await apiService.getGroupJoinRequests(groupId);
      if (response.success) {
        setJoinRequests(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error loading join requests:', error);
    } finally {
      setLoadingJoinRequests(false);
    }
  };

  const loadInvitableUsers = async (query = '') => {
    if (!groupId || !canManageInvites) return;

    try {
      setLoadingInvitableUsers(true);
      const response = await apiService.getInvitableUsers(groupId, query, 25);
      if (response.success) {
        setInvitableUsers(Array.isArray(response.data) ? response.data : []);
      } else {
        setInvitableUsers([]);
      }
    } catch (error) {
      console.error('Error loading invitable users:', error);
      setInvitableUsers([]);
    } finally {
      setLoadingInvitableUsers(false);
    }
  };

  const handleRespondJoinRequest = async (requestId: string, action: 'approve' | 'reject') => {
    if (!groupId || !isCurrentUserGroupAdmin || respondingRequestId) return;

    try {
      setRespondingRequestId(requestId);
      const response = await apiService.respondToGroupJoinRequest(groupId, requestId, action);
      if (!response.success) {
        throw new Error(response.message || `Failed to ${action} request`);
      }

      toast({
        title: action === 'approve' ? 'Request Approved' : 'Request Rejected',
        description: response.message || `Join request ${action}d successfully.`,
      });

      await Promise.all([loadJoinRequests(), loadGroupDetails()]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || `Failed to ${action} join request`,
        variant: 'destructive',
      });
    } finally {
      setRespondingRequestId(null);
    }
  };

  const handleSaveSettings = async () => {
    if (!groupId || !isCurrentUserGroupAdmin || savingSettings) return;

    try {
      setSavingSettings(true);
      const response = await apiService.updateGroup(groupId, {
        name: settings.name.trim(),
        description: settings.description.trim(),
        category: settings.category.trim(),
        privacy: settings.privacy === 'private' ? 'private' : 'public',
      });

      if (response.success) {
        setGroupDetails(response.data);
        toast({
          title: "Group Updated",
          description: "Group settings have been updated.",
        });
      } else {
        throw new Error(response.message || 'Failed to update group settings');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to update group settings",
        variant: "destructive",
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const handlePostMessage = async () => {
    if (!newMessage.trim() || sending || !isCurrentUserMember) return;
    
    try {
      setSending(true);
      if (!groupId) return;
      const response = await apiService.sendGroupMessage(groupId, newMessage.trim());
      
      if (response.success) {
        setMessages([...(messages || []), response.data]);
        setNewMessage("");
        toast({
          title: "Message Sent",
          description: "Your message has been posted to the group.",
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const getInvitableUserId = (user: InvitableUser | null) => user?.id || user?._id || '';

  const getInvitableUserLabel = (user: InvitableUser | null) => {
    if (!user) return 'Search by name, email, location, company...';

    const primary = user.name || user.email || 'User';
    const secondary = user.email ? ` (${user.email})` : '';
    return `${primary}${secondary}`;
  };

  const handleInviteMember = async () => {
    if (!groupId || !canManageInvites || invitingMember) return;

    const inviteUserId = getInvitableUserId(selectedInviteUser);
    if (!inviteUserId) {
      toast({
        title: 'Select a user',
        description: 'Choose a user from the searchable list to send an invitation.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setInvitingMember(true);
      const response = await apiService.inviteGroupMember(groupId, { userId: inviteUserId });

      if (!response.success) {
        throw new Error(response.message || 'Failed to send invitation');
      }

      setInvitableUsers((prev) => prev.filter((user) => getInvitableUserId(user) !== inviteUserId));
      setSelectedInviteUser(null);
      setInviteSearchQuery('');
      setInviteSearchOpen(false);
      toast({
        title: 'Invitation sent',
        description: response.message || 'The user has been invited to this private group.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to invite user.',
        variant: 'destructive',
      });
    } finally {
      setInvitingMember(false);
    }
  };

  const handleCreateInviteLink = async () => {
    if (!groupId || !canManageInvites || creatingInviteLink) return;

    try {
      setCreatingInviteLink(true);
      const response = await apiService.createGroupInviteLink(groupId);

      if (!response.success || !response.data?.inviteLink) {
        throw new Error(response.message || 'Failed to generate invite link');
      }

      setGeneratedInviteLink(response.data.inviteLink);
      toast({
        title: 'Invite link ready',
        description: 'Share this link with alumni you want to invite.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to generate invite link.',
        variant: 'destructive',
      });
    } finally {
      setCreatingInviteLink(false);
    }
  };

  const handleCopyInviteLink = async () => {
    if (!generatedInviteLink || copyingInviteLink) return;

    try {
      setCopyingInviteLink(true);
      if (!navigator?.clipboard?.writeText) {
        throw new Error('Clipboard API unavailable');
      }

      await navigator.clipboard.writeText(generatedInviteLink);

      toast({
        title: 'Copied',
        description: 'Invite link copied to clipboard.',
      });
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Unable to copy link automatically. You can copy it manually.',
        variant: 'destructive',
      });
    } finally {
      setCopyingInviteLink(false);
    }
  };

  const formatInvitableUserDetails = (user: InvitableUser) => {
    const segments = [user?.location, user?.city, user?.country, user?.company, user?.jobTitle]
      .filter(Boolean)
      .slice(0, 3);

    return segments.length > 0 ? segments.join(' • ') : '';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const getMessageAuthorName = (message: any) => {
    if (message.author?.name) return message.author.name;
    if (message.author?.email) return message.author.email.split('@')[0];
    return 'Unknown User';
  };

  const getMessageAuthorInitial = (message: any) => {
    if (message.author?.name?.[0]) return message.author.name[0].toUpperCase();
    if (message.author?.email?.[0]) return message.author.email[0].toUpperCase();
    return '?';
  };

  const isCurrentUserMessage = (message: any) => {
    const authorMongoId = message.author?._id?.toString();
    const authorId = message.author?.id?.toString();
    const viewerId = currentUser?.id?.toString();
    return authorMongoId === viewerId || authorId === viewerId;
  };

  let messagesContent: React.ReactNode;
  let joinRequestsContent: React.ReactNode;

  if (loading) {
    messagesContent = (
      <div className="flex justify-center items-center h-32">
        <LoadingSpinner />
      </div>
    );
  } else if (messages.length === 0) {
    messagesContent = (
      <div className="text-center py-8 text-muted-foreground">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No messages yet. Be the first to start the conversation!</p>
      </div>
    );
  } else {
    messagesContent = messages.map((message, idx) => {
      const key = message.id || message._id || `msg-${idx}`;
      if (message.messageType === 'system') {
        return (
          <div key={key} className="text-center py-1">
            <span className="inline-block text-xs px-3 py-1 rounded-full bg-muted/40 text-muted-foreground">
              {message.content}
            </span>
          </div>
        );
      }

      return (
        <div key={key} className="flex gap-3 hover:bg-muted/30 p-2 rounded-md transition-colors">
          <Avatar className="h-10 w-10">
            <AvatarImage src={message.author?.profileImage} />
            <AvatarFallback className="bg-primary/10 text-foreground/90 font-medium">
              {getMessageAuthorInitial(message)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex justify-between">
              <h4 className="font-semibold text-foreground">
                {getMessageAuthorName(message)}
                {isCurrentUserMessage(message) && (
                  <span className="text-xs text-foreground/90 font-normal ml-1">(You)</span>
                )}
              </h4>
              <span className="text-xs text-muted/300">
                {formatTimestamp(message.createdAt)}
              </span>
            </div>

            <p className="text-sm mt-1 whitespace-pre-wrap text-foreground/80 leading-relaxed">{message.content}</p>

            {message.replyTo && (
              <div className="bg-muted/30 rounded-lg p-2 mt-2 border-l-2 border-primary/30">
                <p className="text-xs text-muted/300">Replying to a message</p>
              </div>
            )}
          </div>
        </div>
      );
    });
  }

  if (loadingJoinRequests) {
    joinRequestsContent = <p className="text-sm text-muted-foreground">Loading requests...</p>;
  } else if (joinRequests.length === 0) {
    joinRequestsContent = <p className="text-sm text-muted-foreground">No pending requests.</p>;
  } else {
    joinRequestsContent = (
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {joinRequests.map((request) => (
          <div key={request.id} className="rounded-md border p-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={request.requester?.profileImage} />
                <AvatarFallback className="bg-primary/10 text-foreground/90 text-xs font-medium">
                  {(request.requester?.name?.[0] || request.requester?.email?.[0] || '?').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{request.requester?.name || request.requester?.email?.split('@')[0] || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{request.requester?.email || ''}</p>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button
                type="button"
                size="sm"
                disabled={respondingRequestId === request.id}
                onClick={() => handleRespondJoinRequest(request.id, 'approve')}
              >
                Approve
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={respondingRequestId === request.id}
                onClick={() => handleRespondJoinRequest(request.id, 'reject')}
              >
                Reject
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[92vh] flex flex-col rounded-xl">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-foreground">
            {activeGroup?.privacy === 'private' 
              ? <Lock className="h-5 w-5 text-foreground" /> 
              : <Globe className="h-5 w-5 text-foreground" />}
            {activeGroup?.name || 'Group Discussion'}
            {activeGroup?.category && (
              <Badge variant="outline" className="ml-2 border-primary/20 bg-primary/5 text-foreground/80">
                {activeGroup.category}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Group chat with admin, members, and group settings.
          </DialogDescription>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <Users className="h-4 w-4 text-foreground" />
            <span className="font-medium">{activeGroup?.totalMembers || activeGroup?.memberCount || members.length || 0} members</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span>{activeGroup?.privacy === 'private' ? 'Private Group' : 'Public Group'}</span>
            {activeGroup?.creator?.name && (
              <>
                <span className="text-xs text-muted-foreground">•</span>
                <span>Admin: {activeGroup.creator.name}</span>
              </>
            )}
          </div>
          <p className="text-sm mt-2 text-foreground/80 leading-relaxed">{activeGroup?.description || 'No description available.'}</p>
        </DialogHeader>

        <div className="flex-1 py-4 min-h-[420px] grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 overflow-hidden">
          <div className="overflow-y-auto space-y-4 pr-1">
            {isCurrentUserMember ? (
              messagesContent
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Lock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Group chat is visible only to group members.</p>
                <p className="text-sm mt-1">Join this group to view and send messages.</p>
              </div>
            )}
          </div>

          <div className="border rounded-lg p-3 bg-muted/20 overflow-y-auto space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-2 text-foreground">Group Admin</h3>
              {activeGroup?.creator ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={activeGroup.creator.profileImage} />
                    <AvatarFallback className="bg-primary/10 text-foreground/90 font-medium">
                      {(activeGroup.creator.name?.[0] || activeGroup.creator.email?.[0] || '?').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{activeGroup.creator.name || 'Group Admin'}</p>
                    <p className="text-xs text-muted-foreground truncate">{activeGroup.creator.email || ''}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No admin details available.</p>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-2 text-foreground">Members ({members.length})</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {members.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No member list available.</p>
                ) : (
                  members.map((member: any) => {
                    const isAdmin =
                      member?.id?.toString?.() === activeGroup?.creatorId?.toString?.() ||
                      member?.id?.toString?.() === activeGroup?.creator?.id?.toString?.();

                    return (
                      <div key={typeof member === 'string' ? member : (member.id || member._id)} className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={member.profileImage} />
                          <AvatarFallback className="bg-primary/10 text-foreground/90 text-xs font-medium">
                            {(member.name?.[0] || member.email?.[0] || '?').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-sm truncate flex-1">{member.name || member.email?.split('@')[0] || 'Member'}</p>
                        {isAdmin && (
                          <Badge variant="outline" className="text-[10px]">Admin</Badge>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {isCurrentUserGroupAdmin && (
              <div className="space-y-2 border-t pt-3">
                <h3 className="font-semibold text-sm text-foreground">Group Settings</h3>

                <div className="space-y-1">
                  <Label htmlFor="group-name">Name</Label>
                  <Input
                    id="group-name"
                    value={settings.name}
                    onChange={(event) => setSettings((prev) => ({ ...prev, name: event.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="group-category">Category</Label>
                  <Input
                    id="group-category"
                    value={settings.category}
                    onChange={(event) => setSettings((prev) => ({ ...prev, category: event.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="group-privacy">Privacy</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={settings.privacy === 'public' ? 'default' : 'outline'}
                      className="w-full"
                      onClick={() => setSettings((prev) => ({ ...prev, privacy: 'public' }))}
                    >
                      Public
                    </Button>
                    <Button
                      type="button"
                      variant={settings.privacy === 'private' ? 'default' : 'outline'}
                      className="w-full"
                      onClick={() => setSettings((prev) => ({ ...prev, privacy: 'private' }))}
                    >
                      Private
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="group-description">Description</Label>
                  <Textarea
                    id="group-description"
                    value={settings.description}
                    onChange={(event) => setSettings((prev) => ({ ...prev, description: event.target.value }))}
                    className="min-h-[70px]"
                  />
                </div>

                <Button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="w-full"
                >
                  {savingSettings ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            )}

            {canManageInvites && activeGroup?.privacy === 'private' && (
              <div className="space-y-2 border-t pt-3">
                <h3 className="font-semibold text-sm text-foreground">Invite Member</h3>
                <p className="text-xs text-muted-foreground">Invited users receive a notification and can join from there.</p>

                <div className="space-y-2">
                  <Label className="text-xs">Search and invite</Label>
                  <Popover
                    open={inviteSearchOpen}
                    onOpenChange={(open) => {
                      setInviteSearchOpen(open);
                      if (open) {
                        void loadInvitableUsers(inviteSearchQuery);
                      }
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={inviteSearchOpen}
                        className="w-full justify-between"
                      >
                        {getInvitableUserLabel(selectedInviteUser)}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[340px] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          value={inviteSearchQuery}
                          onValueChange={setInviteSearchQuery}
                          placeholder="Search members..."
                        />
                        <CommandList>
                          {loadingInvitableUsers ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">Searching users...</div>
                          ) : (
                            <>
                              <CommandEmpty>No eligible users found.</CommandEmpty>
                              <CommandGroup>
                                {invitableUsers.map((user) => {
                                  const userId = getInvitableUserId(user);
                                  const selectedId = getInvitableUserId(selectedInviteUser);
                                  const isSelected = userId === selectedId;
                                  const details = formatInvitableUserDetails(user);

                                  return (
                                    <CommandItem
                                      key={userId}
                                      value={`${user.name || ''} ${user.email || ''} ${details}`}
                                      onSelect={() => {
                                        setSelectedInviteUser(user);
                                        setInviteSearchOpen(false);
                                      }}
                                      className="items-start"
                                    >
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{user.name || user.email?.split('@')[0] || 'User'}</p>
                                        <p className="text-xs text-muted-foreground truncate">{user.email || 'No email available'}</p>
                                        {details && (
                                          <p className="text-xs text-muted-foreground truncate">{details}</p>
                                        )}
                                      </div>
                                      <Check className={`ml-2 h-4 w-4 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  <Button
                    type="button"
                    onClick={handleInviteMember}
                    disabled={invitingMember || !selectedInviteUser}
                    className="w-full"
                  >
                    {invitingMember ? 'Inviting...' : 'Send Invitation'}
                  </Button>
                </div>

                <div className="space-y-2 border-t pt-3">
                  <Label className="text-xs">Invite with link</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCreateInviteLink}
                      disabled={creatingInviteLink}
                      className="flex-1"
                    >
                      <Link2 className="h-4 w-4 mr-2" />
                      {creatingInviteLink ? 'Generating...' : 'Generate Link'}
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleCopyInviteLink}
                      disabled={!generatedInviteLink || copyingInviteLink}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {copyingInviteLink ? 'Copying...' : 'Copy'}
                    </Button>
                  </div>

                  {generatedInviteLink && (
                    <Input value={generatedInviteLink} readOnly className="text-xs" />
                  )}

                  <p className="text-xs text-muted-foreground">
                    Anyone signed in with this link will receive a private-group invitation notification.
                  </p>
                </div>
              </div>
            )}

            {(isCurrentUserGroupAdmin || isWatcher) && (
              <div className="space-y-2 border-t pt-3">
                <h3 className="font-semibold text-sm text-foreground">
                  Join Requests {isCurrentUserGroupAdmin ? '' : '(Watcher view)'}
                </h3>
                {joinRequestsContent}
              </div>
            )}
          </div>
        </div>
        
        <div className="border-t pt-4">
          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isCurrentUserMember ? "Type your message..." : "Join group to chat"}
              className="flex-1 min-h-[80px] focus:border-primary/30 focus:ring-primary/30 rounded-lg resize-none"
              disabled={!isCurrentUserMember}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handlePostMessage();
                }
              }}
            />
            <Button 
              onClick={handlePostMessage} 
              disabled={!newMessage.trim() || sending || !isCurrentUserMember}
              className="px-4 bg-primary hover:bg-primary/90 text-white transform hover:scale-105 hover:shadow-md transition-all duration-300"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted/300 mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
