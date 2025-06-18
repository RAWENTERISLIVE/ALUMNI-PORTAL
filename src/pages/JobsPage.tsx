import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  BookmarkPlus,
  DollarSign,
  Calendar,
  Filter,
  SortAsc,
  TrendingUp,
  Users,
  AlertCircle,
  Plus,
  FileText
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { JobDetailsModal } from "@/components/jobs/JobDetailsModal";
import { PostJobForm } from "@/components/jobs/PostJobForm";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import apiService from "@/services/apiService";
import { Job, ApiResponse, PaginatedResponse } from "@/types";

export default function JobsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedJobsLoading, setSavedJobsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  
  // Current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Load jobs on component mount
  useEffect(() => {
    loadJobs();
  }, [filterType, filterLocation, searchQuery]);

  // Load saved jobs when tab changes
  useEffect(() => {
    if (activeTab === "saved") {
      loadSavedJobs();
    }
  }, [activeTab]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (filterType !== "all") {
        params.type = filterType;
      }
      
      if (filterLocation !== "all") {
        params.location = filterLocation;
      }
      
      if (searchQuery.trim()) {
        params.company = searchQuery.trim();
      }

      const response = await apiService.getJobs(params);
      
      if (response.success && Array.isArray(response.data)) {
        setJobs(response.data);
      } else if (response.success && response.data && Array.isArray((response.data as any)?.data)) {
        // Handling potential paginated response, though direct array is preferred
        setJobs((response.data as any).data);
      } else {
        toast({
          title: "Error",
          description: "Failed to load jobs",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast({
        title: "Error",
        description: "Failed to load jobs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSavedJobs = async () => {
    try {
      setSavedJobsLoading(true);
      const response = await apiService.getSavedJobs();
      
      if (response.success && response.data && Array.isArray((response.data as any)?.data)) {
        setSavedJobs((response.data as any).data);
      } else {
        toast({
          title: "Error",
          description: "Failed to load saved jobs",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading saved jobs:', error);
      toast({
        title: "Error",
        description: "Failed to load saved jobs",
        variant: "destructive",
      });
    } finally {
      setSavedJobsLoading(false);
    }
  };

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setIsDetailsModalOpen(true);
  };

  const handleApplyToJob = async (jobId: string) => {
    try {
      const response = await apiService.applyToJob(jobId);
      
      if (response.success) {
        toast({
          title: "Application Submitted",
          description: "Your application has been recorded successfully!",
        });
        // Refresh jobs to update application count
        loadJobs();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to submit application",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error applying to job:', error);
      toast({
        title: "Error",
        description: "Failed to submit application",
        variant: "destructive",
      });
    }
  };

  const handleToggleSaveJob = async (jobId: string) => {
    try {
      const response = await apiService.toggleSaveJob(jobId);
      
      if (response.success) {
        toast({
          title: (response.data as any)?.isSaved ? "Job Saved" : "Job Unsaved",
          description: response.message,
        });
        
        // Refresh both lists
        loadJobs();
        if (activeTab === "saved") {
          loadSavedJobs();
        }
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to save/unsave job",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error toggling save job:', error);
      toast({
        title: "Error",
        description: "Failed to save/unsave job",
        variant: "destructive",
      });
    }
  };

  const handleJobCreated = (newJob: Job) => {
    setJobs(prev => [newJob, ...prev]);
    setIsPostJobModalOpen(false);
    toast({
      title: "Success",
      description: "Job posted successfully!",
    });
  };

  const renderJobCard = (job: Job) => {
    const isJobSaved = job.savedBy && job.savedBy.includes(currentUser?.id);
    
    return (
      <Card key={job.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 cursor-pointer hover:text-blue-600"
                  onClick={() => handleJobClick(job)}>
                {job.title}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  {job.company}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {job.location}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {new Date(job.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleSaveJob(job.id)}
              className="text-gray-500 hover:text-blue-600"
            >
              {isJobSaved ? <Bookmark className="h-4 w-4 fill-current" /> : <BookmarkPlus className="h-4 w-4" />}
            </Button>
          </div>

          <p className="text-gray-700 text-sm mb-4 line-clamp-3">
            {job.description}
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary">{job.type}</Badge>
            {job.salaryRange && job.salaryRange.min && job.salaryRange.max && (
              <Badge variant="outline" className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {job.salaryRange.min.toLocaleString()} - {job.salaryRange.max.toLocaleString()} {job.salaryRange.currency || 'USD'}
              </Badge>
            )}
            {job.applicationDeadline && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
              </Badge>
            )}
            {job.isAlumniReferral && (
              <Badge className="bg-blue-100 text-blue-800">Alumni Referral</Badge>
            )}
          </div>

          {job.tags && job.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {job.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {job.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{job.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}

          <div className="text-xs text-gray-500 mb-4">
            Posted by {job.postedByName} • {job.applicationCount} applications
          </div>
        </CardContent>

        <CardFooter className="px-6 py-4 bg-gray-50 flex gap-2">
          <Button
            onClick={() => handleJobClick(job)}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            View Details
          </Button>
          {job.applicationUrl ? (
            <Button
              onClick={() => {
                handleApplyToJob(job.id);
                window.open(job.applicationUrl, '_blank');
              }}
              size="sm"
              className="flex-1 flex items-center gap-1"
            >
              <ExternalLink className="h-4 w-4" />
              Apply
            </Button>
          ) : job.contactEmail ? (
            <Button
              onClick={() => {
                handleApplyToJob(job.id);
                window.location.href = `mailto:${job.contactEmail}?subject=Application for ${job.title}`;
              }}
              size="sm"
              className="flex-1"
            >
              Contact
            </Button>
          ) : (
            <Button
              onClick={() => handleApplyToJob(job.id)}
              size="sm"
              className="flex-1"
            >
              Apply
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  return (
    <div>
      <PageHeader 
        title="Alumni Job Board" 
        description="Explore career opportunities shared by fellow alumni"
        action={
          <Button 
            className="flex items-center gap-2" 
            onClick={() => setIsPostJobModalOpen(true)}
          >
            <Briefcase className="h-4 w-4" /> 
            Post a Job
          </Button>
        }
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Jobs</TabsTrigger>
          <TabsTrigger value="saved">Saved Jobs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          {/* Search and filters */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by company name..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-1/3">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Job Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full sm:w-1/3">
                <Select value={filterLocation} onValueChange={setFilterLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="Remote">Remote</SelectItem>
                    <SelectItem value="San Francisco">San Francisco</SelectItem>
                    <SelectItem value="New York">New York</SelectItem>
                    <SelectItem value="Seattle">Seattle</SelectItem>
                    <SelectItem value="Austin">Austin</SelectItem>
                    <SelectItem value="Boston">Boston</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setFilterType("all");
                  setFilterLocation("all");
                }}
                className="w-full sm:w-auto"
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Jobs List */}
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : jobs.length === 0 ? (
            <EmptyState
              icon={<Briefcase className="h-12 w-12" />}
              title="No jobs found"
              description="No jobs match your current filters. Try adjusting your search criteria."
            />
          ) : (
            <div className="grid gap-6">
              {jobs.map(renderJobCard)}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="saved">
          {/* Saved Jobs */}
          {savedJobsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : savedJobs.length === 0 ? (
            <EmptyState
              icon={<Bookmark className="h-12 w-12" />}
              title="No saved jobs"
              description="You haven't saved any jobs yet. Browse the job board and save interesting opportunities."
            />
          ) : (
            <div className="grid gap-6">
              {savedJobs.map(renderJobCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Job Details Modal */}
      <JobDetailsModal
        job={selectedJob}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedJob(null);
        }}
        onApply={handleApplyToJob}
        onSave={handleToggleSaveJob}
      />

      {/* Post Job Modal */}
      <PostJobForm
        isOpen={isPostJobModalOpen}
        onClose={() => setIsPostJobModalOpen(false)}
        onJobCreated={handleJobCreated}
      />
    </div>
  );
}
