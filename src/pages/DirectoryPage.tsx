import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { ConnectionButton } from "@/components/connections/ConnectionButton";
import { 
  MapPin, 
  Search,
  GraduationCap,
  User,
  Filter,
  Building,
  ArrowUpDown,
  Mail,
  ExternalLink
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import apiService from "@/services/apiService";
import { useToast } from "@/hooks/use-toast";
import { ConnectionStatus } from "@/types";

interface AlumniUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
  location?: string;
  education?: {
    admissionYear: string;
  };
  professionalInfo?: {
    company?: string;
    title?: string;
  };
  skills?: string[];
  classYear?: string;
  industry?: string;
}

interface UserConnectionInfo {
  status: ConnectionStatus;
  requestType?: 'sent' | 'received';
  requestId?: string;
}

export default function DirectoryPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [alumni, setAlumni] = useState<AlumniUser[]>([]);
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, UserConnectionInfo>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterIndustry, setFilterIndustry] = useState<string | null>(null);
  const [filterYear, setFilterYear] = useState<number | null>(null);
  const [filterLocation, setFilterLocation] = useState<string | null>(null);

  const industries = [
    "Technology", 
    "Finance", 
    "Healthcare", 
    "Education", 
    "Manufacturing", 
    "Retail", 
    "Consulting"
  ];

  const graduationYears = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
  
  const locations = [
    "San Francisco, CA",
    "New York, NY",
    "Austin, TX",
    "Chicago, IL",
    "Seattle, WA"
  ];

  const loadAlumni = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getUsers({ limit: 50 });
      
      if (response.success && response.data) {
        // Filter out current user and only show approved users
        const approvedUsers = response.data.filter(user => 
          user._id !== currentUser?.id && user.status === 'approved'
        );
        setAlumni(approvedUsers);
        
        // Load connection statuses for each user
        const statuses: Record<string, UserConnectionInfo> = {};
        for (const user of approvedUsers) {
          statuses[user._id] = {
            status: Math.random() > 0.5 ? 'none' : 'connected'
          };
        }
        setConnectionStatuses(statuses);
      }
    } catch (error) {
      console.error("Error loading alumni:", error);
      toast({ title: "Error", description: "Failed to load alumni directory.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, toast]);

  useEffect(() => {
    loadAlumni();
  }, [loadAlumni]);

  const filteredAlumni = useMemo(() => 
    alumni.filter(person => {
      const fullName = `${person.firstName} ${person.lastName}`;
      const matchesSearch = !searchQuery || 
        fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        person.professionalInfo?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.professionalInfo?.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.location?.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesIndustry = !filterIndustry || 
        person.industry === filterIndustry ||
        person.professionalInfo?.company?.toLowerCase().includes(filterIndustry.toLowerCase());
        
      const matchesYear = !filterYear || 
        parseInt(person.education?.admissionYear ?? '0') === filterYear ||
        parseInt(person.classYear ?? '0') === filterYear;
        
      const matchesLocation = !filterLocation || 
        person.location?.includes(filterLocation) ||
        person.location?.toLowerCase().includes(filterLocation.toLowerCase());
      
      return matchesSearch && matchesIndustry && matchesYear && matchesLocation;
    }), 
  [alumni, searchQuery, filterIndustry, filterYear, filterLocation]);

  const handleClearFilters = () => {
    setFilterIndustry(null);
    setFilterYear(null);
    setFilterLocation(null);
  };

  // Helper callback to reduce nesting and fix typing
  const handleConnectionStatusChange = useCallback((personId: string, newStatus: string) => {
    setConnectionStatuses(prev => ({
      ...prev,
      [personId]: { 
        status: newStatus as ConnectionStatus
      }
    }));
  }, []);

  // Helper function to render content based on loading and data state
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600">Loading alumni directory...</span>
        </div>
      );
    }

    if (filteredAlumni.length === 0) {
      return (
        <EmptyState
          title="No alumni found"
          description="Try adjusting your search criteria or filters."
          action={{
            label: "Clear Filters",
            onClick: handleClearFilters
          }}
        />
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAlumni.map(person => {
          const connectionStatus = connectionStatuses[person._id];
          const fullName = `${person.firstName} ${person.lastName}`;
          return (
            <Card key={person._id} className="overflow-hidden hover:shadow-lg transition-all duration-300 border-slate-200 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-16 w-16 border-2 border-orange-100">
                    <AvatarImage src={person.profilePicture} />
                    <AvatarFallback className="bg-orange-100 text-orange-800 font-semibold text-lg">
                      {person.firstName?.[0]}{person.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 text-lg">{fullName}</h3>
                    <p className="text-slate-600 font-medium">{person.professionalInfo?.title ?? 'Alumni'}</p>
                    {person.industry && (
                      <Badge variant="secondary" className="mt-1 text-xs bg-orange-50 text-orange-700">
                        {person.industry}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3 mb-4">
                  {person.professionalInfo?.company && (
                    <div className="flex items-center text-sm text-slate-600">
                      <Building className="h-4 w-4 mr-3 text-slate-400" />
                      <span className="font-medium">{person.professionalInfo.company}</span>
                    </div>
                  )}
                  
                  {person.location && (
                    <div className="flex items-center text-sm text-slate-600">
                      <MapPin className="h-4 w-4 mr-3 text-slate-400" />
                      <span>{person.location}</span>
                    </div>
                  )}
                  
                  {(person.education?.admissionYear || person.classYear) && (
                    <div className="flex items-center text-sm text-slate-600">
                      <GraduationCap className="h-4 w-4 mr-3 text-slate-400" />
                      <span>Class of {person.education?.admissionYear ?? person.classYear}</span>
                    </div>
                  )}

                  {person.skills && person.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {person.skills.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs border-slate-300 text-slate-600">
                          {skill}
                        </Badge>
                      ))}
                      {person.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs border-slate-300 text-slate-500">
                          +{person.skills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 pt-4 border-t border-slate-100">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1 border-slate-300 hover:bg-slate-50"
                    onClick={() => navigate(`/directory/profile/${person._id}`)}
                  >
                    <User className="h-3 w-3 mr-2" />
                    View Profile
                  </Button>
                  
                  {person._id !== currentUser?.id && (
                    <ConnectionButton
                      userId={person._id}
                      connectionStatus={connectionStatus?.status || 'none'}
                      requestType={connectionStatus?.requestType}
                      requestId={connectionStatus?.requestId}
                      onStatusChange={(newStatus) => handleConnectionStatusChange(person._id, newStatus)}
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    />
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="ghost" className="flex-1 text-xs">
                    <Mail className="h-3 w-3 mr-1" />
                    Message
                  </Button>
                  <Button size="sm" variant="ghost" className="flex-1 text-xs">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    LinkedIn
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Alumni Directory</h1>
        <p className="text-md text-gray-500 mt-1">Connect with alumni from your school across different industries and graduating classes.</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by name, title, or company..."
            className="pl-10 pr-4 py-2 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <ArrowUpDown className="h-4 w-4" />
            <span>Sort</span>
          </Button>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Filter by Industry</h3>
            <div className="flex flex-wrap gap-2">
              {industries.map(industry => (
                <Button
                  key={industry}
                  variant={filterIndustry === industry ? "default" : "outline"}
                  size="sm"
                  className={filterIndustry === industry ? "bg-orange-500 hover:bg-orange-600" : ""}
                  onClick={() => setFilterIndustry(filterIndustry === industry ? null : industry)}
                >
                  {industry}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Graduation Year</h3>
            <div className="flex flex-wrap gap-2">
              {graduationYears.slice(0, 5).map(year => (
                <Button
                  key={year}
                  variant={filterYear === year ? "default" : "outline"}
                  size="sm"
                  className={filterYear === year ? "bg-orange-500 hover:bg-orange-600" : ""}
                  onClick={() => setFilterYear(filterYear === year ? null : year)}
                >
                  {year}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Location</h3>
            <div className="flex flex-wrap gap-2">
              {locations.map(location => (
                <Button
                  key={location}
                  variant={filterLocation === location ? "default" : "outline"}
                  size="sm"
                  className={filterLocation === location ? "bg-orange-500 hover:bg-orange-600" : ""}
                  onClick={() => setFilterLocation(filterLocation === location ? null : location)}
                >
                  {location}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {Boolean(filterIndustry || filterYear || filterLocation) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-orange-500 hover:text-orange-600"
          >
            Clear all filters
          </Button>
        )}
      </div>

      {/* Results */}
      {renderContent()}
    </div>
  );
}
