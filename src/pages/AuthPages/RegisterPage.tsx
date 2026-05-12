import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner";
import { ThemeToggle } from "@/components/theme-toggle";
import apiService from "@/services/apiService";

import { useEffect, useMemo } from "react";

export default function RegisterPage() {
  const { register, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string | null>(null);
  const [facultyIdCardFile, setFacultyIdCardFile] = useState<File | null>(null);
  const [verificationDocFile, setVerificationDocFile] = useState<File | null>(null);
  const [facultyIdCardPreview, setFacultyIdCardPreview] = useState<string | null>(null);
  const [verificationDocPreview, setVerificationDocPreview] = useState<string | null>(null);
  const [isUploadingIdCard, setIsUploadingIdCard] = useState(false);
  const [publicSettings, setPublicSettings] = useState<any>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await apiService.getPublicSettings();
        if (response.success && response.settings) {
          setPublicSettings(response.settings);
        }
      } catch (error) {
        console.error("Failed to fetch public settings:", error);
      }
    };
    fetchSettings();
  }, []);

  const registerSchema = useMemo(() => {
    const rules = publicSettings?.institutionRules;
    const minYear = rules?.minAdmissionYear || 1980;
    const maxYear = rules?.maxAdmissionYear || new Date().getFullYear() + 1;
    const admissionPattern = rules?.admissionNumberPattern || "^[A-Za-z0-9\\/-]{3,20}$";
    const patternRegex = new RegExp(admissionPattern);

    return z
      .object({
        name: z.string().min(2, { message: "Full name is required" }),
        email: z.string().email({ message: "Please enter a valid email address" }),
        password: z.string().min(8, {
          message: "Password must be at least 8 characters",
        }),
        confirmPassword: z.string(),
        accountType: z.enum(["alumni", "faculty"]).default("alumni"),
        forgotAdmissionNumber: z.boolean().default(false),
        admissionNumber: z.string().optional(),
        verificationDetails: z.string().optional(),
        admissionYear: z.string().optional(),
        graduationYear: z.string().optional(),
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
      })
      .superRefine((data, ctx) => {
        if (data.forgotAdmissionNumber) {
          const details = (data.verificationDetails || '').trim();
          if (details.length < 10) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Please provide at least 10 characters for manual verification.",
              path: ["verificationDetails"],
            });
          }
        } else {
          const admissionNumber = (data.admissionNumber || '').trim();
          if (!admissionNumber) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Admission number is required.",
              path: ["admissionNumber"],
            });
          } else if (!patternRegex.test(admissionNumber)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Admission number format is invalid according to school records.",
              path: ["admissionNumber"],
            });
          }
        }

        if (data.graduationYear && data.graduationYear.trim() !== "") {
          const year = Number.parseInt(data.graduationYear, 10);
          if (Number.isNaN(year) || year < minYear || year > maxYear) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Graduation year must be between ${minYear} and ${maxYear}.`,
              path: ["graduationYear"],
            });
          }
        }
      });
  }, [publicSettings]);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      accountType: "alumni",
      forgotAdmissionNumber: false,
      admissionNumber: "",
      verificationDetails: "",
      password: "",
      confirmPassword: "",
      admissionYear: "",
      graduationYear: "",
    },
  });

  const forgotAdmissionNumber = form.watch("forgotAdmissionNumber");
  const accountType = form.watch("accountType");
  const admissionNumber = form.watch("admissionNumber");

  // Auto-determine admission year from admission number (e.g., 10168/19 -> 2019)
  useEffect(() => {
    if (!forgotAdmissionNumber && admissionNumber && admissionNumber.includes('/')) {
      const parts = admissionNumber.split('/');
      const yearPart = parts[parts.length - 1];
      if (yearPart.length === 2 && /^\d+$/.test(yearPart)) {
        const yearInt = parseInt(yearPart, 10);
        // If year is high (e.g. 80-99), assume 19xx, otherwise 20xx
        const fullYear = yearInt > 50 ? `19${yearPart}` : `20${yearPart}`;
        form.setValue("admissionYear", fullYear);
      }
    }
  }, [admissionNumber, forgotAdmissionNumber, form]);

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    try {
      setAuthError(null);

      let facultyIdCardUrl: string | undefined;
      if (values.accountType === 'faculty') {
        if (!facultyIdCardFile) {
          setAuthError('Faculty ID card image is required for verification.');
          return;
        }

        setIsUploadingIdCard(true);
        const uploadResult = await apiService.uploadVerificationIdCard(facultyIdCardFile);
        setIsUploadingIdCard(false);

        if (!uploadResult.success || !uploadResult.data?.url) {
          setAuthError(uploadResult.message || 'Failed to upload faculty ID card image.');
          return;
        }

        facultyIdCardUrl = uploadResult.data.url;
      }
      
      const registrationData = {
        name: values.name,
        email: values.email,
        password: values.password,
        accountType: values.accountType,
        admissionNumber: values.forgotAdmissionNumber ? undefined : values.admissionNumber,
        forgotAdmissionNumber: values.forgotAdmissionNumber,
        needsManualVerification: values.forgotAdmissionNumber || values.accountType === 'faculty',
        verificationDetails: values.forgotAdmissionNumber ? values.verificationDetails : undefined,
        facultyIdCardUrl: facultyIdCardUrl || undefined,
        verificationDocUrl: undefined as string | undefined, // To be filled if needed
        graduationYear: values.graduationYear,
        admissionYear: values.admissionYear,
      };

      // Handle alumni verification document if provided
      if (values.forgotAdmissionNumber && verificationDocFile) {
        setIsUploadingIdCard(true);
        const uploadResult = await apiService.uploadVerificationIdCard(verificationDocFile);
        setIsUploadingIdCard(false);
        if (uploadResult.success && uploadResult.data?.url) {
          registrationData.facultyIdCardUrl = uploadResult.data.url; // Reuse same field for now or use a new one
        }
      }

      console.log('Frontend sending registration data:', registrationData);
      
      const result = await register(registrationData);

      if (result?.success) {
        toast({
          title: "Registration Successful",
          description: "Welcome! Please log in to continue.",
        });
        navigate("/login");
      } else {
        setAuthError(result?.message || "Registration failed.");
      }
    } catch (error: any) {
      setIsUploadingIdCard(false);
      setAuthError(error.message || "An unexpected error occurred.");
      console.error("Registration error:", error);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden bg-background">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-2xl mx-auto space-y-8 relative z-10 py-12">
        <div className="text-center space-y-4">
          <Link to="/" className="inline-block group transition-transform hover:scale-105">
            <div className="flex flex-col items-center gap-3">
              <img src="/logo.png" alt="MPS Logo" className="w-16 h-16 object-contain drop-shadow-2xl" />
              <h1 className="text-2xl sm:text-3xl font-black tracking-tighter gradient-text">MPSAJMER CONNECT</h1>
            </div>
          </Link>
          <div className="space-y-1">
            <h2 className="text-3xl font-bold text-foreground">Create an Account</h2>
            <p className="text-muted-foreground font-light">
              Join the official Alumni Network to connect with your peers
            </p>
          </div>
        </div>

        <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-primary/5">
          {authError && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl mb-6 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse"></span>
              {authError}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/70 font-medium ml-1">Full Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="John Doe" 
                          {...field} 
                          className="h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/70 font-medium ml-1">Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="name@example.com" 
                          {...field} 
                          className="h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="accountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/70 font-medium ml-1">Account Type</FormLabel>
                      <FormControl>
                        <select
                          value={field.value}
                          onChange={field.onChange}
                          className="h-12 w-full rounded-xl border border-border/50 bg-background/50 px-3 text-sm text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none"
                        >
                          <option value="alumni">Alumni / Student</option>
                          <option value="faculty">Faculty (Teacher / Staff)</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="admissionYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/70 font-medium ml-1">Adm. Year (Auto)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. 2012"
                            {...field}
                            readOnly={!forgotAdmissionNumber}
                            className={`h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all ${!forgotAdmissionNumber ? 'opacity-70 cursor-not-allowed' : ''}`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="graduationYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/70 font-medium ml-1">Class of (Year)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. 2026"
                            {...field}
                            className="h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {accountType === 'faculty' && (
                <div className="space-y-3 p-4 rounded-2xl bg-primary/5 border border-primary/10 animate-in fade-in zoom-in-95 duration-300">
                  <FormLabel className="text-foreground/70 font-medium ml-1">Faculty ID Card Photo</FormLabel>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const nextFile = event.target.files?.[0] || null;
                      setFacultyIdCardFile(nextFile);
                      if (nextFile) {
                        const reader = new FileReader();
                        reader.onloadend = () => setFacultyIdCardPreview(reader.result as string);
                        reader.readAsDataURL(nextFile);
                      } else {
                        setFacultyIdCardPreview(null);
                      }
                    }}
                    className="bg-background/50 border-border/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                  />
                  {facultyIdCardPreview && (
                    <div className="mt-2 relative w-full h-40 rounded-xl overflow-hidden border border-border">
                      <img src={facultyIdCardPreview} alt="Preview" className="w-full h-full object-cover" />
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="icon" 
                        className="absolute top-2 right-2 h-8 w-8 rounded-full"
                        onClick={() => {
                          setFacultyIdCardFile(null);
                          setFacultyIdCardPreview(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground ml-1">
                    Upload a clear image of your school/college faculty ID card for verification.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="forgotAdmissionNumber"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4 rounded-2xl bg-muted/30 border border-border/50">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium text-foreground">
                          Forgot Admission Number?
                        </FormLabel>
                        <p className="text-[11px] text-muted-foreground">
                          Submit manual verification details if you can't find your ID.
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {!forgotAdmissionNumber ? (
                  <FormField
                    control={form.control}
                    name="admissionNumber"
                    render={({ field }) => (
                      <FormItem className="animate-in fade-in slide-in-from-top-2">
                        <FormLabel className="text-foreground/70 font-medium ml-1">Admission Number / Student ID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. 12345/89"
                            {...field}
                            className="h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                    <FormField
                      control={form.control}
                      name="verificationDetails"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/70 font-medium ml-1">Verification Details</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Share batch, class teacher, section, campus or any past details that help verify your ID."
                              {...field}
                              className="min-h-[100px] bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-3 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                      <FormLabel className="text-foreground/70 font-medium ml-1">Supporting Document (Optional)</FormLabel>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const nextFile = event.target.files?.[0] || null;
                          setVerificationDocFile(nextFile);
                          if (nextFile) {
                            const reader = new FileReader();
                            reader.onloadend = () => setVerificationDocPreview(reader.result as string);
                            reader.readAsDataURL(nextFile);
                          } else {
                            setVerificationDocPreview(null);
                          }
                        }}
                        className="bg-background/50 border-border/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                      />
                      {verificationDocPreview && (
                        <div className="mt-2 relative w-full h-40 rounded-xl overflow-hidden border border-border">
                          <img src={verificationDocPreview} alt="Preview" className="w-full h-full object-cover" />
                          <Button 
                            type="button" 
                            variant="destructive" 
                            size="icon" 
                            className="absolute top-2 right-2 h-8 w-8 rounded-full"
                            onClick={() => {
                              setVerificationDocFile(null);
                              setVerificationDocPreview(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground ml-1">
                        Upload any old ID card, report card, or certificate to speed up verification.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/70 font-medium ml-1">Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                          className="h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/70 font-medium ml-1">Confirm Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                          className="h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                size="lg"
                className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] mt-4" 
                disabled={isLoading || isUploadingIdCard}
              >
                {isLoading || isUploadingIdCard ? <LoadingSpinner size="sm" /> : "Create Your Account"}
              </Button>
            </form>
          </Form>

          <div className="mt-8 pt-6 border-t border-border/30 text-center">
            <p className="text-muted-foreground text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:text-primary/80 font-bold transition-colors">
                Log in instead
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em]">
          Join {new Date().getFullYear()} Alumni Batch
        </p>
      </div>
    </div>
  );
}
