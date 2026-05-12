import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Upload, CheckCircle2, Loader2 } from "lucide-react";
import apiService from "@/services/apiService";

interface BulkUserUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

interface ParsedUser {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  admissionNumber: string;
  graduationYear: string;
  admissionYear: string;
}

export default function BulkUserUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
}: BulkUserUploadModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedUsers, setParsedUsers] = useState<ParsedUser[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file.",
        variant: "destructive"
      });
      return;
    }

    parseCSV(file);
  };

  const parseCSV = (file: File) => {
    setIsParsing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r?\n/).filter(line => line.trim());
      
      if (lines.length <= 1) {
        toast({ title: "Empty file", description: "The uploaded file contains no data.", variant: "destructive" });
        setIsParsing(false);
        return;
      }

      // Skip header
      const dataLines = lines.slice(1);
      const users: ParsedUser[] = dataLines.map(line => {
        // Handle basic CSV splitting (simple implementation)
        const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
        const [fName, lName, email, mobile, admNum, gradYear] = parts;
        
        // Auto-determine admission year from admission number
        let admYear = "";
        if (admNum && admNum.includes('/')) {
          const yearPart = admNum.split('/').pop();
          if (yearPart && yearPart.length === 2 && /^\d+$/.test(yearPart)) {
            const yearInt = parseInt(yearPart, 10);
            admYear = yearInt > 50 ? `19${yearPart}` : `20${yearPart}`;
          }
        }

        return {
          firstName: fName || "",
          lastName: lName || "",
          email: email || "",
          mobile: mobile || "",
          admissionNumber: admNum || "",
          graduationYear: gradYear || "",
          admissionYear: admYear
        };
      }).filter(u => u.email && u.firstName);

      setParsedUsers(users);
      setIsParsing(false);
    };
    reader.onerror = () => {
      toast({ title: "Error reading file", variant: "destructive" });
      setIsParsing(false);
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (parsedUsers.length === 0) return;

    setIsUploading(true);
    try {
      const usersToCreate = parsedUsers.map(u => ({
        ...u,
        name: `${u.firstName} ${u.lastName}`.trim(),
        accountType: 'ALUMNI',
        status: 'ACTIVE',
        role: 'USER',
        password: 'ChangeMe123!' // Default password for bulk created users
      }));

      const response = await apiService.bulkCreateUsers(usersToCreate);

      if (response.success) {
        toast({
          title: "Success",
          description: `Successfully created ${parsedUsers.length} users.`,
        });
        onUploadSuccess();
        onClose();
      } else {
        toast({
          title: "Bulk upload failed",
          description: response.message || "An error occurred while creating users.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload users.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearData = () => {
    setParsedUsers([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none bg-background dark:bg-zinc-950 shadow-2xl rounded-2xl">
        <div className="bg-primary/5 p-6 border-b border-border/50">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Bulk Create Users
            </DialogTitle>
            <DialogDescription className="text-muted-foreground/70">
              Upload a CSV file with user details to create multiple accounts at once.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col min-h-[400px]">
          {parsedUsers.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-6">
              <div 
                className="w-full max-w-md border-2 border-dashed border-border/50 rounded-3xl p-12 flex flex-col items-center justify-center space-y-5 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {isParsing ? (
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  ) : (
                    <Upload className="h-10 w-10 text-primary" />
                  )}
                </div>
                <div className="text-center space-y-1">
                  <p className="font-bold text-lg text-foreground/90">Select CSV Spreadsheet</p>
                  <p className="text-sm text-muted-foreground">Download template or upload your file</p>
                </div>
                <div className="px-4 py-2 bg-primary/5 rounded-full text-[10px] font-bold uppercase tracking-widest text-primary/70 border border-primary/10">
                  Required: First Name, Last Name, Email, Mobile, Admission No, Grad Year
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".csv"
                  onChange={handleFileChange}
                />
              </div>
              <Button variant="outline" size="sm" className="rounded-full px-6 border-border/50" onClick={() => {
                const headers = "First Name, Last Name, Email, Mobile No, Admission Number, Graduation Year\n";
                const blob = new Blob([headers], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.setAttribute('href', url);
                a.setAttribute('download', 'user_upload_template.csv');
                a.click();
              }}>
                Download CSV Template
              </Button>
            </div>
          ) : (
            <div className="flex-1 overflow-auto border-b border-border/50">
              <Table>
                <TableHeader className="bg-muted/30 sticky top-0 z-10 backdrop-blur-md">
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest h-12">First Name</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest h-12">Last Name</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest h-12">Email</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest h-12">Admission No.</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest h-12">Class of</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedUsers.map((user, idx) => (
                    <TableRow key={idx} className="hover:bg-primary/5 border-border/50 transition-colors">
                      <TableCell className="py-3 text-sm font-medium">{user.firstName}</TableCell>
                      <TableCell className="py-3 text-sm font-medium">{user.lastName}</TableCell>
                      <TableCell className="py-3 text-sm text-muted-foreground">{user.email}</TableCell>
                      <TableCell className="py-3 text-sm font-mono text-primary/80">{user.admissionNumber}</TableCell>
                      <TableCell className="py-3 text-sm font-semibold">20{user.graduationYear.slice(-2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 bg-muted/20 border-t border-border/50 gap-3">
          {parsedUsers.length > 0 && (
            <Button variant="ghost" onClick={clearData} className="rounded-xl h-12 px-6 mr-auto text-destructive hover:bg-destructive/5 hover:text-destructive">
              Clear Data
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} disabled={isUploading} className="rounded-xl h-12 px-6">
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={parsedUsers.length === 0 || isUploading} 
            className="rounded-xl h-12 px-10 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 min-w-[160px]"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Create {parsedUsers.length} Users
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
