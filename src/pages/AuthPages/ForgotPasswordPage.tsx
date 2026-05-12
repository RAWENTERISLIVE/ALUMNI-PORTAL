
import { useState } from "react";
import { Link } from "react-router-dom";
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
import { LoadingSpinner } from "@/shared/components/LoadingSpinner";
import { ThemeToggle } from "@/components/theme-toggle";
import apiService from "@/services/apiService";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Mail, CheckCircle2 } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof forgotPasswordSchema>) {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.forgotPassword(values.email);
      
      if (response.success) {
        setIsSubmitted(true);
        toast({
          title: "Reset Link Sent",
          description: "If an account exists with that email, you will receive a reset link shortly.",
        });
      } else {
        setError(response.message || "Something went wrong. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to send reset link.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden bg-background">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md mx-auto space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <Link to="/" className="inline-block group transition-transform hover:scale-105">
            <div className="flex flex-col items-center gap-3">
              <img src="/logo.png" alt="MPS Logo" className="w-16 h-16 object-contain drop-shadow-2xl" />
              <h1 className="text-2xl sm:text-3xl font-black tracking-tighter gradient-text uppercase">MPSAJMER CONNECT</h1>
            </div>
          </Link>
          <div className="space-y-1">
            <h2 className="text-3xl font-bold text-foreground">
              {isSubmitted ? "Check your email" : "Reset Password"}
            </h2>
            <p className="text-muted-foreground font-light px-4">
              {isSubmitted 
                ? "We've sent a password reset link to your email address." 
                : "Enter your email address and we'll send you a link to reset your password."}
            </p>
          </div>
        </div>

        <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-primary/5">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl mb-6 text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive"></span>
              {error}
            </div>
          )}

          {isSubmitted ? (
            <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Didn't receive the email? Check your spam folder or try again in a few minutes.
              </p>
              <Button 
                variant="outline" 
                className="w-full h-12 rounded-xl"
                onClick={() => setIsSubmitted(false)}
              >
                Try a different email
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/70 font-medium ml-1">Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            placeholder="name@example.com" 
                            {...field} 
                            className="h-12 pl-11 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  size="lg"
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" 
                  disabled={isLoading}
                >
                  {isLoading ? <LoadingSpinner size="sm" /> : "Send Reset Link"}
                </Button>
              </form>
            </Form>
          )}

          <div className="mt-8 pt-6 border-t border-border/30 text-center">
            <Link to="/login" className="text-sm text-primary hover:text-primary/80 font-bold transition-colors inline-flex items-center gap-2 group">
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Back to login
            </Link>
          </div>
        </div>
        
        <p className="text-center text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em]">
          Secure Password Recovery System
        </p>
      </div>
    </div>
  );
}
