
import { Link, useLocation } from "react-router-dom";
import { 
  User, Users, Briefcase, GraduationCap, Home, MessageSquare, 
  BookOpen, Settings, Network, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Sidebar = () => {
  const location = useLocation();
  
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
      name: "Connections", 
      href: "/connections", 
      icon: Network
    },
    { 
      name: "Groups", 
      href: "/groups", 
      icon: Users 
    },
    { 
      name: "Jobs", 
      href: "/jobs", 
      icon: Briefcase 
    },
    { 
      name: "Events", 
      href: "/events", 
      icon: Calendar 
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
  ];

  return (
    <div className="w-64 border-r border-gray-200 h-[calc(100vh-56px)] bg-white">
      <div className="p-4 flex flex-col space-y-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center space-x-2 p-2 rounded-lg transition-all duration-300 cursor-pointer",
                isActive 
                  ? "bg-gray-100 text-orange-500" 
                  : "text-gray-700 hover:bg-gray-100",
                item.hasHoverAnimation && !isActive && "hover:translate-x-1 transform"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5",
                isActive ? "text-orange-500" : "text-gray-600"
              )} />
              <span className={cn(
                isActive ? "text-orange-500 font-medium" : "text-gray-700"
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
