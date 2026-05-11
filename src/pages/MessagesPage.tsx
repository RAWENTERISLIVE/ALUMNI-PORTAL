import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ArrowLeft, MessageSquarePlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import apiService from "@/services/apiService";

interface Conversation {
  userId: string;
  lastMessage: string;
  lastMessageAt: string;
  lastMessageFromMe: boolean;
  unreadCount: number;
  participant: {
    id: string;
    name: string;
    profileImage?: string;
  };
}

interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface PreviewParticipant {
  id: string;
  name: string;
  profileImage?: string;
}

interface MessageableUser {
  id: string;
  name: string;
  email?: string;
  profileImage?: string;
  headline?: string;
  company?: string;
  location?: string;
}

export default function MessagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [previewParticipant, setPreviewParticipant] = useState<PreviewParticipant | null>(null);
  const [draft, setDraft] = useState("");
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [lastInfoMessage, setLastInfoMessage] = useState('');
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null);
  const [dmSearchOpen, setDmSearchOpen] = useState(false);
  const [dmSearchQuery, setDmSearchQuery] = useState("");
  const [dmSearchResults, setDmSearchResults] = useState<MessageableUser[]>([]);
  const [isLoadingDmSearch, setIsLoadingDmSearch] = useState(false);

  const activeConversation = useMemo(
    () => {
      const existingConversation = conversations.find((conversation) => conversation.userId === selectedUserId) || null;
      if (existingConversation) return existingConversation;

      if (!selectedUserId || !previewParticipant || previewParticipant.id !== selectedUserId) {
        return null;
      }

      return {
        userId: previewParticipant.id,
        lastMessage: '',
        lastMessageAt: new Date(0).toISOString(),
        lastMessageFromMe: false,
        unreadCount: 0,
        participant: previewParticipant,
      } as Conversation;
    },
    [conversations, selectedUserId, previewParticipant]
  );

  const loadPreviewParticipant = async (userId: string) => {
    const existing = conversations.find((conversation) => conversation.userId === userId);
    if (existing) {
      setPreviewParticipant(null);
      return;
    }

    const response = await apiService.getUserById(userId);
    if (!response.success || !response.user) {
      return;
    }

    setPreviewParticipant({
      id: response.user.id,
      name: response.user.name,
      profileImage: response.user.profileImage,
    });
  };

  const loadMessageableUsers = async (query = "") => {
    setIsLoadingDmSearch(true);
    const response = await apiService.searchDirectMessageUsers(query, 25);

    if (!response.success) {
      setDmSearchResults([]);
      setIsLoadingDmSearch(false);
      return;
    }

    setDmSearchResults((response.data || []) as MessageableUser[]);
    setIsLoadingDmSearch(false);
  };

  const loadConversations = async () => {
    if (rateLimitedUntil && Date.now() < rateLimitedUntil) {
      return;
    }

    setIsLoadingConversations(true);
    const response = await apiService.getDirectConversations();

    if (response.success && response.message && response.message !== lastInfoMessage) {
      toast({
        title: "Direct messaging status",
        description: response.message,
      });
      setLastInfoMessage(response.message);
    }

    if (!response.success) {
      if ((response.message || '').toLowerCase().includes('too many requests')) {
        setRateLimitedUntil(Date.now() + 30000);
        if (lastInfoMessage !== 'rate-limited') {
          toast({
            title: 'Sync paused briefly',
            description: 'Too many requests detected. Retrying in 30 seconds.',
          });
          setLastInfoMessage('rate-limited');
        }
        setIsLoadingConversations(false);
        return;
      }

      toast({
        title: "Error",
        description: response.message || "Failed to load conversations.",
        variant: "destructive"
      });
      setConversations([]);
      setIsLoadingConversations(false);
      return;
    }

    const nextConversations = (response.data || []) as Conversation[];
    setConversations(nextConversations);

    const queryUser = searchParams.get("user");
    if (queryUser) {
      const targetExists = nextConversations.some((conversation) => conversation.userId === queryUser);
      if (targetExists) {
        setSelectedUserId(queryUser);
        setPreviewParticipant(null);
      } else {
        setSelectedUserId(queryUser);
        await loadPreviewParticipant(queryUser);
      }
    } else if (!selectedUserId && nextConversations.length > 0) {
      setSelectedUserId(nextConversations[0].userId);
    }

    setIsLoadingConversations(false);
  };

  const loadMessages = async (targetUserId: string) => {
    if (rateLimitedUntil && Date.now() < rateLimitedUntil) {
      return;
    }

    setIsLoadingMessages(true);
    const response = await apiService.getDirectMessages(targetUserId);

    if (response.success && response.message && response.message !== lastInfoMessage) {
      toast({
        title: "Direct messaging status",
        description: response.message,
      });
      setLastInfoMessage(response.message);
    }

    if (!response.success) {
      if ((response.message || '').toLowerCase().includes('too many requests')) {
        setRateLimitedUntil(Date.now() + 30000);
        if (lastInfoMessage !== 'rate-limited') {
          toast({
            title: 'Sync paused briefly',
            description: 'Too many requests detected. Retrying in 30 seconds.',
          });
          setLastInfoMessage('rate-limited');
        }
        setIsLoadingMessages(false);
        return;
      }

      toast({
        title: "Error",
        description: response.message || "Failed to load messages.",
        variant: "destructive"
      });
      setMessages([]);
      setIsLoadingMessages(false);
      return;
    }

    setMessages((response.data || []) as DirectMessage[]);
    setIsLoadingMessages(false);
  };

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 30000);
    return () => clearInterval(interval);
  }, [rateLimitedUntil]);

  useEffect(() => {
    const queryUser = searchParams.get("user");
    if (queryUser) {
      setSelectedUserId(queryUser);
      loadPreviewParticipant(queryUser);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!selectedUserId) return;
    loadMessages(selectedUserId);

    const interval = setInterval(() => {
      loadMessages(selectedUserId);
    }, 20000);

    return () => clearInterval(interval);
  }, [selectedUserId, rateLimitedUntil]);

  useEffect(() => {
    if (!dmSearchOpen) return;

    const timeout = setTimeout(() => {
      void loadMessageableUsers(dmSearchQuery);
    }, 250);

    return () => clearTimeout(timeout);
  }, [dmSearchOpen, dmSearchQuery]);

  const handleSelectConversation = (userId: string) => {
    setSelectedUserId(userId);
    setPreviewParticipant(null);
    setSearchParams({ user: userId }, { replace: true });
    setDmSearchOpen(false);
    setDmSearchQuery("");
  };

  const handleBackToConversationList = () => {
    setSelectedUserId(null);
    setPreviewParticipant(null);

    const next = new URLSearchParams(searchParams);
    next.delete('user');
    setSearchParams(next, { replace: true });
  };

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = draft.trim();
    if (!trimmed || !selectedUserId || !currentUser) {
      return;
    }

    setIsSending(true);
    const response = await apiService.sendDirectMessage(selectedUserId, trimmed);

    if (!response.success) {
      toast({
        title: "Error",
        description: response.message || "Failed to send message.",
        variant: "destructive"
      });
      setIsSending(false);
      return;
    }

    const sentMessage = response.data as DirectMessage;
    setMessages((previous) => [...previous, sentMessage]);
    setDraft("");
    setIsSending(false);
    loadConversations();
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground/90">Direct Messages</h1>
        <p className="text-md text-muted-foreground/80 mt-1">Chat one-to-one with your accepted connections.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[70vh]">
        {(!isMobile || !selectedUserId) && (
        <Card className="lg:col-span-1">
          <CardHeader className="space-y-3">
            <CardTitle className="text-base">Conversations</CardTitle>
            <Popover open={dmSearchOpen} onOpenChange={setDmSearchOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquarePlus className="mr-2 h-4 w-4" />
                  Start New Chat
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[calc(100vw-2.5rem)] sm:w-[360px] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search by name, email, location, company..."
                    value={dmSearchQuery}
                    onValueChange={setDmSearchQuery}
                  />
                  <CommandList>
                    {isLoadingDmSearch ? (
                      <div className="py-5 flex justify-center">
                        <LoadingSpinner />
                      </div>
                    ) : (
                      <>
                        <CommandEmpty>No connected users found.</CommandEmpty>
                        <CommandGroup heading="Connections">
                          {dmSearchResults.map((user) => (
                            <CommandItem
                              key={user.id}
                              value={`${user.name} ${user.email || ''} ${user.location || ''} ${user.company || ''}`}
                              onSelect={() => handleSelectConversation(user.id)}
                              className="gap-2"
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.profileImage} />
                                <AvatarFallback>
                                  {user.name
                                    .split(" ")
                                    .map((part) => part[0])
                                    .slice(0, 2)
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{user.name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {[user.headline, user.company, user.location].filter(Boolean).join(" • ") || user.email || "Connected user"}
                                </p>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[60vh] lg:max-h-[65vh] overflow-y-auto">
            {isLoadingConversations ? (
              <div className="py-8 flex justify-center">
                <LoadingSpinner />
              </div>
            ) : conversations.length === 0 && !previewParticipant ? (
              <EmptyState
                title="No conversations"
                description="Start by connecting with alumni and opening chat from the directory."
              />
            ) : (
              [
                ...(previewParticipant && !conversations.some((conversation) => conversation.userId === previewParticipant.id)
                  ? [{
                      userId: previewParticipant.id,
                      lastMessage: "",
                      unreadCount: 0,
                      participant: previewParticipant,
                    }]
                  : []),
                ...conversations,
              ].map((conversation: any) => {
                const isActive = selectedUserId === conversation.userId;

                return (
                  <button
                    key={conversation.userId}
                    type="button"
                    onClick={() => handleSelectConversation(conversation.userId)}
                    className={`w-full text-left p-3 rounded-md border transition-colors ${
                      isActive ? "bg-primary/10 border-primary/30" : "hover:bg-muted/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conversation.participant.profileImage} />
                        <AvatarFallback>
                          {conversation.participant.name
                            .split(" ")
                            .map((part) => part[0])
                            .slice(0, 2)
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{conversation.participant.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{conversation.lastMessage || 'Start a conversation'}</p>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>
        )}

        {(!isMobile || Boolean(selectedUserId)) && (
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center gap-2">
              {isMobile && selectedUserId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleBackToConversationList}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <CardTitle className="text-base">
                {activeConversation ? activeConversation.participant.name : "Select a conversation"}
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 flex flex-col">
            <div className="flex-1 p-4 max-h-[52vh] overflow-y-auto space-y-3">
              {!selectedUserId ? (
                <EmptyState
                  title="No conversation selected"
                  description="Choose a conversation from the left to start messaging."
                />
              ) : isLoadingMessages ? (
                <div className="py-8 flex justify-center">
                  <LoadingSpinner />
                </div>
              ) : messages.length === 0 ? (
                <EmptyState
                  title="No messages yet"
                  description="Send your first message to start the conversation."
                />
              ) : (
                messages.map((message) => {
                  const isMine = String(message.senderId) === String(currentUser?.id);
                  return (
                    <div key={message.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                      <div
                        className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm transition-all duration-200 relative ${
                          isMine 
                            ? "bg-primary text-primary-foreground rounded-tr-none ml-12" 
                            : "bg-muted text-foreground rounded-tl-none mr-12"
                        }`}
                      >
                        {/* Message Tail */}
                        <div className={`absolute top-0 w-3 h-3 ${isMine ? "-right-1 bg-primary" : "-left-1 bg-muted"}`} 
                             style={{ clipPath: isMine ? 'polygon(0 0, 0 100%, 100% 0)' : 'polygon(0 0, 100% 100%, 100% 0)' }}></div>
                        
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        
                        <div className={`flex items-center justify-end gap-1 mt-1 opacity-70`}>
                          <span className="text-[10px]">
                            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMine && (
                            <span className="text-[10px]">
                              {message.isRead ? "✓✓" : "✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
              <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={selectedUserId ? "Type your message..." : "Select a conversation to message"}
                disabled={!selectedUserId || isSending}
              />
              <Button type="submit" disabled={!selectedUserId || isSending || !draft.trim()}>
                Send
              </Button>
            </form>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}
