import { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ConnectionButton } from './ConnectionButton';
import { useToast } from '@/hooks/use-toast';
import apiService from '@/services/apiService';

interface Connection {
  _id: string;
  name: string;
  profileImage?: string;
  jobTitle?: string;
  company?: string;
  city?: string;
  admissionYear?: string;
}

interface ConnectionRequest {
  _id: string;
  sender: {
    _id: string;
    name: string;
    profileImage?: string;
    jobTitle?: string;
    company?: string;
  };
  receiver: {
    _id: string;
    name: string;
    profileImage?: string;
    jobTitle?: string;
    company?: string;
  };
  message?: string;
  status: string;
  createdAt: string;
}

export function ConnectionsList() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<ConnectionRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('connections');
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [connectionsRes, receivedRes, sentRes] = await Promise.all([
        apiService.getUserConnections(),
        apiService.getReceivedConnectionRequests(),
        apiService.getSentConnectionRequests()
      ]);

      if (connectionsRes.success) {
        setConnections(connectionsRes.data ?? []);
      }

      if (receivedRes.success) {
        setReceivedRequests(receivedRes.data ?? []);
      }

      if (sentRes.success) {
        setSentRequests(sentRes.data ?? []);
      }

    } catch (error: unknown) {
      console.error('Load connections error:', error);
      const message = error instanceof Error ? error.message : 'Failed to load connections';
      toast({
        title: "Error loading connections",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Extract callback to reduce nesting
  const handleConnectionRemove = useCallback((connectionId: string) => {
    setConnections(prev => prev.filter(c => c._id !== connectionId));
  }, []);

  const handleRequestUpdate = useCallback((requestId: string, newStatus: string) => {
    if (newStatus === 'connected') {
      // Move from requests to connections
      const request = receivedRequests.find(r => r._id === requestId);
      if (request) {
        const newConnection: Connection = {
          _id: request.sender._id,
          name: request.sender.name,
          profileImage: request.sender.profileImage,
          jobTitle: request.sender.jobTitle,
          company: request.sender.company,
        };
        setConnections(prev => [...prev, newConnection]);
      }
    }
    
    // Remove from received requests
    setReceivedRequests(prev => prev.filter(r => r._id !== requestId));
  }, [receivedRequests]);

  // Helper function to generate user initials
  const getUserInitials = useCallback((name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  }, []);

  // Helper component for connection card
  const renderConnectionCard = useCallback((connection: Connection) => (
    <Card key={connection._id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar>
            <AvatarImage src={connection.profileImage} />
            <AvatarFallback>
              {getUserInitials(connection.name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h3 className="font-medium">{connection.name}</h3>
            {connection.jobTitle && (
              <p className="text-sm text-gray-600">{connection.jobTitle}</p>
            )}
            {connection.company && (
              <p className="text-xs text-gray-500 truncate">{connection.company}</p>
            )}
            {connection.admissionYear && (
              <p className="text-xs text-gray-500">Class of {connection.admissionYear}</p>
            )}
            
            <div className="mt-3">
              <ConnectionButton
                userId={connection._id}
                connectionStatus="connected"
                onStatusChange={() => handleConnectionRemove(connection._id)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  ), [getUserInitials, handleConnectionRemove]);

  // Helper component for received request card
  const renderReceivedRequestCard = useCallback((request: ConnectionRequest) => (
    <Card key={request._id}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar>
            <AvatarImage src={request.sender.profileImage} />
            <AvatarFallback>
              {getUserInitials(request.sender.name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{request.sender.name}</h3>
                {request.sender.jobTitle && (
                  <p className="text-sm text-gray-600">{request.sender.jobTitle}</p>
                )}
                {request.sender.company && (
                  <p className="text-xs text-gray-500">{request.sender.company}</p>
                )}
                {request.message && (
                  <p className="text-sm text-gray-700 mt-2 italic">"{request.message}"</p>
                )}
              </div>
              
              <ConnectionButton
                userId={request.sender._id}
                connectionStatus="pending"
                requestType="received"
                requestId={request._id}
                onStatusChange={(newStatus) => handleRequestUpdate(request._id, newStatus)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  ), [getUserInitials, handleRequestUpdate]);

  // Helper component for sent request card
  const renderSentRequestCard = useCallback((request: ConnectionRequest) => (
    <Card key={request._id}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar>
            <AvatarImage src={request.receiver.profileImage} />
            <AvatarFallback>
              {getUserInitials(request.receiver.name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{request.receiver.name}</h3>
                {request.receiver.jobTitle && (
                  <p className="text-sm text-gray-600">{request.receiver.jobTitle}</p>
                )}
                {request.receiver.company && (
                  <p className="text-xs text-gray-500">{request.receiver.company}</p>
                )}
                <Badge variant="outline" className="mt-2">
                  {request.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  ), [getUserInitials]);

  const filteredConnections = connections.filter(connection =>
    connection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    connection.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    connection.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Network</h1>
          <p className="text-gray-600">Manage your professional connections</p>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search connections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connections" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Connections
            {connections.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {connections.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="received" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Requests
            {receivedRequests.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {receivedRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            Sent
            {sentRequests.length > 0 && (
              <Badge variant="outline" className="ml-1">
                {sentRequests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections">
          {filteredConnections.length === 0 ? (
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title="No connections yet"
              description="Start building your network by connecting with alumni and colleagues."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredConnections.map(renderConnectionCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="received">
          {receivedRequests.length === 0 ? (
            <EmptyState
              icon={<UserPlus className="h-12 w-12" />}
              title="No pending requests"
              description="You don't have any pending connection requests."
            />
          ) : (
            <div className="space-y-4">
              {receivedRequests.map(renderReceivedRequestCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent">
          {sentRequests.length === 0 ? (
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title="No sent requests"
              description="You haven't sent any connection requests yet."
            />
          ) : (
            <div className="space-y-4">
              {sentRequests.map(renderSentRequestCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
