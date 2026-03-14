import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Search,
  MapPin,
  GraduationCap,
  Building,
  User,
  Users,
  MessageSquare,
} from "lucide-react";
import apiService from "@/services/apiService";
import { useToast } from "@/hooks/use-toast";

interface AlumniUser {
  id: string;
  name: string;
  profileImage?: string;
  title?: string;
  company?: string;
  location?: string;
  graduationYear?: number;
  skills?: string[];
  industry?: string;
  bio?: string;
  connectionStatus?: "connected" | "pending" | "none";
}

export default function DirectoryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [alumni, setAlumni] = useState<AlumniUser[]>([]);
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

  useEffect(() => {
    const urlSearch = searchParams.get('search') || "";
    setSearchQuery(urlSearch);
  }, [searchParams]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadAlumni();
    }, 250);

    return () => clearTimeout(timeout);
  }, [searchQuery, filterYear, filterLocation]);

  useEffect(() => {
    const currentSearch = searchParams.get('search') || '';
    const normalizedSearch = searchQuery.trim();

    if (currentSearch === normalizedSearch) {
      return;
    }

    const next = new URLSearchParams(searchParams);
    if (normalizedSearch) {
      next.set('search', normalizedSearch);
    } else {
      next.delete('search');
    }
    setSearchParams(next, { replace: true });
  }, [searchQuery, searchParams, setSearchParams]);

  const loadAlumni = async () => {
    try {
      setLoading(true);
      const query: any = {
        limit: 100,
      };
      if (searchQuery) query.search = searchQuery;
      if (filterYear) query.graduationYear = String(filterYear);
      if (filterLocation) query.location = filterLocation;
      const response = await apiService.getAlumniDirectory(query);
      
      if (response.success) {
        const users = response.data || response.users || [];
        setAlumni(users.map((u: any) => ({
          ...u,
          id: u.id || u._id,
          name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Alumni Member',
          profileImage: u.profileImage,
          title: u.jobTitle || u.headline || u.currentRole || u.title,
          company: u.company,
          location: u.location,
          graduationYear: u.graduationYear || (u.admissionYear ? Number(u.admissionYear) : undefined),
          skills: u.skills || [],
          industry: u.industry,
          bio: u.bio
        })));
      }
    } catch (error) {
      console.error("Error loading alumni:", error);
      toast({ description: "Failed to load directory", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filteredAlumni = useMemo(() => 
    alumni.filter(person => {
      const normalizedQuery = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        (person.name || '').toLowerCase().includes(normalizedQuery) || 
        person.title?.toLowerCase().includes(normalizedQuery) ||
        person.company?.toLowerCase().includes(normalizedQuery);
      
      const matchesIndustry = !filterIndustry || person.industry === filterIndustry;
      const matchesYear = !filterYear || person.graduationYear === filterYear;
      const matchesLocation = !filterLocation || person.location === filterLocation;
      
      return matchesSearch && matchesIndustry && matchesYear && matchesLocation;
    }), 
  [alumni, searchQuery, filterIndustry, filterYear, filterLocation]);

  const handleConnection = async (userId: string) => {
    const target = alumni.find((person) => person.id === userId);
    if (!target) return;

    const isDisconnect = target.connectionStatus === "connected";
    const previousState = alumni;

    setAlumni((current) =>
      current.map((person) =>
        person.id === userId
          ? {
              ...person,
              connectionStatus: isDisconnect ? "none" : "connected",
            }
          : person
      )
    );

    try {
      const response = isDisconnect
        ? await apiService.disconnectFromUser(userId)
        : await apiService.connectWithUser(userId);

      if (!response.success) {
        setAlumni(previousState);
        toast({
          title: "Error",
          description: response.message || (isDisconnect ? "Failed to disconnect." : "Failed to connect."),
          variant: "destructive",
        });
        return;
      }

      toast({
        title: isDisconnect ? "Disconnected" : "Connected",
        description: isDisconnect ? "Connection removed successfully." : "Connection request accepted.",
      });
    } catch (error) {
      console.error("Error updating connection:", error);
      setAlumni(previousState);
      toast({ title: "Error", description: "Failed to update connection.", variant: "destructive" });
    }
  };

  const handleClearFilters = () => {
    setFilterIndustry(null);
    setFilterYear(null);
    setFilterLocation(null);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground/90">Alumni Directory</h1>
        <p className="text-md text-muted/300 mt-1">Connect with alumni from your school across different industries and graduating classes.</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, title, or company..."
            className="pl-10 pr-4 py-2 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={handleClearFilters}>Clear</Button>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-muted/300 mb-2">Filter by Industry</h3>
            <div className="flex flex-wrap gap-2">
              {industries.map(industry => (
                <Button
                  key={industry}
                  variant={filterIndustry === industry ? "default" : "outline"}
                  size="sm"
                  className={filterIndustry === industry ? "bg-primary hover:bg-primary/90" : ""}
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
            <h3 className="text-sm font-medium text-muted/300 mb-2">Graduation Year</h3>
            <div className="flex flex-wrap gap-2">
              {graduationYears.slice(0, 5).map(year => (
                <Button
                  key={year}
                  variant={filterYear === year ? "default" : "outline"}
                  size="sm"
                  className={filterYear === year ? "bg-primary hover:bg-primary/90" : ""}
                  onClick={() => setFilterYear(filterYear === year ? null : year)}
                >
                  {year}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="text-sm font-medium text-muted/300 mb-2">Location</h3>
            <div className="flex flex-wrap gap-2">
              {locations.map(location => (
                <Button
                  key={location}
                  variant={filterLocation === location ? "default" : "outline"}
                  size="sm"
                  className={filterLocation === location ? "bg-primary hover:bg-primary/90" : ""}
                  onClick={() => setFilterLocation(filterLocation === location ? null : location)}
                >
                  {location}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {(filterIndustry || filterYear || filterLocation) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-foreground hover:text-foreground/90"
          >
            Clear all filters
          </Button>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-muted-foreground">Loading alumni directory...</span>
        </div>
      ) : filteredAlumni.length === 0 ? (
        <EmptyState
          title="No alumni found"
          description="Try adjusting your search criteria or filters."
          action={{
            label: "Clear Filters",
            onClick: handleClearFilters
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAlumni.map(person => (
            <Card key={person.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={person.profileImage} />
                    <AvatarFallback className="bg-primary/10 text-foreground/90">
                      {person.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-foreground/90">{person.name}</h3>
                    <p className="text-sm text-muted-foreground">{person.title}</p>
                    {person.industry && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {person.industry}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3 mb-4">
                  {person.company && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Building className="h-4 w-4 mr-2" />
                      <span>{person.company}</span>
                    </div>
                  )}
                  
                  {person.location && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{person.location}</span>
                    </div>
                  )}
                  
                  {person.graduationYear && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      <span>Class of {person.graduationYear}</span>
                    </div>
                  )}
                </div>
                
                {person.skills && person.skills.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Skills</div>
                    <div className="flex flex-wrap gap-1">
                      {person.skills.map(skill => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => navigate(`/directory/profile/${person.id}`)}
                    variant="outline"
                  >
                    <User className="h-3 w-3 mr-1" />
                    Profile
                  </Button>
                  
                  <Button
                    size="sm"
                    className="flex-1"
                    variant={person.connectionStatus === "connected" ? "secondary" : 
                             person.connectionStatus === "pending" ? "outline" : "default"}
                    onClick={() => handleConnection(person.id)}
                    disabled={person.connectionStatus === "pending" || person.connectionStatus === "connected"}
                  >
                    <Users className="h-3 w-3 mr-1" />
                    {person.connectionStatus === "connected" ? "Connected" : 
                     person.connectionStatus === "pending" ? "Pending" : "Connect"}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
