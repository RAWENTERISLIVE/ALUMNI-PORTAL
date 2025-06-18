
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Building, MapPin, ExternalLink, Bookmark, BookmarkPlus, Clock, DollarSign, Calendar } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Job } from "@/types";

export interface JobDetailsModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onApply: (jobId: string) => Promise<void>;
  onSave: (jobId: string) => Promise<void>;
}

export function JobDetailsModal({ job, isOpen, onClose, onApply, onSave }: JobDetailsModalProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  if (!job) return null;

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isJobSaved = job.savedBy.includes(currentUser.id);
  
  const handleApply = async () => {
    try {
      setIsApplying(true);
      await onApply(job.id);
    } catch (error) {
      console.error('Error applying to job:', error);
    } finally {
      setIsApplying(false);
    }
  };

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
          {job.salaryRange && (
            <Badge variant="outline" className="flex items-center gap-1">
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
            <Badge className="bg-blue-100 text-blue-800">
              Alumni Referral
            </Badge>
          )}
        </div>
        
        <div className="space-y-2 mt-4">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{job.company}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{job.location}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="mt-6 space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
          </div>
          
          {job.requirements.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2">Requirements</h3>
              <ul className="list-disc pl-5 space-y-1">
                {job.requirements.map((req: string, i: number) => (
                  <li key={i} className="text-gray-700">{req}</li>
                ))}
              </ul>
            </div>
          )}

          {job.benefits && job.benefits.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2">Benefits</h3>
              <ul className="list-disc pl-5 space-y-1">
                {job.benefits.map((benefit: string, i: number) => (
                  <li key={i} className="text-gray-700">{benefit}</li>
                ))}
              </ul>
            </div>
          )}

          {job.tags.length > 0 && (
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
                <span className="font-medium">Posted by:</span> {job.postedByName}
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
            {isJobSaved ? <Bookmark className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
            {isSaving ? "Saving..." : (isJobSaved ? "Saved" : "Save Job")}
          </Button>
          
          {job.applicationUrl ? (
            <Button 
              onClick={() => {
                handleApply();
                window.open(job.applicationUrl, '_blank');
              }}
              disabled={isApplying}
              className="flex-1 flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              {isApplying ? "Applying..." : "Apply External"}
            </Button>
          ) : job.contactEmail ? (
            <Button 
              onClick={() => {
                handleApply();
                window.location.href = `mailto:${job.contactEmail}?subject=Application for ${job.title}`;
              }}
              disabled={isApplying}
              className="flex-1"
            >
              {isApplying ? "Applying..." : "Contact to Apply"}
            </Button>
          ) : (
            <Button 
              onClick={handleApply}
              disabled={isApplying || !job.isActive}
              className="flex-1"
            >
              {isApplying ? "Applying..." : "Apply"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
