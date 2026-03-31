
import { Link, useLocation } from "react-router-dom";
import { 
  User, Users, Briefcase, GraduationCap, Home, MessageSquare, MessageCircle,
  BookOpen, Settings, Calendar, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export const Sidebar = () => {
  const location = useLocation();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  
  const navigation = [
    { 
      name: "Home Feed", 
      href: "/dashboard", 
      icon: Home,
      hasHoverAnimation: true
    },
    { 
      name: "Profile", 
      href: "/profile", 
      icon: User 
    },
    { 
      name: "Posts", 
      href: "/posts", 
      icon: MessageSquare
    },
    {
      name: "Messages",
      href: "/messages",
      icon: MessageCircle
    },
    { 
      name: "Groups", 
      href: "/groups", 
      icon: Users 
    },
    { 
      name: "Events", 
      href: "/events", 
      icon: Calendar 
    },
    { 
      name: "Jobs", 
      href: "/jobs", 
      icon: Briefcase 
    },
    { 
      name: "Mentorship", 
      href: "/mentorship", 
      icon: GraduationCap 
    },
    { 
      name: "Directory", 
      href: "/directory", 
      icon: BookOpen
    },
    { 
      name: "Settings", 
      href: "/settings", 
      icon: Settings
    },
    ...(isAdmin
      ? [{ name: "Admin Panel", href: "/admin", icon: Shield }]
      : []),
  ];

  return (
    <div className="w-64 border-r border-border h-[calc(100vh-56px)] bg-card sticky top-14 overflow-y-auto">
      <div className="p-4 flex flex-col space-y-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center space-x-2 p-2 rounded-lg transition-all duration-300 cursor-pointer",
                isActive 
                  ? "bg-primary/10 text-foreground" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                item.hasHoverAnimation && !isActive && "hover:translate-x-1 transform"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5",
                isActive ? "text-foreground" : "text-muted-foreground"
              )} />
              <span className={cn(
                isActive ? "text-foreground font-medium" : ""
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
