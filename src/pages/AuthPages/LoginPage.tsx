
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
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner";
import { ThemeToggle } from "@/components/theme-toggle";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters",
  }),
});

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    try {
      setAuthError(null);
      await login(values.email, values.password);
      
      // The auth context will handle navigation after successful login
    } catch (error: any) {
      setAuthError(error.message || "Login failed. Please check your credentials and try again.");
      console.error("Login error:", error);
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
              <h1 className="text-2xl sm:text-3xl font-black tracking-tighter gradient-text">MPSAJMER CONNECT</h1>
            </div>
          </Link>
          <div className="space-y-1">
            <h2 className="text-3xl font-bold text-foreground">Welcome Back</h2>
            <p className="text-muted-foreground font-light">
              Enter your credentials to access your alumni network
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
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between ml-1">
                      <FormLabel className="text-foreground/70 font-medium">Password</FormLabel>
                      <Link to="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                        Forgot?
                      </Link>
                    </div>
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
              <Button 
                type="submit" 
                size="lg"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" 
                disabled={isLoading}
              >
                {isLoading ? <LoadingSpinner size="sm" /> : "Sign in to Account"}
              </Button>
            </form>
          </Form>

          <div className="mt-8 pt-6 border-t border-border/30 text-center">
            <p className="text-muted-foreground text-sm">
              Don't have an account yet?{" "}
              <Link to="/register" className="text-primary hover:text-primary/80 font-bold transition-colors">
                Join the network
              </Link>
            </p>
          </div>
        </div>
        
        <p className="text-center text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em]">
          Official Alumni Platform of MPS Ajmer
        </p>
      </div>
    </div>
  );
}
