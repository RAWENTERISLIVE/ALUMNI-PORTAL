import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Mail, 
  Phone, 
  Globe, 
  FileText, 
  ExternalLink,
  User,
  Link2,
  Download
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

interface JobApplication {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  applicantLinkedin?: string;
  coverLetter: string;
  resumeUrl: string;
  resumeFilename: string;
  portfolioUrl?: string;
  appliedAt: string;
}

interface JobApplicantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  applications: JobApplication[];
  loading: boolean;
  onDownloadCSV?: () => void;
}

export function JobApplicantsModal({ 
  isOpen, 
  onClose, 
  jobTitle, 
  applications, 
  loading,
  onDownloadCSV
}: JobApplicantsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-2xl">Applicants for {jobTitle}</DialogTitle>
            <DialogDescription>
              A total of {applications?.length || 0} candidates have applied for this position.
            </DialogDescription>
          </div>
          {applications && applications.length > 0 && onDownloadCSV && (
            <Button onClick={onDownloadCSV} variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Download CSV
            </Button>
          )}
        </DialogHeader>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              <p className="text-muted-foreground animate-pulse">Fetching applicant data...</p>
            </div>
          ) : !applications || applications.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-muted/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <p className="text-xl font-semibold">No applications found</p>
              <p className="text-muted-foreground mt-2 max-w-xs mx-auto">
                Once candidates submit their resumes, they will appear in this list.
              </p>
            </div>
          ) : (
            <div className="p-6 pt-0">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[250px]">Candidate</TableHead>
                      <TableHead>Contact Info</TableHead>
                      <TableHead>Documents & Links</TableHead>
                      <TableHead>Applied Date</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app) => (
                      <TableRow key={app.id} className="group hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border group-hover:border-primary/30 transition-colors">
                              <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold uppercase">
                                {app.applicantName?.split(' ').map(n => n[0]).join('').slice(0, 2) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col overflow-hidden">
                              <Link 
                                to={`/directory/profile/${app.applicantId}`} 
                                className="font-semibold text-sm hover:text-primary hover:underline transition-all flex items-center gap-1 truncate"
                              >
                                {app.applicantName || "Anonymous"}
                                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </Link>
                              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Applicant ID: {app.applicantId.slice(0, 8)}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1.5">
                            <div className="flex items-center text-xs group/item">
                              <Mail className="h-3.5 w-3.5 mr-2 text-muted-foreground group-hover/item:text-primary transition-colors" />
                              <a href={`mailto:${app.applicantEmail}`} className="hover:underline text-foreground/80">{app.applicantEmail}</a>
                            </div>
                            {app.applicantPhone && (
                              <div className="flex items-center text-xs group/item">
                                <Phone className="h-3.5 w-3.5 mr-2 text-muted-foreground group-hover/item:text-primary transition-colors" />
                                <a href={`tel:${app.applicantPhone}`} className="hover:underline text-foreground/80">{app.applicantPhone}</a>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {app.resumeUrl && (
                              <Button variant="secondary" size="xs" className="h-7 text-[10px] gap-1.5 px-2" asChild>
                                <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer">
                                  <FileText className="h-3 w-3" />
                                  Preview CV
                                </a>
                              </Button>
                            )}
                            {app.applicantLinkedin && (
                              <Button variant="outline" size="xs" className="h-7 text-[10px] gap-1.5 px-2 hover:border-[#0077b5] hover:text-[#0077b5]" asChild>
                                <a href={app.applicantLinkedin} target="_blank" rel="noopener noreferrer">
                                  <Link2 className="h-3 w-3" />
                                  LinkedIn
                                </a>
                              </Button>
                            )}
                            {app.portfolioUrl && (
                              <Button variant="outline" size="xs" className="h-7 text-[10px] gap-1.5 px-2" asChild>
                                <a href={app.portfolioUrl} target="_blank" rel="noopener noreferrer">
                                  <Globe className="h-3 w-3" />
                                  Portfolio
                                </a>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground">
                            {app.appliedAt ? format(new Date(app.appliedAt), "MMM d, yyyy") : "N/A"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <Button variant="ghost" size="sm" className="h-8 text-xs">View Cover Letter</Button>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Cover Letter - {app.applicantName}</DialogTitle>
                                <DialogDescription>
                                  Submitted on {app.appliedAt ? format(new Date(app.appliedAt), "PPPP") : "Unknown date"}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="mt-4 p-6 bg-muted/30 rounded-xl text-sm leading-relaxed whitespace-pre-wrap italic">
                                {app.coverLetter || "No cover letter was provided with this application."}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
