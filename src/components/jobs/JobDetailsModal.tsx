import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Building, MapPin, ExternalLink, Bookmark, BookmarkPlus, Clock, DollarSign, Calendar, Download, Users, User } from "lucide-react";
import { useState } from "react";
import { Job } from "@/types";

export interface JobDetailsModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onApply: (job: Job) => Promise<void>;
  onSave: (jobId: string) => Promise<void>;
  isSaved?: boolean;
  isApplied?: boolean;
  canApply?: boolean;
  canDownloadApplications?: boolean;
  isDownloadingApplications?: boolean;
  onDownloadApplications?: (job: Job) => Promise<void>;
  onViewApplicants?: (job: Job) => void;
}

export function JobDetailsModal({ 
  job, 
  isOpen, 
  onClose, 
  onApply, 
  onSave, 
  isSaved = false, 
  isApplied = false,
  canApply = true,
  canDownloadApplications = false,
  isDownloadingApplications = false,
  onDownloadApplications,
  onViewApplicants
}: JobDetailsModalProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  if (!job) return null;

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const savedByCurrentUser = job.savedBy?.includes(currentUser.id) || isSaved;
  const appliedByCurrentUser = job.applicants?.includes(currentUser.id) || isApplied;
  
  const handleApply = async () => {
    try {
      setIsApplying(true);
      await onApply(job);
    } catch (error) {
      console.error('Error applying to job:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const handleDownloadApplications = async () => {
    if (!onDownloadApplications) return;

    try {
      await onDownloadApplications(job);
    } catch (error) {
      console.error('Error downloading applications:', error);
    }
  };

  const handleViewApplicants = () => {
    if (onViewApplicants) {
      onViewApplicants(job);
    }
  };

  const applyLabel = appliedByCurrentUser
    ? 'Applied'
    : job.applicationUrl
    ? 'Apply External'
    : 'Apply';

  const handleToggleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(job.id);
    } catch (error) {
      console.error('Error toggling save job:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{job.title}</DialogTitle>
          <DialogDescription>View full details and apply</DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <Badge variant="secondary">{job.type}</Badge>
          {job.salaryRange && (job.salaryRange.min > 0 || job.salaryRange.max > 0) && (
            <Badge variant="outline" className="flex items-center gap-1 border-primary/20 text-primary">
              <DollarSign className="h-3 w-3" />
              {job.salaryRange.min.toLocaleString()} - {job.salaryRange.max.toLocaleString()} {job.salaryRange.currency}
            </Badge>
          )}
          {job.applicationDeadline && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
            </Badge>
          )}
          {job.isAlumniReferral && (
            <Badge className="bg-primary/10 text-primary border-primary/20">
              Alumni Referral
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 p-4 bg-muted/30 rounded-xl border border-muted">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="bg-background p-2 rounded-lg shadow-sm border">
                <Building className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Company</p>
                <p className="font-semibold text-sm">{typeof job.company === 'string' ? job.company : job.company.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-background p-2 rounded-lg shadow-sm border">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Location</p>
                <p className="text-sm font-medium">{job.location}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="bg-background p-2 rounded-lg shadow-sm border">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Posted Date</p>
                <p className="text-sm font-medium">{new Date(job.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-background p-2 rounded-lg shadow-sm border">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Applicants</p>
                <p className="text-sm font-medium">{job.applicationCount || 0} applications</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 space-y-6">
          <div className="prose prose-sm max-w-none">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              Description
            </h3>
            <p className="text-foreground/80 whitespace-pre-line leading-relaxed">{job.description}</p>
          </div>
          
          {job.requirements && job.requirements.length > 0 && (
            <div className="prose prose-sm max-w-none">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Requirements
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 list-none p-0">
                {job.requirements.map((req: string, i: number) => (
                  <li key={i} className="text-foreground/80 flex items-start gap-2 m-0">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/30 flex-shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {job.benefits && job.benefits.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2">Benefits</h3>
              <ul className="list-disc pl-5 space-y-1">
                {job.benefits.map((benefit: string, i: number) => (
                  <li key={i} className="text-foreground/80">{benefit}</li>
                ))}
              </ul>
            </div>
          )}

          {job.tags && job.tags.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {job.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <h3 className="text-lg font-medium mb-2">Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Posted by:</span> {job.postedByName || (typeof job.postedBy === 'object' && (job.postedBy as any)?.name) || 'Portal Admin'}
              </div>
              <div>
                <span className="font-medium">Applications:</span> {job.applicationCount}
              </div>
              {job.contactEmail && (
                <div>
                  <span className="font-medium">Contact:</span> {job.contactEmail}
                </div>
              )}
              <div>
                <span className="font-medium">Active:</span> {job.isActive ? 'Yes' : 'No'}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 mt-6 pt-4 border-t">
          <Button 
            onClick={handleToggleSave}
            variant="outline"
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {savedByCurrentUser ? <Bookmark className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
            {isSaving ? "Saving..." : (savedByCurrentUser ? "Saved" : "Save Job")}
          </Button>

          {canDownloadApplications && (
            <>
              <Button
                onClick={handleViewApplicants}
                variant="outline"
                className="flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/5"
              >
                <Users className="h-4 w-4" />
                Applicant Manager
              </Button>
              <Button
                onClick={handleDownloadApplications}
                variant="outline"
                disabled={isDownloadingApplications}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {isDownloadingApplications ? 'Preparing...' : 'Download CSV'}
              </Button>
            </>
          )}
          
          {canApply && (
            <Button 
              onClick={handleApply}
              disabled={isApplying || appliedByCurrentUser || !job.isActive}
              className="flex-1 flex items-center gap-2"
            >
              {job.applicationUrl && !appliedByCurrentUser && <ExternalLink className="h-4 w-4" />}
              {isApplying ? 'Applying...' : applyLabel}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
