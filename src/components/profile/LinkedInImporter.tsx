
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface LinkedInImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any) => void;
}

export function LinkedInImporter({ isOpen, onClose, onImport }: LinkedInImporterProps) {
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleImport = async () => {
    if (!linkedInUrl) {
      toast({
        title: "LinkedIn URL required",
        description: "Please enter your LinkedIn profile URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simulate API call to scrape LinkedIn data
    setTimeout(() => {
      // TODO: Replace with actual LinkedIn integration when implemented
      const linkedInData = {
        name: "LinkedIn User",
        headline: "Professional",
        company: "Company",
        position: "Position",
        location: "Location",
        bio: "Professional experience description.",
        website: "",
        linkedin: linkedInUrl,
        twitter: "",
        github: "",
      };

      onImport(linkedInData);
      setIsLoading(false);
      
      toast({
        title: "Profile Imported",
        description: "Your LinkedIn profile data has been successfully imported.",
      });
      
      onClose();
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import LinkedIn Profile</DialogTitle>
          <DialogDescription>
            Import your professional details directly from LinkedIn to complete your profile.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Input
              placeholder="https://linkedin.com/in/yourprofile"
              value={linkedInUrl}
              onChange={(e) => setLinkedInUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter your LinkedIn profile URL to import your professional information
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleImport} disabled={isLoading || !linkedInUrl}>
            {isLoading ? <LoadingSpinner size="sm" /> : "Import Profile"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
