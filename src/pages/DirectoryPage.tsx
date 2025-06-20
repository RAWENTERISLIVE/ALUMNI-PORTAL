import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Calendar,
  MessageSquare,
  Users,
  Building,
  Bookmark
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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
  const { toast } = useToast();
  const { currentUser } = useAuth();
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
    loadAlumni();
  }, []);

  const loadAlumni = async () => {
    try {
      setLoading(true);
      // In a real implementation, we'd call the API
      const response = await new Promise<{success: boolean; data: AlumniUser[]}>(resolve => {
        setTimeout(() => {
          resolve({
            success: true,
            data: [
              {
                id: "user1",
                name: "Emily Rodriguez",
                profileImage: "",
                title: "Product Manager",
                company: "Google",
                location: "San Francisco, CA",
                graduationYear: 2020,
                skills: ["Product Strategy", "User Research", "Agile"],
                industry: "Technology",
                connectionStatus: "connected"
              },
              {
                id: "user2",
                name: "Michael Chen",
                profileImage: "",
                title: "Investment Analyst",
                company: "Goldman Sachs",
                location: "New York, NY",
                graduationYear: 2019,
                skills: ["Financial Modeling", "Valuation", "Data Analysis"],
                industry: "Finance",
                connectionStatus: "none"
              },
              {
                id: "user3",
                name: "Sophia Williams",
                profileImage: "",
                title: "Software Engineer",
                company: "Microsoft",
                location: "Seattle, WA",
                graduationYear: 2021,
                skills: ["JavaScript", "React", "Node.js"],
                industry: "Technology",
                connectionStatus: "pending"
              },
              {
                id: "user4",
                name: "David Kim",
                profileImage: "",
                title: "Medical Researcher",
                company: "Mayo Clinic",
                location: "Chicago, IL",
                graduationYear: 2018,
                skills: ["Clinical Trials", "Biostatistics", "Research Methods"],
                industry: "Healthcare",
                connectionStatus: "none"
              },
              {
                id: "user5",
                name: "Olivia Johnson",
                profileImage: "",
                title: "Marketing Director",
                company: "Nike",
                location: "Austin, TX",
                graduationYear: 2017,
                skills: ["Brand Strategy", "Digital Marketing", "Consumer Insights"],
                industry: "Retail",
                connectionStatus: "none"
              }
            ]
          });
        }, 1000);
      });
      
      if (response.success) {
        setAlumni(response.data);
      }
    } catch (error) {
      console.error("Error loading alumni:", error);
      toast({ title: "Error", description: "Failed to load alumni directory.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filteredAlumni = useMemo(() => 
    alumni.filter(person => {
      const matchesSearch = !searchQuery || 
        person.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (person.title && person.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (person.company && person.company.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesIndustry = !filterIndustry || person.industry === filterIndustry;
      const matchesYear = !filterYear || person.graduationYear === filterYear;
      const matchesLocation = !filterLocation || person.location === filterLocation;
      
      return matchesSearch && matchesIndustry && matchesYear && matchesLocation;
    }), 
  [alumni, searchQuery, filterIndustry, filterYear, filterLocation]);

  const handleConnection = async (userId: string) => {
    try {
      // In a real implementation, we'd call the API
      toast({ title: "Connection Request Sent", description: "Your connection request has been sent." });
      
      // Update UI optimistically
      setAlumni(alumni.map(person => 
        person.id === userId 
          ? {...person, connectionStatus: "pending"}
          : person
      ));
    } catch (error) {
      console.error("Error sending connection request:", error);
      toast({ title: "Error", description: "Failed to send connection request.", variant: "destructive" });
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
            <SortAsc className="h-4 w-4" />
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

        {(filterIndustry || filterYear || filterLocation) && (
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
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600">Loading alumni directory...</span>
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
                    <AvatarFallback className="bg-orange-100 text-orange-800">
                      {person.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-800">{person.name}</h3>
                    <p className="text-sm text-gray-600">{person.title}</p>
                    {person.industry && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {person.industry}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3 mb-4">
                  {person.company && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Building className="h-4 w-4 mr-2" />
                      <span>{person.company}</span>
                    </div>
                  )}
                  
                  {person.location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{person.location}</span>
                    </div>
                  )}
                  
                  {person.graduationYear && (
                    <div className="flex items-center text-sm text-gray-600">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      <span>Class of {person.graduationYear}</span>
                    </div>
                  )}
                </div>
                
                {person.skills && person.skills.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-600 mb-1">Skills</div>
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
