import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Users, Lock, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import apiService from "@/services/apiService";
import { useAuth } from "@/contexts/AuthContext";

interface GroupDiscussionModalProps {
  group: any;
  isOpen: boolean;
  onClose: () => void;
}

export function GroupDiscussionModal({ group, isOpen, onClose }: GroupDiscussionModalProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isOpen && (group?.id || group?._id)) {
      loadMessages();
    }
  }, [isOpen, group?.id, group?._id]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const groupId = group.id || group._id; // Use id if available, fallback to _id
      const response = await apiService.getGroupMessages(groupId);
      if (response.success) {
        setMessages(response.data || []);
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

  const handlePostMessage = async () => {
    if (!newMessage.trim() || sending) return;
    
    try {
      setSending(true);
      const groupId = group.id || group._id; // Use id if available, fallback to _id
      const response = await apiService.sendGroupMessage(groupId, {
        content: newMessage,
        messageType: 'text'
      });
      
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            {group.privacy === 'private' ? <Lock className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
            {group.name}
            <Badge variant="secondary" className="ml-2">{group.category}</Badge>
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <Users className="h-4 w-4" />
            <span>{group.memberCount} members</span>
            <span className="text-xs">•</span>
            <span>{group.privacy === 'private' ? 'Private Group' : 'Public Group'}</span>
          </div>
          <p className="text-sm mt-2">{group.description}</p>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-[400px]">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <LoadingSpinner />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No messages yet. Be the first to start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message._id} className="flex gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={message.author?.profilePicture} />
                  <AvatarFallback>
                    {message.author?.firstName?.[0]}{message.author?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h4 className="font-medium">
                      {message.author?.firstName} {message.author?.lastName}
                      {message.author?._id === currentUser?.id && (
                        <span className="text-xs text-muted-foreground ml-1">(You)</span>
                      )}
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(message.createdAt)}
                    </span>
                  </div>
                  
                  <p className="text-sm mt-1 whitespace-pre-wrap">{message.content}</p>
                  
                  {message.replyTo && (
                    <div className="bg-muted/50 rounded-lg p-2 mt-2 border-l-2 border-primary">
                      <p className="text-xs text-muted-foreground">Replying to a message</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="border-t pt-4">
          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 min-h-[80px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handlePostMessage();
                }
              }}
            />
            <Button 
              onClick={handlePostMessage} 
              disabled={!newMessage.trim() || sending}
              className="px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
