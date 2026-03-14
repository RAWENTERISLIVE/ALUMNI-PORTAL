
import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { MobileNavbar } from "./MobileNavbar";
import { useIsMobile } from "@/hooks/use-mobile";
import { GlobalSearch } from "./GlobalSearch";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, MessageCircle } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const MainLayout = () => {
  const isMobile = useIsMobile();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const showAdminButton = currentUser?.role === "admin" || currentUser?.role === "super_admin";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header - Fixed Top */}
      <header className="h-14 bg-background border-b border-border fixed top-0 left-0 right-0 z-50">
        <div className="h-full px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo */}
          <div className="flex items-center shrink-0">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">AC</span>
            </div>
          </div>
          
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
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                    3
                  </span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[360px] sm:w-[420px]">
                <SheetHeader>
                  <SheetTitle>Notifications</SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-3">
                  <button
                    className="w-full text-left rounded-md border p-3 hover:bg-muted/40 transition-colors"
                    onClick={() => {
                      setIsNotificationOpen(false);
                      navigate('/groups');
                    }}
                  >
                    <p className="text-sm font-medium">New group activity</p>
                    <p className="text-xs text-muted-foreground mt-1">Someone replied in your alumni group discussion.</p>
                  </button>

                  <button
                    className="w-full text-left rounded-md border p-3 hover:bg-muted/40 transition-colors"
                    onClick={() => {
                      setIsNotificationOpen(false);
                      navigate('/jobs');
                    }}
                  >
                    <p className="text-sm font-medium">Job recommendation</p>
                    <p className="text-xs text-muted-foreground mt-1">A new role matching your profile is available.</p>
                  </button>

                  <button
                    className="w-full text-left rounded-md border p-3 hover:bg-muted/40 transition-colors"
                    onClick={() => {
                      setIsNotificationOpen(false);
                      navigate('/settings');
                    }}
                  >
                    <p className="text-sm font-medium">Notification settings updated</p>
                    <p className="text-xs text-muted-foreground mt-1">Manage email and push preferences in settings.</p>
                  </button>
                </div>
              </SheetContent>
            </Sheet>
            
            {/* Messages */}
            <Button variant="ghost" size="icon" className="hidden sm:inline-flex h-8 w-8 hover:bg-primary/10 hover:text-foreground transition-colors">
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
      <div className="flex pt-14">
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
      
      {/* Mobile Navigation */}
      {isMobile && <MobileNavbar />}
    </div>
  );
};
