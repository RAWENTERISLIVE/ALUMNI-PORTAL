
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { MobileNavbar } from "./MobileNavbar";
import { useIsMobile } from "@/hooks/use-mobile";
import { GlobalSearch } from "./GlobalSearch";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";

export const MainLayout = () => {
  const isMobile = useIsMobile();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const showAdminButton = currentUser?.role === "admin" || currentUser?.role === "super_admin";

  return (
    <div className="flex min-h-screen bg-background">
      {!isMobile && <Sidebar />}
      
      <main className="flex-1 overflow-x-hidden">
        {!isMobile && (
          <div className="border-b sticky top-0 bg-background z-10 px-4 py-3 shadow-sm">
            <div className="container max-w-6xl mx-auto flex justify-between items-center">
              <div className="flex items-center space-x-4">
                {showAdminButton && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-primary text-primary hover:bg-primary/10"
                    onClick={() => navigate('/admin')}
                  >
                    Admin Dashboard
                  </Button>
                )}
                
                <div className="hidden md:block">
                  <GlobalSearch />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-0 right-0 h-2 w-2 bg-primary rounded-full"></span>
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-2"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={currentUser?.profileImage} />
                    <AvatarFallback className="text-xs">
                      {currentUser?.name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline">
                    {currentUser?.name || 'User'}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <div className="container py-4 px-4 md:py-6 md:px-6 lg:py-8 lg:px-8 max-w-6xl mx-auto min-h-[calc(100vh-4rem)]">
          <Outlet />
        </div>
        
        {isMobile && <MobileNavbar />}
      </main>
    </div>
  );
};
