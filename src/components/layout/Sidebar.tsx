
import { Link, useLocation } from "react-router-dom";
import { 
  User, Users, Newspaper, 
  MessageSquare, Briefcase, GraduationCap,
  LogOut, Settings, Home, Shield, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Sidebar = () => {
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  const isSuperAdmin = currentUser?.role === 'super_admin';
  
  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Profile", href: "/profile", icon: User },
    { name: "Directory", href: "/directory", icon: Users },
    { name: "Posts", href: "/posts", icon: Newspaper },
    { name: "Groups", href: "/groups", icon: MessageSquare },
    { name: "Mentorship", href: "/mentorship", icon: GraduationCap },
    { name: "Job Board", href: "/jobs", icon: Briefcase },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const adminNavigation = [
    { 
      name: "Admin Panel", 
      href: "/admin", 
      icon: Shield, 
      badge: isSuperAdmin ? "Super Admin" : "Admin",
      variant: (isSuperAdmin ? "default" : "secondary") as "default" | "secondary"
    },
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
    <div className="hidden md:flex flex-col w-64 bg-sidebar border-r h-screen sticky top-0">
      <div className="p-4 flex justify-center py-8">
        <Link to="/dashboard" className="text-2xl font-bold text-alumni-primary">
          AlumniConnect
        </Link>
      </div>
      
      {/* User profile section */}
      <div className="px-4 py-2 flex flex-col items-center mb-6">
        <Avatar className="h-16 w-16 mb-2">
          <AvatarImage src={currentUser?.profileImage} alt={currentUser?.name} />
          <AvatarFallback>{currentUser?.name ? getInitials(currentUser.name) : "AC"}</AvatarFallback>
        </Avatar>
        <div className="text-center">
          <p className="font-medium">{currentUser?.name}</p>
          <p className="text-xs text-muted-foreground">{currentUser?.email}</p>
          {isAdmin && (
            <Badge variant={isSuperAdmin ? "default" : "secondary"} className="mt-1 text-xs">
              {isSuperAdmin ? "Super Admin" : "Admin"}
            </Badge>
          )}
        </div>
      </div>
      
      {/* Navigation links */}
      <nav className="flex-1 px-2 space-y-1">
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "nav-link",
              location.pathname === item.href ? "active" : ""
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </Link>
        ))}
        
        {/* Admin-only navigation */}
        {isAdmin && (
          <>
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Administration
            </div>
            {adminNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "nav-link",
                  location.pathname === item.href ? "active" : ""
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
                {item.badge && (
                  <Badge variant={item.variant} className="ml-auto text-xs">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            ))}
          </>
        )}
      </nav>
      
      {/* Logout button */}
      <div className="p-4 border-t">
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-center gap-2"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};
