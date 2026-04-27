
import { Outlet, useNavigate, Link } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { MobileNavbar } from "./MobileNavbar";
import { useIsMobile } from "@/hooks/use-mobile";
import { GlobalSearch } from "./GlobalSearch";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, MessageCircle, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useEffect, useMemo, useState } from "react";
import apiService from "@/services/apiService";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  isSeen: boolean;
  createdAt: string;
}

export const MainLayout = () => {
  const isMobile = useIsMobile();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [joiningInviteNotificationId, setJoiningInviteNotificationId] = useState<string | null>(null);
  const { toast } = useToast();

  const showAdminButton = currentUser?.role === "admin" || currentUser?.role === "super_admin";

  const hasNotifications = notifications.length > 0;
  const hasUnseen = unseenCount > 0;

  const sortedNotifications = useMemo(
    () => [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [notifications]
  );

  const loadNotifications = async () => {
    if (!currentUser) return;

    setIsLoadingNotifications(true);
    const response = await apiService.getNotifications(25);

    if (response.success) {
      setNotifications((response.data || []) as NotificationItem[]);
      setUnseenCount(typeof response.unseenCount === 'number' ? response.unseenCount : 0);
    }

    setIsLoadingNotifications(false);
  };

  useEffect(() => {
    if (!currentUser) return;
    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    if (isNotificationOpen) {
      loadNotifications();
    }
  }, [isNotificationOpen]);

  const handleMarkSeen = async (notification: NotificationItem) => {
    if (notification.isSeen) return;

    await apiService.markNotificationSeen(notification.id);
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notification.id ? { ...item, isSeen: true } : item
      )
    );
    setUnseenCount((prev) => Math.max(0, prev - 1));
  };

  const handleDismiss = async (notificationId: string) => {
    const response = await apiService.dismissNotification(notificationId);
    if (!response.success) return;

    setNotifications((prev) => {
      const target = prev.find((item) => item.id === notificationId);
      if (target && !target.isSeen) {
        setUnseenCount((count) => Math.max(0, count - 1));
      }
      return prev.filter((item) => item.id !== notificationId);
    });
  };

  const handleMarkAllSeen = async () => {
    if (!hasUnseen) return;

    const response = await apiService.markAllNotificationsSeen();
    if (!response.success) return;

    setNotifications((prev) => prev.map((item) => ({ ...item, isSeen: true })));
    setUnseenCount(0);
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    await handleMarkSeen(notification);

    setIsNotificationOpen(false);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const getInvitationGroupId = (notification: NotificationItem): string | null => {
    if (!notification.metadata || typeof notification.metadata !== 'object') return null;

    const rawGroupId = notification.metadata.groupId;
    if (typeof rawGroupId !== 'string' || !rawGroupId.trim()) return null;
    return rawGroupId;
  };

  const handleJoinGroupFromNotification = async (notification: NotificationItem) => {
    const groupId = getInvitationGroupId(notification);
    if (!groupId) {
      toast({
        title: 'Invalid invitation',
        description: 'This invitation does not include a valid group reference.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setJoiningInviteNotificationId(notification.id);
      await handleMarkSeen(notification);

      const response = await apiService.joinGroup(groupId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to join group from invitation');
      }

      toast({
        title: 'Joined group',
        description: response.message || 'You have joined the private group.',
      });

      setIsNotificationOpen(false);
      navigate('/groups');
    } catch (error: any) {
      toast({
        title: 'Join failed',
        description: error?.message || 'Could not join the group from invitation.',
        variant: 'destructive',
      });
    } finally {
      setJoiningInviteNotificationId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header - Fixed Top */}
      <header className="h-14 bg-background border-b border-border fixed top-0 left-0 right-0 z-50">
        <div className="h-full px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 shrink-0 group hover:opacity-90 transition-opacity">
            <div className="h-9 w-9 bg-primary rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
              <span className="text-primary-foreground font-extrabold text-lg tracking-tighter">MC</span>
            </div>
            <span className="hidden md:inline-block font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              MPSAJMER CONNECT
            </span>
          </Link>
          
          {/* Global Search - Center */}
          <div className="hidden sm:block flex-1 max-w-md mx-2 md:mx-6">
            <GlobalSearch />
          </div>
          
          {/* Right Controls */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
            <ThemeToggle />

            {showAdminButton && (
              <Button 
                variant="outline" 
                size="sm"
                className="hidden lg:inline-flex border-primary text-foreground hover:bg-primary/10"
                onClick={() => navigate('/admin')}
              >
                Admin Dashboard
              </Button>
            )}
            
            {/* Notification Bell */}
            <Sheet open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-8 w-8 hover:bg-primary/10 hover:text-foreground transition-colors">
                  <Bell className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                  {hasUnseen && (
                    <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                      {unseenCount > 99 ? '99+' : unseenCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[360px] sm:w-[420px]">
                <SheetHeader>
                  <SheetTitle>Notifications</SheetTitle>
                </SheetHeader>

                <div className="mt-6 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {unseenCount} unseen
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={handleMarkAllSeen}
                    disabled={!hasUnseen}
                  >
                    Mark all as seen
                  </Button>
                </div>

                <div className="mt-3 space-y-3">
                  {isLoadingNotifications && !hasNotifications ? (
                    <p className="text-sm text-muted-foreground">Loading notifications...</p>
                  ) : null}

                  {!isLoadingNotifications && !hasNotifications ? (
                    <p className="text-sm text-muted-foreground">No notifications yet.</p>
                  ) : null}

                  {sortedNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`w-full text-left rounded-md border p-3 transition-colors ${
                        notification.isSeen ? 'bg-background' : 'bg-muted/40'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <button
                          className="flex-1 text-left hover:opacity-90"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <p className="text-sm font-medium">{notification.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDismiss(notification.id);
                          }}
                          aria-label="Dismiss notification"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {notification.type === 'group_invitation' && getInvitationGroupId(notification) && (
                        <div className="mt-2 flex justify-end">
                          <Button
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleJoinGroupFromNotification(notification);
                            }}
                            disabled={joiningInviteNotificationId === notification.id}
                          >
                            {joiningInviteNotificationId === notification.id ? 'Joining...' : 'Join Group'}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
            
            {/* Messages */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:inline-flex h-8 w-8 hover:bg-primary/10 hover:text-foreground transition-colors"
              onClick={() => navigate('/messages')}
            >
              <MessageCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            </Button>
            
            {/* Profile Avatar */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/profile')}
              className="p-0 h-8 w-8"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser?.profileImage} />
                <AvatarFallback className="text-xs bg-gray-200">
                  {currentUser?.name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 pt-14">
        {/* Left Sidebar */}
        {!isMobile && <Sidebar />}
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden">
          <div className="p-3 sm:p-4 md:p-6 pb-20 md:pb-6 max-w-5xl mx-auto">
            <Outlet />
          </div>
        </main>
        
        {/* Right Sidebar - Will be added later for specific pages */}
      </div>
      
      <footer className="border-t border-border px-4 py-4 text-center bg-card">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground font-medium">
            &copy; {new Date().getFullYear()} MPSAJMER CONNECT. All rights reserved.
          </p>
          <p className="text-xs text-primary/80 font-semibold tracking-wide uppercase italic">
            Developed by Raghav Agarwal
          </p>
        </div>
      </footer>

      {/* Mobile Navigation */}
      {isMobile && <MobileNavbar />}
    </div>
  );
};
