
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
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-muted/30">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md mx-auto space-y-5 sm:space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground/90">Alumni Connect</h1>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">Welcome Back</h2>
          <p className="text-muted-foreground">
            Enter your credentials to access your alumni network
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 sm:p-8 shadow-lg">
          {authError && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4 text-sm">
              {authError}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-white" 
                disabled={isLoading}
              >
                {isLoading ? <LoadingSpinner size="sm" /> : "Sign in"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="text-foreground hover:text-foreground/90 font-medium hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
