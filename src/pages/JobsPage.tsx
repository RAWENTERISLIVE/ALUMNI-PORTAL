import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Briefcase, 
  MapPin, 
  Clock,
  Bookmark,
  BookmarkCheck,
  Plus,
  CircleDollarSign,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { JobDetailsModal } from "@/components/jobs/JobDetailsModal";
import { PostJobForm } from "@/components/jobs/PostJobForm";
import { ApplyJobDialog } from "@/components/jobs/ApplyJobDialog";
import apiService from "@/services/apiService";
import { useAuth } from "@/contexts/AuthContext";
import { Job } from "@/types";

const formatJobTypeLabel = (value: string) =>
  value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const normalizeJobType = (value?: string) => (value || "").trim().toLowerCase().replaceAll(/\s+/g, "-");

interface JobApplicationRecord {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  coverLetter: string;
  resumeUrl: string;
  resumeFilename: string;
  portfolioUrl: string;
  appliedAt: string;
}

const getPostedById = (job: Job): string | undefined => {
  const postedBy = job.postedBy as unknown;

  if (postedBy && typeof postedBy === "object" && "id" in postedBy) {
    const maybeId = (postedBy as { id?: unknown }).id;
    if (typeof maybeId === "string") {
      return maybeId;
    }
  }

  return undefined;
};

const escapeCsvCell = (value: unknown): string => {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
};

export default function JobsPage() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applyJob, setApplyJob] = useState<Job | null>(null);
  const [isJobDetailsModalOpen, setIsJobDetailsModalOpen] = useState(false);
  const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  const [applicationSubmitStatus, setApplicationSubmitStatus] = useState<string>("");
  const [downloadingApplicantsForJobId, setDownloadingApplicantsForJobId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  
  // Additional filters
  const [jobTypeFilter, setJobTypeFilter] = useState<string | null>(null);
  
  // Saved and applied jobs
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await apiService.getJobs({ limit: 100 });
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
        const response = await apiService.unsaveJob(jobId);
        if (!response.success) {
          throw new Error(response.message || "Failed to unsave job");
        }

        setSavedJobs((prev) => prev.filter(id => id !== jobId));
        toast({ title: "Removed", description: "Job removed from saved jobs." });
      } else {
        const response = await apiService.saveJob(jobId);
        if (!response.success) {
          throw new Error(response.message || "Failed to save job");
        }

        setSavedJobs((prev) => [...prev, jobId]);
        toast({ title: "Saved", description: "Job saved to your profile." });
      }
    } catch (error) {
      console.error("Error saving/unsaving job:", error);
      toast({ title: "Error", description: "Failed to update saved jobs.", variant: "destructive" });
    }
  };

  const handleApplyJob = async ({
    job,
    coverLetter,
    resumeFile,
    portfolioUrl,
  }: {
    job: Job;
    coverLetter: string;
    resumeFile?: File;
    portfolioUrl?: string;
  }): Promise<boolean> => {
    try {
      if (!currentUser) {
        toast({ title: "Sign in required", description: "Please sign in to apply for jobs.", variant: "destructive" });
        return false;
      }

      if (getPostedById(job) === currentUser.id) {
        toast({ title: "Not allowed", description: "You cannot apply to your own job posting.", variant: "destructive" });
        return false;
      }

      setIsSubmittingApplication(true);
      setApplicationSubmitStatus("Preparing application...");

      let resumeUrl: string | undefined;
      let resumeFilename: string | undefined;
      const normalizedPortfolioUrl = portfolioUrl?.trim() || undefined;

      if (resumeFile) {
        setApplicationSubmitStatus("Uploading resume...");
        const uploadResponse = await apiService.uploadFile(resumeFile);
        if (!uploadResponse.success || !uploadResponse.data?.url) {
          throw new Error(uploadResponse.message || "Resume upload failed");
        }

        resumeUrl = uploadResponse.data.url;
        resumeFilename = uploadResponse.data.originalName || resumeFile.name;
      }

      setApplicationSubmitStatus("Submitting application...");
      const response = await apiService.applyToJob(job.id, {
        coverLetter,
        resumeUrl,
        resumeFilename,
        portfolioUrl: normalizedPortfolioUrl,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to submit application");
      }

      const alreadyApplied = Boolean(response.data?.alreadyApplied);

      setAppliedJobs((prev) => (prev.includes(job.id) ? prev : [...prev, job.id]));
      setIsApplyDialogOpen(false);
      setApplyJob(null);

      toast({
        title: alreadyApplied ? "Already applied" : "Applied",
        description: alreadyApplied
          ? "You already submitted an application for this job."
          : "Your application has been submitted.",
      });

      return true;
    } catch (error: any) {
      console.error("Error applying to job:", error);
      toast({ title: "Error", description: error.message || "Failed to submit application.", variant: "destructive" });
      return false;
    } finally {
      setApplicationSubmitStatus("");
      setIsSubmittingApplication(false);
    }
  };

  const openJobDetails = (job: Job) => {
    setSelectedJob(job);
    setIsJobDetailsModalOpen(true);
  };

  const openApplyDialog = (job: Job) => {
    if (!currentUser) {
      toast({ title: "Sign in required", description: "Please sign in to apply for jobs.", variant: "destructive" });
      return;
    }

    if (getPostedById(job) === currentUser.id) {
      toast({ title: "Not allowed", description: "You cannot apply to your own job posting.", variant: "destructive" });
      return;
    }

    setApplyJob(job);
    setIsApplyDialogOpen(true);
  };

  const isOwnPosting = (job: Job) => {
    const postedById = getPostedById(job);
    return Boolean(currentUser && postedById && postedById === currentUser.id);
  };

  const canDownloadApplications = (job: Job) => {
    if (!currentUser) return false;
    if (isOwnPosting(job)) return true;

    const role = (currentUser.role || "").toLowerCase();
    return role === "moderator" || role === "admin" || role === "super_admin";
  };

  const handleExternalApply = async (job: Job) => {
    if (!job.applicationUrl) {
      openApplyDialog(job);
      return;
    }

    if (!currentUser) {
      toast({ title: "Sign in required", description: "Please sign in to apply for jobs.", variant: "destructive" });
      return;
    }

    if (isOwnPosting(job)) {
      toast({ title: "Not allowed", description: "You cannot apply to your own job posting.", variant: "destructive" });
      return;
    }

    try {
      const response = await apiService.applyToJob(job.id);
      if (!response.success) {
        throw new Error(response.message || "Failed to register application");
      }

      const alreadyApplied = Boolean(response.data?.alreadyApplied);
      setAppliedJobs((prev) => (prev.includes(job.id) ? prev : [...prev, job.id]));

      window.open(job.applicationUrl, "_blank", "noopener,noreferrer");

      toast({
        title: alreadyApplied ? "Already applied" : "Continue application",
        description: alreadyApplied
          ? "Opening the external application page."
          : "Your interest was recorded. Complete the form on the external page.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to start external application.",
        variant: "destructive",
      });
    }
  };

  const handlePrimaryApplyAction = async (job: Job) => {
    if (job.applicationUrl) {
      await handleExternalApply(job);
      return;
    }

    openApplyDialog(job);
  };

  const handleDownloadApplicants = async (job: Job) => {
    if (!canDownloadApplications(job)) {
      toast({ title: "Not allowed", description: "Only the job poster can download applicant data.", variant: "destructive" });
      return;
    }

    try {
      setDownloadingApplicantsForJobId(job.id);

      const response = await apiService.getJobApplications(job.id);
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch applicants");
      }

      const applicants = (Array.isArray(response.data) ? response.data : []) as JobApplicationRecord[];
      if (applicants.length === 0) {
        toast({ title: "No applications yet", description: "No applicant data is available for this job yet." });
        return;
      }

      const headers = [
        "Applied At",
        "Applicant Name",
        "Applicant Email",
        "Cover Letter",
        "Portfolio URL",
        "Resume URL",
        "Resume Filename",
      ];

      const rows = applicants.map((application) => [
        application.appliedAt,
        application.applicantName,
        application.applicantEmail,
        application.coverLetter,
        application.portfolioUrl,
        application.resumeUrl,
        application.resumeFilename,
      ]);

      const csv = [
        headers.map(escapeCsvCell).join(","),
        ...rows.map((row) => row.map(escapeCsvCell).join(",")),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const slug = job.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

      link.href = objectUrl;
      link.download = `${slug || "job"}-applications-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);

      toast({
        title: "Download ready",
        description: `Exported ${applicants.length} application${applicants.length === 1 ? "" : "s"}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to download applicant data.",
        variant: "destructive",
      });
    } finally {
      setDownloadingApplicantsForJobId(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setLocationFilter("");
    setJobTypeFilter(null);
  };

  const jobTypes = useMemo(() => {
    return Array.from(
      new Set(
        jobs
          .map((job) => normalizeJobType(job.type))
          .filter(Boolean)
      )
    );
  }, [jobs]);

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
        (typeof job.company === 'object'
          ? (job.company?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
          : (job.company || '').toLowerCase().includes(searchQuery.toLowerCase())) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesLocation = !locationFilter || 
        job.location.toLowerCase().includes(locationFilter.toLowerCase());
        
      const matchesJobType = !jobTypeFilter || normalizeJobType(job.type) === normalizeJobType(jobTypeFilter);
      
      return matchesSearch && matchesLocation && matchesJobType;
    });
  }, [
    jobs, 
    activeTab, 
    savedJobs, 
    appliedJobs, 
    searchQuery, 
    locationFilter, 
    jobTypeFilter
  ]);

  // Helper function to get company name
  const getCompanyName = (job: Job): string => {
    if (typeof job.company === 'object') {
      return job.company?.name || '';
    }
    return job.company || '';
  };

  // Helper function to get company logo
  const getCompanyLogo = (job: Job): string => {
    if (typeof job.company === 'object') {
      return job.company?.logo || '';
    }
    return '';
  };

  const emptyStateTitle =
    activeTab === "saved"
      ? "No saved jobs"
      : activeTab === "applied"
      ? "No applied jobs"
      : "No jobs found";

  const emptyStateDescription =
    activeTab === "saved"
      ? "Save jobs you're interested in to view them later."
      : activeTab === "applied"
      ? "Track your job applications here."
      : "Try adjusting your filters or search terms.";

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
              title={emptyStateTitle}
              description={emptyStateDescription}
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
                const isOwnJob = isOwnPosting(job);
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
                            variant={isOwnJob || isApplied ? "outline" : "default"}
                            className={isOwnJob
                              ? "border-border text-muted-foreground"
                              : isApplied 
                              ? "border-green-500 text-green-700 hover:bg-green-50" 
                              : "bg-primary hover:bg-primary/90 text-white transform hover:scale-105 transition-transform"}
                            disabled={isOwnJob}
                            onClick={() => {
                              if (isOwnJob) return;
                              if (isApplied) {
                                openJobDetails(job);
                                return;
                              }

                              void handlePrimaryApplyAction(job);
                            }}
                          >
                            {isOwnJob ? "Your Posting" : isApplied ? "Applied" : job.applicationUrl ? "Apply External" : "Apply"}
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
                      
                      <div className="flex items-center gap-2">
                        {isOwnJob && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-sm"
                            disabled={downloadingApplicantsForJobId === job.id}
                            onClick={() => void handleDownloadApplicants(job)}
                          >
                            {downloadingApplicantsForJobId === job.id ? "Preparing..." : "Download Applicants"}
                          </Button>
                        )}

                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-sm"
                          onClick={() => openJobDetails(job)}
                        >
                          View Details
                        </Button>
                      </div>
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
                    {jobTypes.map(type => (
                      <Button
                        key={type}
                        size="sm"
                        variant={jobTypeFilter === type ? "default" : "outline"}
                        className={jobTypeFilter === type 
                          ? "bg-primary hover:bg-primary/90 text-white" 
                          : "hover:bg-muted/50 text-foreground/80"}
                        onClick={() => setJobTypeFilter(jobTypeFilter === type ? null : type)}
                      >
                        {formatJobTypeLabel(type)}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {jobTypeFilter && (
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
          onApply={async (job) => {
            setIsJobDetailsModalOpen(false);
            await handlePrimaryApplyAction(job);
          }}
          onSave={async () => handleToggleSaveJob(selectedJob.id)}
          isSaved={savedJobs.includes(selectedJob.id)}
          isApplied={appliedJobs.includes(selectedJob.id)}
          canApply={!isOwnPosting(selectedJob)}
          canDownloadApplications={canDownloadApplications(selectedJob)}
          isDownloadingApplications={downloadingApplicantsForJobId === selectedJob.id}
          onDownloadApplications={handleDownloadApplicants}
        />
      )}

      <ApplyJobDialog
        isOpen={isApplyDialogOpen}
        onClose={() => {
          setIsApplyDialogOpen(false);
          setApplyJob(null);
        }}
        job={applyJob}
        isSubmitting={isSubmittingApplication}
        submitStatusText={applicationSubmitStatus}
        isAlreadyApplied={applyJob ? appliedJobs.includes(applyJob.id) : false}
        onSubmit={async ({ coverLetter, resumeFile, portfolioUrl }) => {
          if (!applyJob) return false;

          return handleApplyJob({
            job: applyJob,
            coverLetter,
            resumeFile,
            portfolioUrl,
          });
        }}
      />
      
      <PostJobForm
        isOpen={isPostJobModalOpen}
        onClose={() => setIsPostJobModalOpen(false)}
        onSubmit={handlePostJob}
      />
    </div>
  );
}
