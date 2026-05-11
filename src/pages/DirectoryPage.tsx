import { useState, useEffect, useMemo, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import {
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Search,
  Building,
  MapPin,
  GraduationCap,
  User,
  Users,
  Briefcase,
  Calendar,
  Mail,
  ExternalLink,
  Clock,
  Filter,
  X
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
  connectionStatus?: "connected" | "pending" | "incoming" | "none";
  isVerified?: boolean;
  accountType?: 'alumni' | 'faculty';
}

interface DirectoryFilters {
  industries: string[];
  graduationYears: number[];
  locations: string[];
}

type ConnectionState = AlumniUser["connectionStatus"];

const DEFAULT_INDUSTRIES = [
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "Manufacturing",
  "Retail",
  "Consulting",
];

const DEFAULT_LOCATIONS = [
  "San Francisco, CA",
  "New York, NY",
  "Austin, TX",
  "Chicago, IL",
  "Seattle, WA",
];

const buildDefaultGraduationYears = () =>
  Array.from({ length: 10 }, (_, index) => new Date().getFullYear() - index);

const normalizeText = (value: string) => value.trim().toLowerCase();

const mergeUniqueStrings = (values: Array<string | null | undefined>) => {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const value of values) {
    if (!value) continue;
    const trimmed = value.trim();
    if (!trimmed) continue;

    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    merged.push(trimmed);
  }

  return merged;
};

const mergeUniqueNumbers = (values: Array<number | null | undefined>) => {
  const seen = new Set<number>();
  const merged: number[] = [];

  for (const value of values) {
    if (!Number.isInteger(value)) continue;
    if (!value || value < 1900 || value > 3000) continue;
    if (seen.has(value)) continue;

    seen.add(value);
    merged.push(value);
  }

  return merged;
};

const getConnectionButtonVariant = (status: ConnectionState) => {
  if (status === "connected") return "secondary";
  if (status === "pending" || status === "incoming") return "outline";
  return "default";
};

const getConnectionLabel = (status: ConnectionState) => {
  if (status === "connected") return "Connected";
  if (status === "pending") return "Pending";
  if (status === "incoming") return "Accept Request";
  return "Connect";
};

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
  const [filterOptions, setFilterOptions] = useState<DirectoryFilters>({
    industries: DEFAULT_INDUSTRIES,
    graduationYears: buildDefaultGraduationYears(),
    locations: DEFAULT_LOCATIONS,
  });

  const industries = useMemo(
    () =>
      mergeUniqueStrings([
        filterIndustry,
        ...filterOptions.industries,
        ...DEFAULT_INDUSTRIES,
      ]).slice(0, 12),
    [filterIndustry, filterOptions.industries]
  );

  const graduationYears = useMemo(
    () =>
      mergeUniqueNumbers([
        filterYear,
        ...filterOptions.graduationYears,
        ...buildDefaultGraduationYears(),
      ]).slice(0, 10),
    [filterYear, filterOptions.graduationYears]
  );

  const locations = useMemo(
    () =>
      mergeUniqueStrings([
        filterLocation,
        ...filterOptions.locations,
        ...DEFAULT_LOCATIONS,
      ]).slice(0, 10),
    [filterLocation, filterOptions.locations]
  );

  useEffect(() => {
    const urlSearch = searchParams.get('search') || "";
    setSearchQuery(urlSearch);
  }, [searchParams]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadAlumni();
    }, 250);

    return () => clearTimeout(timeout);
  }, [searchQuery, filterIndustry, filterYear, filterLocation]);

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
      if (filterIndustry) query.industry = filterIndustry;
      if (filterYear) query.graduationYear = String(filterYear);
      if (filterLocation) query.location = filterLocation;
      const response = await apiService.getAlumniDirectory(query);
      
      if (response.success) {
        const rawUsers = response.data || response.users || [];
        // Deduplicate users by ID to prevent UI errors and duplicate cards
        const uniqueUsers = Array.from(new Map(rawUsers.map((u: any) => [u.id || u._id, u])).values());
        
        setAlumni(uniqueUsers.map((u: any) => ({
          ...u,
          id: u.id || u._id,
          name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Alumni Member',
          profileImage: u.profileImage,
          title: u.jobTitle || u.headline || u.currentRole || u.title,
          company: u.company,
          location: u.location,
          graduationYear: u.graduationYear || (u.admissionYear ? Number(u.admissionYear) : undefined),
          skills: u.skills || [],
          industry: typeof u.industry === 'string' ? u.industry : undefined,
          bio: u.bio,
          isVerified: u.isVerified,
          accountType: u.accountType
        })));

        const apiFilters = response.filters || {};
        const nextIndustries = Array.isArray(apiFilters.industries)
          ? apiFilters.industries.filter((value: unknown): value is string => typeof value === 'string')
          : [];
        const nextLocations = Array.isArray(apiFilters.locations)
          ? apiFilters.locations.filter((value: unknown): value is string => typeof value === 'string')
          : [];
        const nextYears = Array.isArray(apiFilters.graduationYears)
          ? apiFilters.graduationYears
              .map(Number)
              .filter((value: number) => Number.isInteger(value) && value > 1900 && value < 3000)
          : [];

        setFilterOptions({
          industries: mergeUniqueStrings([...nextIndustries, filterIndustry, ...DEFAULT_INDUSTRIES]).slice(0, 12),
          graduationYears: mergeUniqueNumbers([...nextYears, filterYear, ...buildDefaultGraduationYears()]).slice(0, 10),
          locations: mergeUniqueStrings([...nextLocations, filterLocation, ...DEFAULT_LOCATIONS]).slice(0, 10),
        });
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
      const normalizedQuery = normalizeText(searchQuery);
      const matchesSearch = !searchQuery || 
        normalizeText(person.name || '').includes(normalizedQuery) || 
        normalizeText(person.title || '').includes(normalizedQuery) ||
        normalizeText(person.company || '').includes(normalizedQuery) ||
        normalizeText(person.location || '').includes(normalizedQuery) ||
        normalizeText(person.industry || '').includes(normalizedQuery);
      
      const matchesIndustry = !filterIndustry || normalizeText(person.industry || '') === normalizeText(filterIndustry);
      const matchesYear = !filterYear || person.graduationYear === filterYear;
      const matchesLocation = !filterLocation || normalizeText(person.location || '') === normalizeText(filterLocation);
      
      return matchesSearch && matchesIndustry && matchesYear && matchesLocation;
    }), 
  [alumni, searchQuery, filterIndustry, filterYear, filterLocation]);

  const handleConnection = async (userId: string) => {
    const target = alumni.find((person) => person.id === userId);
    if (!target) return;

    const isDisconnect = target.connectionStatus === "connected";

    try {
      let response;
      if (isDisconnect) {
        response = await apiService.disconnectFromUser(userId);
      } else if (target.connectionStatus === "incoming") {
        response = await apiService.acceptConnectionRequest(userId);
      } else {
        response = await apiService.connectWithUser(userId);
      }

      if (!response.success) {
        toast({
          title: "Error",
          description: response.message || (isDisconnect ? "Failed to disconnect." : "Failed to connect."),
          variant: "destructive",
        });
        return;
      }

      const nextStatus =
        response.data?.connectionStatus ||
        (isDisconnect ? "none" : target.connectionStatus === "incoming" ? "connected" : "pending");
      let toastTitle = "Request Sent";
      let toastDescription = "Connection request sent successfully.";

      if (isDisconnect) {
        toastTitle = "Disconnected";
        toastDescription = "Connection removed successfully.";
      } else if (nextStatus === "connected") {
        toastTitle = "Connected";
        toastDescription = "You are now connected.";
      }

      setAlumni((current) =>
        current.map((person) =>
          person.id === userId
            ? {
                ...person,
                connectionStatus: nextStatus,
              }
            : person
        )
      );

      toast({
        title: toastTitle,
        description: toastDescription,
      });
    } catch (error) {
      console.error("Error updating connection:", error);
      toast({ title: "Error", description: "Failed to update connection.", variant: "destructive" });
    }
  };

  const handleClearFilters = () => {
    setFilterIndustry(null);
    setFilterYear(null);
    setFilterLocation(null);
  };

  let resultsContent: ReactNode;

  if (loading) {
    resultsContent = (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-muted-foreground">Loading alumni directory...</span>
      </div>
    );
  } else if (filteredAlumni.length === 0) {
    resultsContent = (
      <EmptyState
        title="No alumni found"
        description="Try adjusting your search criteria or filters."
        action={{
          label: "Clear Filters",
          onClick: handleClearFilters
        }}
      />
    );
  } else {
    resultsContent = (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {filteredAlumni.map((person) => {
          const connectionStatus = person.connectionStatus || "none";

          return (
            <Card key={person.id} className="overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full border-border/50 bg-card/30 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={person.profileImage} />
                    <AvatarFallback className="bg-primary/10 text-foreground/90">
                      {person.name.split(' ').map((n) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-foreground/90 truncate">{person.name}</h3>
                      {person.isVerified && (
                        <div className="flex-shrink-0" title="Verified Member">
                          <CheckCircle2 className="h-4 w-4 text-blue-500 fill-blue-500/10" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-sm text-muted-foreground line-clamp-1">{person.title}</p>
                      {person.accountType === 'faculty' && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1 bg-purple-50 text-purple-700 border-purple-200 flex-shrink-0">
                          FACULTY
                        </Badge>
                      )}
                    </div>
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
                      <Building className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="line-clamp-1">{person.company}</span>
                    </div>
                  )}
                  
                  {person.location && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{person.location}</span>
                    </div>
                  )}
                  
                  {Boolean(person.graduationYear) && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <GraduationCap className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="line-clamp-1">Class of {person.graduationYear}</span>
                    </div>
                  )}
                </div>
                
                {person.skills && person.skills.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Skills</div>
                    <div className="flex flex-wrap gap-1">
                      {person.skills.map((skill, index) => (
                        <Badge key={`${skill}-${index}`} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100 mt-auto">
                  <Button 
                    size="sm" 
                    className="flex-1 min-w-[100px] h-9"
                    onClick={() => navigate(`/directory/profile/${person.id}`)}
                    variant="outline"
                  >
                    <User className="h-3.5 w-3.5 mr-1.5" />
                    Profile
                  </Button>
                  
                  <Button
                    size="sm"
                    className="flex-1 min-w-[100px] h-9"
                    variant={getConnectionButtonVariant(connectionStatus)}
                    onClick={() => handleConnection(person.id)}
                    disabled={connectionStatus === "pending" || connectionStatus === "connected"}
                  >
                    <Users className="h-3.5 w-3.5 mr-1.5" />
                    {getConnectionLabel(connectionStatus)}
                  </Button>
                  
                  {connectionStatus === "connected" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 min-w-[100px] h-9"
                      onClick={() => navigate(`/messages?user=${person.id}`)}
                    >
                      <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                      Message
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 py-4 sm:p-6">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground/90">Alumni Directory</h1>
        <p className="text-sm sm:text-base text-muted/300 mt-1">Connect with alumni from your school across different industries and graduating classes.</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 sm:mb-8 flex flex-col md:flex-row items-stretch md:items-center gap-3 sm:gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, title, company, location, or industry..."
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
      <div className="mb-6 sm:mb-8 rounded-lg border border-border/60 p-3 sm:p-4">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted/300 mb-2">Filter by Industry</h3>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {industries.map((industry) => (
                <Button
                  key={industry}
                  variant={filterIndustry === industry ? "default" : "outline"}
                  size="sm"
                  className={`h-auto py-1.5 text-xs sm:text-sm ${
                    filterIndustry === industry ? "bg-primary hover:bg-primary/90" : ""
                  }`}
                  onClick={() => setFilterIndustry(filterIndustry === industry ? null : industry)}
                >
                  {industry}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted/300 mb-2">Graduation Year</h3>
            <div className="flex flex-wrap gap-2">
              {graduationYears.map((year) => (
                <Button
                  key={year}
                  variant={filterYear === year ? "default" : "outline"}
                  size="sm"
                  className={`h-auto min-h-9 px-3 py-1.5 text-xs sm:text-sm ${
                    filterYear === year ? "bg-primary hover:bg-primary/90" : ""
                  }`}
                  onClick={() => setFilterYear(filterYear === year ? null : year)}
                >
                  {year}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted/300 mb-2">Location</h3>
            <div className="flex flex-wrap gap-2">
              {locations.map((locationOption) => (
                <Button
                  key={locationOption}
                  variant={filterLocation === locationOption ? "default" : "outline"}
                  size="sm"
                  className={`h-auto min-h-9 px-3 py-1.5 text-xs sm:text-sm whitespace-normal break-words text-left justify-start ${
                    filterLocation === locationOption ? "bg-primary hover:bg-primary/90" : ""
                  }`}
                  onClick={() => setFilterLocation(filterLocation === locationOption ? null : locationOption)}
                >
                  {locationOption}
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
            className="text-foreground hover:text-foreground/90"
          >
            Clear all filters
          </Button>
        )}
      </div>

      {/* Results */}
      {resultsContent}
    </div>
  );
}
