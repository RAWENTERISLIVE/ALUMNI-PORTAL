
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { MobileNavbar } from "./MobileNavbar";
import { useIsMobile } from "@/hooks/use-mobile";
import { GlobalSearch } from "./GlobalSearch";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { Bell, MessageCircle } from "lucide-react";

export const MainLayout = () => {
  const isMobile = useIsMobile();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const showAdminButton = currentUser?.role === "admin" || currentUser?.role === "super_admin";

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Fixed Top */}
      <header className="h-14 bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="h-full px-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <div className="h-8 w-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AC</span>
            </div>
          </div>
          
          {/* Global Search - Center */}
          <div className="flex-1 max-w-md mx-8">
            <GlobalSearch />
          </div>
          
          {/* Right Controls */}
          <div className="flex items-center space-x-4">
            {showAdminButton && (
              <Button 
                variant="outline" 
                size="sm"
                className="border-orange-500 text-orange-500 hover:bg-orange-50"
                onClick={() => navigate('/admin')}
              >
                Admin Dashboard
              </Button>
            )}
            
            {/* Notification Bell */}
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              <Bell className="h-4 w-4 text-gray-600" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </Button>
            
            {/* Messages */}
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MessageCircle className="h-4 w-4 text-gray-600" />
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
          <div className="p-6 max-w-3xl mx-auto">
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
