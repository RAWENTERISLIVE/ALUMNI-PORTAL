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
    manverifadmissionyear: z.string().optional(), // changed from graduationYear
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
      if (!data.manverifadmissionyear || data.manverifadmissionyear.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Admission year is required for manual verification.",
          path: ["manverifadmissionyear"],
        });
      } else {
        const year = parseInt(data.manverifadmissionyear, 10);
        const currentYear = new Date().getFullYear();
        if (isNaN(year) || year < 1989 || year > currentYear + 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Admission year must be between 1989 and ${currentYear + 1}.`,
            path: ["manverifadmissionyear"],
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
      manverifadmissionyear: "",
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
        admissionYear: values.manverifadmissionyear,
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
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gray-50">
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-800">Alumni Connect</h1>
          <h2 className="text-2xl font-semibold text-orange-500 mb-2">Create an Account</h2>
          <p className="text-gray-600">
            Join the Alumni Network to connect with your peers
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-lg">
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
                    <FormLabel className="text-gray-700 font-medium">Full Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="John Doe" 
                        {...field} 
                        className="text-gray-900 placeholder:text-gray-400"
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
                    <FormLabel className="text-gray-700 font-medium">Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="your.email@example.com" 
                        {...field} 
                        className="text-gray-900 placeholder:text-gray-400"
                      />
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
                    <FormLabel className="font-normal text-sm text-gray-600">
                      I don&apos;t have/remember my Admission Number
                    </FormLabel>
                  </FormItem>
                )}
              />

              {forgotAdmissionNumber ? (
                <>
                  <FormField
                    control={form.control}
                    name="manverifadmissionyear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Admission Year</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. 2010"
                            {...field}
                            className="text-gray-900 placeholder:text-gray-400"
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
                        <FormLabel className="text-gray-700 font-medium">Details for Manual Verification</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Please provide your course, any teachers you remember, or other details to help us verify your identity."
                            {...field}
                            className="text-gray-900 placeholder:text-gray-400"
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
                      <FormLabel className="text-gray-700 font-medium">Admission Number / Student ID</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. 12345/89 or 00123/05" 
                          {...field} 
                          className="text-gray-900 placeholder:text-gray-400"
                        />
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
                    <FormLabel className="text-gray-700 font-medium">Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        {...field} 
                        className="text-gray-900 placeholder:text-gray-400"
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
                    <FormLabel className="text-gray-700 font-medium">Confirm Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        {...field} 
                        className="text-gray-900 placeholder:text-gray-400"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full bg-orange-500 hover:bg-orange-600 text-white" 
                disabled={isLoading}
              >
                {isLoading ? <LoadingSpinner /> : "Create Account"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="text-orange-500 hover:text-orange-600 font-medium hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
