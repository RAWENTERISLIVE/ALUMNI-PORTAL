import { useState, type ChangeEvent } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Paperclip, Upload } from "lucide-react";
import type { Job } from "@/types";

const MAX_RESUME_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_RESUME_EXTENSIONS = ["pdf", "doc", "docx", "txt"];

interface ApplyJobDialogProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  isSubmitting: boolean;
  submitStatusText?: string;
  isAlreadyApplied: boolean;
  onSubmit: (payload: {
    coverLetter: string;
    resumeFile?: File;
    portfolioUrl?: string;
  }) => Promise<boolean>;
}

export function ApplyJobDialog({
  isOpen,
  onClose,
  job,
  isSubmitting,
  submitStatusText,
  isAlreadyApplied,
  onSubmit,
}: ApplyJobDialogProps) {
  const [coverLetter, setCoverLetter] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [resumeFile, setResumeFile] = useState<File | undefined>(undefined);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!job) return null;

  const resetForm = () => {
    setCoverLetter("");
    setPortfolioUrl("");
    setResumeFile(undefined);
    setValidationError(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (isSubmitting) return;

    if (!open) {
      resetForm();
      onClose();
    }
  };

  const getResumeExtension = (fileName: string) => fileName.split(".").pop()?.toLowerCase() || "";

  const isValidUrl = (value: string) => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleResumeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setResumeFile(undefined);
      return;
    }

    const extension = getResumeExtension(file.name);
    if (!ALLOWED_RESUME_EXTENSIONS.includes(extension)) {
      setValidationError("Unsupported resume format. Please upload PDF, DOC, DOCX, or TXT.");
      event.target.value = "";
      setResumeFile(undefined);
      return;
    }

    if (file.size > MAX_RESUME_SIZE_BYTES) {
      setValidationError("Resume is too large. Maximum allowed size is 10 MB.");
      event.target.value = "";
      setResumeFile(undefined);
      return;
    }

    setValidationError(null);
    setResumeFile(file);
  };

  const handleSubmit = async () => {
    if (isSubmitting || isAlreadyApplied) return;

    const trimmedCoverLetter = coverLetter.trim();
    const trimmedPortfolioUrl = portfolioUrl.trim();

    if (trimmedCoverLetter.length > 4000) {
      setValidationError("Cover letter is too long. Please keep it under 4000 characters.");
      return;
    }

    if (trimmedPortfolioUrl && !isValidUrl(trimmedPortfolioUrl)) {
      setValidationError("Please enter a valid portfolio URL (http:// or https://).");
      return;
    }

    setValidationError(null);

    const success = await onSubmit({
      coverLetter: trimmedCoverLetter,
      resumeFile,
      portfolioUrl: trimmedPortfolioUrl || undefined,
    });

    if (success) {
      resetForm();
    }
  };

  const isFormDisabled = isSubmitting || isAlreadyApplied;
  const canSubmit = !isFormDisabled;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Apply to {job.title}</DialogTitle>
          <DialogDescription>
            Submit your application with an optional resume and portfolio link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{typeof job.company === "string" ? job.company : job.company.name}</p>
            <p>{job.location}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cover-letter">Cover Letter</Label>
            <Textarea
              id="cover-letter"
              value={coverLetter}
              onChange={(event) => setCoverLetter(event.target.value)}
              placeholder="Tell the recruiter why you are a strong fit for this role..."
              className="min-h-[150px]"
              maxLength={4000}
              disabled={isFormDisabled}
            />
            <p className="text-xs text-muted-foreground">{coverLetter.length}/4000</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="portfolio-url">Portfolio / LinkedIn URL (optional)</Label>
            <Input
              id="portfolio-url"
              type="url"
              value={portfolioUrl}
              onChange={(event) => setPortfolioUrl(event.target.value)}
              placeholder="https://..."
              disabled={isFormDisabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resume">Resume (optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="resume"
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleResumeChange}
                disabled={isFormDisabled}
              />
            </div>
            {resumeFile && (
              <div className="inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs text-muted-foreground">
                <Paperclip className="h-3.5 w-3.5" />
                {resumeFile.name}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Accepted: PDF, DOC, DOCX, TXT • Max size: 10 MB</p>
          </div>

          {validationError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {validationError}
            </div>
          )}

          {isAlreadyApplied && (
            <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground/80">
              You already applied to this role.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit} className="min-w-[140px]">
            <Upload className="mr-2 h-4 w-4" />
            {isAlreadyApplied ? "Already Applied" : isSubmitting ? submitStatusText || "Submitting..." : "Submit Application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
