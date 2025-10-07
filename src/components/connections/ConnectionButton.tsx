import { useState } from 'react';
import { UserPlus, UserCheck, UserX, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import apiService from '@/services/apiService';

interface ConnectionButtonProps {
  readonly userId: string;
  readonly connectionStatus: 'none' | 'pending' | 'connected' | 'self';
  readonly requestType?: 'sent' | 'received';
  readonly requestId?: string;
  readonly onStatusChange?: (newStatus: string) => void;
  readonly className?: string;
}

export function ConnectionButton({ 
  userId, 
  connectionStatus, 
  requestType, 
  requestId,
  onStatusChange,
  className = ""
}: ConnectionButtonProps) {
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(connectionStatus);
  const { toast } = useToast();

  const updateStatus = (newStatus: string) => {
    setCurrentStatus(newStatus as 'none' | 'pending' | 'connected' | 'self');
    onStatusChange?.(newStatus);
  };

  const handleSendRequest = async () => {
    setLoading(true);
    try {
      const response = await apiService.sendConnectionRequest(userId);
      
      if (response.success) {
        updateStatus('pending');
        toast({
          title: "Connection request sent",
          description: "Your connection request has been sent successfully.",
        });
      } else {
        throw new Error(response.message ?? 'Failed to send connection request');
      }
    } catch (error: unknown) {
      console.error('Send connection request error:', error);
      const message = error instanceof Error ? error.message : 'Failed to send connection request';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!requestId) return;
    
    setLoading(true);
    try {
      const response = await apiService.acceptConnectionRequest(requestId);
      
      if (response.success) {
        updateStatus('connected');
        toast({
          title: "Connection accepted",
          description: "You are now connected with this user.",
        });
      } else {
        throw new Error(response.message ?? 'Failed to accept connection request');
      }
    } catch (error: unknown) {
      console.error('Accept connection request error:', error);
      const message = error instanceof Error ? error.message : 'Failed to accept connection request';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!requestId) return;
    
    setLoading(true);
    try {
      const response = await apiService.rejectConnectionRequest(requestId);
      
      if (response.success) {
        updateStatus('none');
        toast({
          title: "Connection request rejected",
          description: "The connection request has been rejected.",
        });
      } else {
        throw new Error(response.message ?? 'Failed to reject connection request');
      }
    } catch (error: unknown) {
      console.error('Reject connection request error:', error);
      const message = error instanceof Error ? error.message : 'Failed to reject connection request';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveConnection = async () => {
    setLoading(true);
    try {
      const response = await apiService.removeConnection(userId);
      
      if (response.success) {
        updateStatus('none');
        toast({
          title: "Connection removed",
          description: "The connection has been removed.",
        });
      } else {
        throw new Error(response.message ?? 'Failed to remove connection');
      }
    } catch (error: unknown) {
      console.error('Remove connection error:', error);
      const message = error instanceof Error ? error.message : 'Failed to remove connection';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (currentStatus === 'self') {
    return null;
  }

  if (currentStatus === 'connected') {
    return (
      <div className={`flex gap-2 ${className}`}>
        <Button
          variant="outline"
          size="sm"
          disabled
          className="cursor-default"
        >
          <UserCheck className="h-4 w-4 mr-1" />
          Connected
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemoveConnection}
          disabled={loading}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <UserX className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (currentStatus === 'pending') {
    if (requestType === 'received') {
      return (
        <div className={`flex gap-2 ${className}`}>
          <Button
            size="sm"
            onClick={handleAcceptRequest}
            disabled={loading}
          >
            <UserCheck className="h-4 w-4 mr-1" />
            Accept
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRejectRequest}
            disabled={loading}
          >
            <UserX className="h-4 w-4 mr-1" />
            Reject
          </Button>
        </div>
      );
    } else {
      return (
        <Button
          variant="outline"
          size="sm"
          disabled
          className={`cursor-default ${className}`}
        >
          <Send className="h-4 w-4 mr-1" />
          Request Sent
        </Button>
      );
    }
  }

  // Status is 'none'
  return (
    <Button
      size="sm"
      onClick={handleSendRequest}
      disabled={loading}
      className={className}
    >
      <UserPlus className="h-4 w-4 mr-1" />
      Connect
    </Button>
  );
}
