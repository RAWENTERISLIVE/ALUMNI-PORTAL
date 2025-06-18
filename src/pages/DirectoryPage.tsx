import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { 
  Briefcase, 
  MapPin, 
  Search,
  GraduationCap,
  User,
  Filter,
  SortAsc,
  Users
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import apiService from "@/services/apiService";
import { useToast } from "@/hooks/use-toast";

export default function DirectoryPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterYear, setFilterYear] = useState("all-years");
  const [filterLocation, setFilterLocation] = useState("all-locations");
  const [filterIndustry, setFilterIndustry] = useState("all-industries");
  const [sortBy, setSortBy] = useState("name");
  const [alumni, setAlumni] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadAlumniDirectory();
  }, []);

  // Extract unique values for filter options
  const filterOptions = useMemo(() => {
    const years = [...new Set(alumni
      .map(person => person.education?.graduationYear)
      .filter(Boolean)
      .sort((a, b) => b - a)
    )];
    
    const locations = [...new Set(alumni
      .map(person => person.location)
      .filter(Boolean)
      .sort()
    )];
    
    const industries = [...new Set(alumni
      .map(person => person.professionalInfo?.industry || person.professionalInfo?.company)
      .filter(Boolean)
      .sort()
    )];

    return { years, locations, industries };
  }, [alumni]);

  useEffect(() => {
    loadAlumniDirectory();
  }, []);

  const loadAlumniDirectory = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading alumni directory...');
      const response = await apiService.getAlumniDirectory();
      console.log('Alumni directory response:', response);
      
      if (response.success) {
        setAlumni(response.data || []);
        console.log('Alumni data loaded:', response.data?.length || 0, 'items');
      } else {
        setError(response.message || 'Failed to load alumni directory');
        toast({
          title: "Error",
          description: response.message || "Failed to load alumni directory",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading alumni directory:', error);
      setError('Failed to connect to server');
      toast({
        title: "Connection Error",
        description: "Failed to connect to server. Please check your connection.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const filteredAndSortedAlumni = useMemo(() => {
    let filtered = alumni.filter(person => {
      const fullName = `${person.firstName} ${person.lastName}`.toLowerCase();
      const searchTerms = searchQuery.toLowerCase();
      
      const matchesSearchQuery = 
        fullName.includes(searchTerms) ||
        (person.professionalInfo?.company && person.professionalInfo.company.toLowerCase().includes(searchTerms)) ||
        (person.professionalInfo?.title && person.professionalInfo.title.toLowerCase().includes(searchTerms)) ||
        (person.professionalInfo?.industry && person.professionalInfo.industry.toLowerCase().includes(searchTerms)) ||
        (person.education?.degree && person.education.degree.toLowerCase().includes(searchTerms)) ||
        (person.education?.fieldOfStudy && person.education.fieldOfStudy.toLowerCase().includes(searchTerms));
                                
      const matchesYear = filterYear === "all-years" || 
        (person.education?.graduationYear && person.education.graduationYear.toString() === filterYear);
      
      const matchesLocation = filterLocation === "all-locations" || 
        (person.location && person.location.toLowerCase().includes(filterLocation.toLowerCase()));
      
      const matchesIndustry = filterIndustry === "all-industries" ||
        (person.professionalInfo?.industry && person.professionalInfo.industry.toLowerCase().includes(filterIndustry.toLowerCase())) ||
        (person.professionalInfo?.company && person.professionalInfo.company.toLowerCase().includes(filterIndustry.toLowerCase()));
      
      return matchesSearchQuery && matchesYear && matchesLocation && matchesIndustry;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case "year":
          return (b.education?.graduationYear || 0) - (a.education?.graduationYear || 0);
        case "company":
          return (a.professionalInfo?.company || "").localeCompare(b.professionalInfo?.company || "");
        case "location":
          return (a.location || "").localeCompare(b.location || "");
        default:
          return 0;
      }
    });

    return filtered;
  }, [alumni, searchQuery, filterYear, filterLocation, filterIndustry, sortBy]);

  const viewProfile = (id: string) => {
    navigate(`/directory/profile/${id}`);
  };

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Alumni Directory"
          description="Connect with alumni from your school"
        />
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader
          title="Alumni Directory"
          description="Connect with alumni from your school"
        />
        <EmptyState 
          icon={<User className="h-12 w-12 text-muted-foreground" />}
          title="Connection Error"
          description={error}
          action={{
            label: "Try Again",
            onClick: loadAlumniDirectory
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Alumni Directory" 
        description="Find and connect with your fellow alumni"
      />
      
      {/* Search and filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by name, company, role, industry, degree..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SortAsc className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="year">Graduation Year (Recent First)</SelectItem>
                <SelectItem value="company">Company (A-Z)</SelectItem>
                <SelectItem value="location">Location (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger>
                <GraduationCap className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Graduation Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-years">All Years</SelectItem>
                {filterOptions.years.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <Select value={filterLocation} onValueChange={setFilterLocation}>
              <SelectTrigger>
                <MapPin className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-locations">All Locations</SelectItem>
                {filterOptions.locations.map(location => (
                  <SelectItem key={location} value={location}>{location}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <Select value={filterIndustry} onValueChange={setFilterIndustry}>
              <SelectTrigger>
                <Briefcase className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Industry/Company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-industries">All Industries</SelectItem>
                {filterOptions.industries.map(industry => (
                  <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchQuery("");
              setFilterYear("all-years");
              setFilterLocation("all-locations");
              setFilterIndustry("all-industries");
              setSortBy("name");
            }}
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </div>
        
        {/* Results summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>
              Showing {filteredAndSortedAlumni.length} of {alumni.length} alumni
            </span>
          </div>
          {(searchQuery || filterYear !== "all-years" || filterLocation !== "all-locations" || filterIndustry !== "all-industries") && (
            <div className="flex flex-wrap gap-2">
              {searchQuery && (
                <Badge variant="secondary" className="text-xs">
                  Search: {searchQuery}
                </Badge>
              )}
              {filterYear !== "all-years" && (
                <Badge variant="secondary" className="text-xs">
                  Class of {filterYear}
                </Badge>
              )}
              {filterLocation !== "all-locations" && (
                <Badge variant="secondary" className="text-xs">
                  {filterLocation}
                </Badge>
              )}
              {filterIndustry !== "all-industries" && (
                <Badge variant="secondary" className="text-xs">
                  {filterIndustry}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Results */}
      {alumni.length === 0 ? (
        <EmptyState
          title="No alumni in directory"
          description="The alumni directory is currently empty. Check back later!"
        />
      ) : filteredAndSortedAlumni.length === 0 ? (
        <EmptyState
          title="No alumni found"
          description="Try adjusting your search criteria or filters to find alumni."
          action={{
            label: "Clear Filters",
            onClick: () => {
              setSearchQuery("");
              setFilterYear("all-years");
              setFilterLocation("all-locations");
              setFilterIndustry("all-industries");
              setSortBy("name");
            }
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedAlumni.map((person) => (
            <Card 
              key={person._id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => viewProfile(person._id)}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={person.profilePicture} alt={`${person.firstName} ${person.lastName}`} />
                    <AvatarFallback>{person.firstName[0]}{person.lastName[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{person.firstName} {person.lastName}</h3>
                    <p className="text-sm text-muted-foreground">{person.professionalInfo?.title}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  {person.professionalInfo?.company && (
                    <div className="flex items-center">
                      <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{person.professionalInfo.company}</span>
                    </div>
                  )}
                  {person.location && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{person.location}</span>
                    </div>
                  )}
                  {person.education?.graduationYear && (
                    <div className="flex items-center">
                      <GraduationCap className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>Class of {person.education.graduationYear}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {filteredAndSortedAlumni.length === 0 && !loading && (
        <EmptyState 
          icon={<User className="h-12 w-12 text-muted-foreground" />}
          title="No Alumni Found"
          description="No alumni match your current search criteria. Try adjusting your filters."
        />
      )}
    </div>
  );
}
