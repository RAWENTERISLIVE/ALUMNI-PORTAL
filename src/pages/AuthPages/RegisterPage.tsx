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

const registerSchema = z
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
      } else if (!/^[a-zA-Z0-9/-]{3,20}$/.test(admissionNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Admission number is not valid.",
          path: ["admissionNumber"],
        });
      }
    }

    if (data.graduationYear && data.graduationYear.trim() !== "") {
      const year = Number.parseInt(data.graduationYear, 10);
      const currentYear = new Date().getFullYear();
      if (Number.isNaN(year) || year < 1989 || year > currentYear + 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Passing year must be between 1989 and ${currentYear + 10}.`,
          path: ["graduationYear"],
        });
      }
    }
  });

export default function RegisterPage() {
  const { register, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string | null>(null);
  const [facultyIdCardFile, setFacultyIdCardFile] = useState<File | null>(null);
  const [isUploadingIdCard, setIsUploadingIdCard] = useState(false);

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
      graduationYear: "",
    },
  });

  const forgotAdmissionNumber = form.watch("forgotAdmissionNumber");
  const accountType = form.watch("accountType");

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
        facultyIdCardUrl,
        graduationYear: values.graduationYear,
        admissionYear: values.graduationYear,
      };

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
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-muted/30">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md mx-auto space-y-5 sm:space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter text-primary">MPSAJMER CONNECT</h1>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">Create an Account</h2>
          <p className="text-muted-foreground">
            Join the Alumni Network to connect with your peers
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-lg">
          {authError && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4 text-sm">
              {authError}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/80 font-medium">Full Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="John Doe" 
                        {...field} 
                        className="text-foreground placeholder:text-muted-foreground"
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
                    <FormLabel className="text-foreground/80 font-medium">Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="your.email@example.com" 
                        {...field} 
                        className="text-foreground placeholder:text-muted-foreground"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/80 font-medium">Account Type</FormLabel>
                    <FormControl>
                      <select
                        value={field.value}
                        onChange={field.onChange}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                      >
                        <option value="alumni">Alumni / Student</option>
                        <option value="faculty">Faculty (Teacher / Staff)</option>
                      </select>
                    </FormControl>
                    <FormDescription>
                      Faculty accounts are reviewed in a dedicated verification queue.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {accountType === 'faculty' && (
                <div className="space-y-2">
                  <FormLabel className="text-foreground/80 font-medium">Faculty ID Card Photo</FormLabel>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const nextFile = event.target.files?.[0] || null;
                      setFacultyIdCardFile(nextFile);
                    }}
                    className="text-foreground"
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload a clear image of your school/college faculty ID card for verification.
                  </p>
                </div>
              )}

              <FormField
                control={form.control}
                name="forgotAdmissionNumber"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 pt-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal text-sm text-muted-foreground">
                      Forgot Admission Number? Submit manual verification details.
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="admissionNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/80 font-medium">Admission Number / Student ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. 12345/89 or 00123/05"
                        {...field}
                        disabled={forgotAdmissionNumber}
                        className="text-foreground placeholder:text-muted-foreground"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {forgotAdmissionNumber && (
                <FormField
                  control={form.control}
                  name="verificationDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80 font-medium">Verification Details</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Share batch, class teacher, section, campus or any past details that help verify your ID."
                          {...field}
                          className="text-foreground placeholder:text-muted-foreground"
                        />
                      </FormControl>
                      <FormDescription>
                        This goes to a separate manual verification queue for super admin/moderator review.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="graduationYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/80 font-medium">Graduation / Passing Year (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. 2028"
                        {...field}
                        className="text-foreground placeholder:text-muted-foreground"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/80 font-medium">Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        {...field} 
                        className="text-foreground placeholder:text-muted-foreground"
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
                    <FormLabel className="text-foreground/80 font-medium">Confirm Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        {...field} 
                        className="text-foreground placeholder:text-muted-foreground"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-white" 
                disabled={isLoading || isUploadingIdCard}
              >
                {isLoading || isUploadingIdCard ? <LoadingSpinner /> : "Create Account"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-foreground hover:text-foreground/90 font-medium hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
