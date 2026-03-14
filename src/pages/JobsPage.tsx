import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Briefcase, 
  Building, 
  MapPin, 
  Clock,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Filter,
  Plus,
  CalendarRange,
  CircleDollarSign,
  GraduationCap,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { JobDetailsModal } from "@/components/jobs/JobDetailsModal";
import { PostJobForm } from "@/components/jobs/PostJobForm";
import apiService from "@/services/apiService";
import { useAuth } from "@/contexts/AuthContext";
import { Job } from "@/types";

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Remote"];
const EXPERIENCE_LEVELS = ["Entry Level", "Mid-Level", "Senior", "Manager", "Executive"];
const SALARY_RANGES = ["$0-50k", "$50-100k", "$100-150k", "$150-200k", "$200k+"];
const JOB_CATEGORIES = ["Technology", "Finance", "Healthcare", "Education", "Marketing", "Engineering"];

export default function JobsPage() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isJobDetailsModalOpen, setIsJobDetailsModalOpen] = useState(false);
  const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  
  // Additional filters
  const [jobTypeFilter, setJobTypeFilter] = useState<string | null>(null);
  const [experienceLevelFilter, setExperienceLevelFilter] = useState<string | null>(null);
  const [salaryRangeFilter, setSalaryRangeFilter] = useState<string | null>(null);
  const [jobCategoryFilter, setJobCategoryFilter] = useState<string | null>(null);
  
  // Saved and applied jobs
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await apiService.getJobs();
      if (response.success) {
        setJobs(response.data as Job[] || []);
        
        // Load saved and applied jobs
        if (currentUser) {
          const savedResponse = await apiService.getSavedJobs();
          if (savedResponse.success && savedResponse.data) {
            setSavedJobs((savedResponse.data as any[]).map((job: any) => job.id));
          }
          
          const appliedResponse = await apiService.getAppliedJobs();
          if (appliedResponse.success && appliedResponse.data) {
            setAppliedJobs((appliedResponse.data as any[]).map((job: any) => job.id));
          }
        }
      }
    } catch (error) {
      console.error("Error loading jobs:", error);
      toast({ title: "Error", description: "Failed to load job listings.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePostJob = async (jobData: any) => {
    try {
      const response = await apiService.createJob(jobData);
      if (response.success) {
        toast({ title: "Success", description: "Job posted successfully." });
        setIsPostJobModalOpen(false);
        loadJobs();
      } else {
        throw new Error(response.message || "Failed to post job");
      }
    } catch (error: any) {
      console.error("Error posting job:", error);
      toast({ title: "Error", description: `Failed to post job: ${error.message}`, variant: "destructive" });
    }
  };

  const handleToggleSaveJob = async (jobId: string) => {
    try {
      const isSaved = savedJobs.includes(jobId);
      
      if (isSaved) {
        await apiService.unsaveJob(jobId);
        setSavedJobs(savedJobs.filter(id => id !== jobId));
        toast({ title: "Removed", description: "Job removed from saved jobs." });
      } else {
        await apiService.saveJob(jobId);
        setSavedJobs([...savedJobs, jobId]);
        toast({ title: "Saved", description: "Job saved to your profile." });
      }
    } catch (error) {
      console.error("Error saving/unsaving job:", error);
      toast({ title: "Error", description: "Failed to update saved jobs.", variant: "destructive" });
    }
  };

  const handleApplyJob = async (jobId: string) => {
    try {
      await apiService.applyToJob(jobId);
      setAppliedJobs([...appliedJobs, jobId]);
      toast({ title: "Applied", description: "Your application has been submitted." });
    } catch (error) {
      console.error("Error applying to job:", error);
      toast({ title: "Error", description: "Failed to submit application.", variant: "destructive" });
    }
  };

  const openJobDetails = (job: Job) => {
    setSelectedJob(job);
    setIsJobDetailsModalOpen(true);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setLocationFilter("");
    setJobTypeFilter(null);
    setExperienceLevelFilter(null);
    setSalaryRangeFilter(null);
    setJobCategoryFilter(null);
  };

  const filteredJobs = useMemo(() => {
    // First, filter according to the active tab
    let filtered = jobs;
    if (activeTab === "saved") {
      filtered = jobs.filter(job => savedJobs.includes(job.id));
    } else if (activeTab === "applied") {
      filtered = jobs.filter(job => appliedJobs.includes(job.id));
    }
    
    // Then apply all other filters
    return filtered.filter(job => {
      const matchesSearch = !searchQuery || 
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (typeof job.company === 'object' && job.company.name 
          ? job.company.name.toLowerCase().includes(searchQuery.toLowerCase()) 
          : String(job.company).toLowerCase().includes(searchQuery.toLowerCase())) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesLocation = !locationFilter || 
        job.location.toLowerCase().includes(locationFilter.toLowerCase());
        
      const matchesJobType = !jobTypeFilter || job.type === jobTypeFilter;
      
      const matchesExperience = !experienceLevelFilter || 
        job.experienceLevel === experienceLevelFilter;
        
      const matchesSalary = !salaryRangeFilter || job.salary === salaryRangeFilter;
      
      const matchesCategory = !jobCategoryFilter || job.category === jobCategoryFilter;
      
      return matchesSearch && matchesLocation && matchesJobType && 
             matchesExperience && matchesSalary && matchesCategory;
    });
  }, [
    jobs, 
    activeTab, 
    savedJobs, 
    appliedJobs, 
    searchQuery, 
    locationFilter, 
    jobTypeFilter, 
    experienceLevelFilter, 
    salaryRangeFilter, 
    jobCategoryFilter
  ]);

  // Helper function to get company name
  const getCompanyName = (job: Job): string => {
    if (typeof job.company === 'object' && job.company && job.company.name) {
      return job.company.name;
    }
    return String(job.company || '');
  };

  // Helper function to get company logo
  const getCompanyLogo = (job: Job): string => {
    if (typeof job.company === 'object' && job.company && job.company.logo) {
      return job.company.logo;
    }
    return '';
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground/90">Alumni Job Board</h1>
        <p className="text-md text-muted-foreground/80 mt-1">Find opportunities and connect with alumni employers.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row items-start gap-3 mb-6">
            <div className="relative flex-grow w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search job titles or keywords..."
                className="pl-10 w-full rounded-lg border-gray-300 focus:ring-primary/30 focus:border-primary/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="relative flex-grow w-full">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Location..."
                className="pl-10 w-full rounded-lg border-gray-300 focus:ring-primary/30 focus:border-primary/30"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            </div>
          </div>
          
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="w-full bg-muted/30 mb-2 p-1 rounded-lg">
              <TabsTrigger 
                value="all" 
                className={`flex-1 ${activeTab === "all" ? "bg-primary text-white" : "hover:text-foreground"}`}
              >
                All Jobs
              </TabsTrigger>
              <TabsTrigger 
                value="saved" 
                className={`flex-1 ${activeTab === "saved" ? "bg-primary text-white" : "hover:text-foreground"}`}
              >
                Saved Jobs
              </TabsTrigger>
              <TabsTrigger 
                value="applied" 
                className={`flex-1 ${activeTab === "applied" ? "bg-primary text-white" : "hover:text-foreground"}`}
              >
                Applied Jobs
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Jobs List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <LoadingSpinner size="lg" />
              <span className="ml-3 text-muted-foreground">Loading jobs...</span>
            </div>
          ) : filteredJobs.length === 0 ? (
            <EmptyState
              title={
                activeTab === "saved" 
                  ? "No saved jobs" 
                  : activeTab === "applied" 
                  ? "No applied jobs" 
                  : "No jobs found"
              }
              description={
                activeTab === "saved" 
                  ? "Save jobs you're interested in to view them later."
                  : activeTab === "applied" 
                  ? "Track your job applications here."
                  : "Try adjusting your filters or search terms."
              }
              action={{
                label: activeTab !== "all" ? "View All Jobs" : "Clear Filters",
                onClick: activeTab !== "all" ? () => setActiveTab("all") : clearFilters
              }}
            />
          ) : (
            <div className="space-y-4">
              {filteredJobs.map(job => {
                const isSaved = savedJobs.includes(job.id);
                const isApplied = appliedJobs.includes(job.id);
                const companyName = getCompanyName(job);
                const companyLogo = getCompanyLogo(job);
                
                return (
                  <Card key={job.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-border rounded-xl">
                    <CardContent className="p-6">
                      <div className="md:flex md:justify-between">
                        <div className="flex gap-4 mb-4 md:mb-0">
                          <Avatar className="h-14 w-14">
                            <AvatarImage src={companyLogo} alt={companyName} />
                            <AvatarFallback className="bg-primary/10 text-foreground/90 text-xl font-medium">
                              {companyName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 
                              className="font-semibold text-lg text-foreground hover:text-foreground/90 cursor-pointer transition-colors"
                              onClick={() => openJobDetails(job)}
                            >
                              {job.title}
                            </h3>
                            <p className="text-muted-foreground font-medium">{companyName}</p>
                            <div className="flex items-center text-sm text-muted-foreground/80 mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span>{job.location}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleSaveJob(job.id)}
                            className={isSaved ? "text-foreground hover:text-foreground/90" : "text-muted-foreground hover:text-muted-foreground/80"}
                          >
                            {isSaved ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
                          </Button>
                          
                          <Button
                            size="sm"
                            variant={isApplied ? "outline" : "default"}
                            className={isApplied 
                              ? "border-green-500 text-green-700 hover:bg-green-50" 
                              : "bg-primary hover:bg-primary/90 text-white transform hover:scale-105 transition-transform"}
                            onClick={() => isApplied ? openJobDetails(job) : handleApplyJob(job.id)}
                          >
                            {isApplied ? "Applied" : "Apply"}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{job.description}</p>
                        
                        <div className="flex flex-wrap gap-2 mb-2">
                          {job.type && (
                            <Badge variant="secondary" className="flex items-center">
                              <Briefcase className="h-3 w-3 mr-1" />
                              {job.type}
                            </Badge>
                          )}
                          
                          {job.salary && (
                            <Badge variant="outline" className="flex items-center">
                              <CircleDollarSign className="h-3 w-3 mr-1" />
                              {job.salary}
                            </Badge>
                          )}
                          
                          {job.postedDate && (
                            <span className="text-xs text-muted-foreground/80 flex items-center">
                              <Clock className="h-3 w-3 mr-1 inline" />
                              Posted {new Date(job.postedDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted/30 px-6 py-3 flex justify-between items-center border-t">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Users className="h-3 w-3 mr-1" />
                        <span>{job.applicationCount || job.applicants?.length || 0} applicants</span>
                        {job.alumni && job.alumni > 0 && (
                          <span className="ml-2 text-foreground/90">
                            • {job.alumni} alumni work here
                          </span>
                        )}
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-sm"
                        onClick={() => openJobDetails(job)}
                      >
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="lg:col-span-1">
          {/* Post Job Button */}
          <Card className="mb-6 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg px-4 py-2 transform hover:scale-105 hover:shadow-lg transition-all duration-300"
                onClick={() => setIsPostJobModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Post a Job
              </Button>
            </CardContent>
          </Card>
          
          {/* Filters Sidebar */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="font-medium text-lg mb-4">Filters</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground/80 mb-1 block">Job Type</label>
                  <div className="flex flex-wrap gap-2">
                    {JOB_TYPES.map(type => (
                      <Button
                        key={type}
                        size="sm"
                        variant={jobTypeFilter === type ? "default" : "outline"}
                        className={jobTypeFilter === type 
                          ? "bg-primary hover:bg-primary/90 text-white" 
                          : "hover:bg-muted/50 text-foreground/80"}
                        onClick={() => setJobTypeFilter(jobTypeFilter === type ? null : type)}
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground/80 mb-1 block">Experience Level</label>
                  <div className="flex flex-wrap gap-2">
                    {EXPERIENCE_LEVELS.map(level => (
                      <Button
                        key={level}
                        size="sm"
                        variant={experienceLevelFilter === level ? "default" : "outline"}
                        className={experienceLevelFilter === level ? "bg-primary" : ""}
                        onClick={() => setExperienceLevelFilter(experienceLevelFilter === level ? null : level)}
                      >
                        {level}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground/80 mb-1 block">Salary Range</label>
                  <div className="flex flex-wrap gap-2">
                    {SALARY_RANGES.map(range => (
                      <Button
                        key={range}
                        size="sm"
                        variant={salaryRangeFilter === range ? "default" : "outline"}
                        className={salaryRangeFilter === range ? "bg-primary" : ""}
                        onClick={() => setSalaryRangeFilter(salaryRangeFilter === range ? null : range)}
                      >
                        {range}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground/80 mb-1 block">Industry / Category</label>
                  <div className="flex flex-wrap gap-2">
                    {JOB_CATEGORIES.map(category => (
                      <Button
                        key={category}
                        size="sm"
                        variant={jobCategoryFilter === category ? "default" : "outline"}
                        className={jobCategoryFilter === category ? "bg-primary" : ""}
                        onClick={() => setJobCategoryFilter(jobCategoryFilter === category ? null : category)}
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {(jobTypeFilter || experienceLevelFilter || salaryRangeFilter || jobCategoryFilter) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full text-foreground hover:text-foreground/90"
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Premium alumni job services */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-medium text-lg mb-2">Alumni Job Services</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get personalized job recommendations and priority application reviews from alumni.
              </p>
              <Button variant="outline" className="w-full">
                Learn More
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Modals */}
      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          isOpen={isJobDetailsModalOpen}
          onClose={() => setIsJobDetailsModalOpen(false)}
          onApply={() => handleApplyJob(selectedJob.id)}
          onSave={() => handleToggleSaveJob(selectedJob.id)}
          isSaved={savedJobs.includes(selectedJob.id)}
          isApplied={appliedJobs.includes(selectedJob.id)}
        />
      )}
      
      <PostJobForm
        isOpen={isPostJobModalOpen}
        onClose={() => setIsPostJobModalOpen(false)}
        onSubmit={handlePostJob}
      />
    </div>
  );
}
