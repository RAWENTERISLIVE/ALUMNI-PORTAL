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
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

const registerSchema = z
  .object({
    name: z.string().min(2, { message: "Full name is required" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z.string().min(8, {
      message: "Password must be at least 8 characters",
    }),
    confirmPassword: z.string(),
    admissionNumber: z.string().optional(),
    forgotAdmissionNumber: z.boolean().default(false),
    verificationDetails: z.string().optional(),
    graduationYear: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .superRefine((data, ctx) => {
    if (!data.forgotAdmissionNumber) {
      if (!data.admissionNumber || data.admissionNumber.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Admission number is required.",
          path: ["admissionNumber"],
        });
      } else if (!/^[a-zA-Z0-9\/\-]{3,20}$/.test(data.admissionNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Admission number is not valid.",
          path: ["admissionNumber"],
        });
      }
    } else {
      if (!data.verificationDetails || data.verificationDetails.trim().length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please provide details for manual verification (minimum 10 characters).",
          path: ["verificationDetails"],
        });
      }
      if (!data.graduationYear || data.graduationYear.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Graduation year is required for manual verification.",
          path: ["graduationYear"],
        });
      } else {
        const year = parseInt(data.graduationYear, 10);
        const currentYear = new Date().getFullYear();
        if (isNaN(year) || year < 1989 || year > currentYear + 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Graduation year must be between 1989 and ${currentYear + 1}.`,
            path: ["graduationYear"],
          });
        }
      }
    }
  });

export default function RegisterPage() {
  const { register, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      admissionNumber: "",
      password: "",
      confirmPassword: "",
      forgotAdmissionNumber: false,
      verificationDetails: "",
      graduationYear: "",
    },
  });

  const forgotAdmissionNumber = form.watch("forgotAdmissionNumber");

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    try {
      setAuthError(null);
      
      const registrationData = {
        name: values.name,
        email: values.email,
        password: values.password,
        admissionNumber: values.forgotAdmissionNumber ? undefined : values.admissionNumber,
        needsManualVerification: values.forgotAdmissionNumber,
        verificationDetails: values.verificationDetails,
        graduationYear: values.graduationYear,
      };

      console.log('Frontend sending registration data:', registrationData);
      
      const result = await register(registrationData);

      if (result && result.success) {
        toast({
          title: "Registration Successful",
          description: values.forgotAdmissionNumber
            ? "Your account is pending manual verification. You will be notified via email."
            : "Welcome! Please log in to continue.",
        });
        navigate("/login");
      } else {
        setAuthError(result?.message || "Registration failed.");
      }
    } catch (error: any) {
      setAuthError(error.message || "An unexpected error occurred.");
      console.error("Registration error:", error);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-muted/30">
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Create an Account</h1>
          <p className="text-muted-foreground">
            Join the Alumni Network
          </p>
        </div>

        <div className="bg-background border rounded-lg p-6 sm:p-8 shadow-sm">
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
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="your.email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                    <FormLabel className="font-normal text-sm">
                      I don&apos;t have/remember my Admission Number
                    </FormLabel>
                  </FormItem>
                )}
              />

              {forgotAdmissionNumber ? (
                <>
                  <FormField
                    control={form.control}
                    name="graduationYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Graduation Year</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. 2010"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="verificationDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Details for Manual Verification</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Please provide your course, any teachers you remember, or other details to help us verify your identity."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              ) : (
                <FormField
                  control={form.control}
                  name="admissionNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admission Number / Student ID</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 12345/89 or 00123/05" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
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
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <LoadingSpinner /> : "Create Account"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm">
            Already have an account?{" "}
            <Link to="/login" className="underline hover:text-primary">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
