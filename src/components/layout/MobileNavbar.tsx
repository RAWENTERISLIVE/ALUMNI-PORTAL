
import { Link, useLocation } from "react-router-dom";
import { 
  Home, User, Users, MessageSquare, 
  Briefcase, Menu, GraduationCap, Shield, BarChart3, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export const MobileNavbar = () => {
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const [open, setOpen] = useState(false);
  
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  const isSuperAdmin = currentUser?.role === 'super_admin';
  
  const navigation = [
    { name: "Home", href: "/dashboard", icon: Home },
    { name: "Directory", href: "/directory", icon: Users },
    { name: "Groups", href: "/groups", icon: MessageSquare },
    { name: "Jobs", href: "/jobs", icon: Briefcase },
    { name: "Mentors", href: "/mentorship", icon: GraduationCap },
  ];
  
  const allLinks = [
    ...navigation,
    { name: "Profile", href: "/profile", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const adminLinks = [
    { name: "Admin Panel", href: "/admin", icon: Shield },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
  ];
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  return (
    <>
      {/* Bottom navigation bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t flex justify-between items-center px-2 h-16 z-50">
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-3 text-xs",
              location.pathname === item.href
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <item.icon className="h-6 w-6 mb-1" />
            <span>{item.name}</span>
          </Link>
        ))}
        
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <SheetHeader className="pb-6">
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            
            {/* User profile in drawer */}
            {currentUser && (
              <div className="flex items-center space-x-4 mb-8 p-4 border rounded-lg">
                <Avatar>
                  <AvatarImage src={currentUser.profileImage} alt={currentUser.name} />
                  <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{currentUser.name}</p>
                  <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                  {isAdmin && (
                    <Badge variant={isSuperAdmin ? "default" : "secondary"} className="mt-1 text-xs">
                      {isSuperAdmin ? "Super Admin" : "Admin"}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            {/* Navigation links */}
            <div className="space-y-1 py-4">
              {allLinks.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center gap-3 px-4 py-3 text-sm rounded-md hover:bg-muted"
                  onClick={() => setOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
              
              {/* Admin-only links */}
              {isAdmin && (
                <>
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Administration
                  </div>
                  {adminLinks.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="flex items-center gap-3 px-4 py-3 text-sm rounded-md hover:bg-muted"
                      onClick={() => setOpen(false)}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </>
              )}
            </div>
            
            {/* Logout button */}
            <Button
              variant="outline"
              className="w-full mt-6"
              onClick={() => {
                logout();
                setOpen(false);
              }}
            >
              Logout
            </Button>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};
