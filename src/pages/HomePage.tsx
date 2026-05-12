import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  Users,
  MessageSquare,
  Briefcase,
  ChevronRight,
  Star,
  ArrowRight,
  Sparkles,
  Globe,
  Award,
  Zap,
  BookOpen
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Footer } from "@/shared/layout/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-background selection:bg-primary/30 text-foreground overflow-x-hidden">
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-background/70 backdrop-blur-md border-b border-border/50 shadow-sm transition-all duration-300">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src="/logo.png" alt="MPS Ajmer Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-md" />
            <div className="flex flex-col sm:flex-row sm:items-center">
              <span className="text-base sm:text-lg lg:text-xl font-bold tracking-tight gradient-text hidden lg:inline-block">
                Maheshwari Public School, Ajmer
              </span>
              <span className="text-base sm:text-lg font-bold tracking-tight gradient-text hidden sm:inline-block lg:hidden">
                MPS Ajmer Alumni
              </span>
              <span className="text-base font-bold tracking-tight gradient-text sm:hidden">
                MPS Ajmer
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <Button asChild variant="ghost" className="px-3 sm:px-4 text-foreground hover:bg-primary/10 transition-colors">
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 rounded-full px-4 sm:px-6 text-sm sm:text-base">
              <Link to="/register">Join Network</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex items-center min-h-[90vh]">
        {/* Background Gradients & Orbs */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-[128px] animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-accent/20 rounded-full mix-blend-multiply filter blur-[128px] animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="container mx-auto px-6 relative z-10 flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-sm w-max mx-auto lg:mx-0 shadow-inner backdrop-blur-sm">
              <Sparkles className="w-4 h-4" />
              <span>The Official Global Alumni Network</span>
            </div>

            <h1 className="fluid-heading-1 font-extrabold tracking-tight leading-[1.1]">
              Reconnect with your <br className="hidden lg:block" />
              <span className="gradient-text animate-gradient-x">Alma Mater</span>
            </h1>

            <p className="text-lg lg:text-xl text-muted-foreground font-light max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Step into the official community for Maheshwari Public School, Ajmer alumni. Reconnect with classmates, share opportunities, and support the community.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <Button asChild size="lg" className="h-14 px-8 text-lg rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/30 transition-all hover:-translate-y-1 group">
                <Link to="/register">
                  Join the Community
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-border/50 hover:bg-muted/50 backdrop-blur-sm transition-all hover:-translate-y-1">
                <Link to="/directory">Explore Directory</Link>
              </Button>
            </div>
          </div>

          <div className="flex-1 relative hidden lg:block">
            <div className="relative w-full max-w-lg mx-auto aspect-square">
              {/* Decorative rings */}
              <div className="absolute inset-0 border border-primary/20 rounded-full animate-[spin_60s_linear_infinite]"></div>
              <div className="absolute inset-4 border border-accent/20 rounded-full animate-[spin_40s_linear_infinite_reverse]"></div>

              {/* Main Image */}
              <div className="absolute inset-12 rounded-full overflow-hidden border-8 border-background/50 shadow-2xl">
                <img src="/hero-mpsajmer.png" alt="MPS Ajmer Campus" className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1000&auto=format&fit=crop";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </header>


      {/* Features Showcase */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary">Discover The Platform</h2>
            <h3 className="text-3xl md:text-5xl font-bold text-foreground">Everything you need to thrive</h3>
            <p className="text-xl text-muted-foreground">The central hub for our alumni community to stay connected and grow together.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Alumni Directory",
                desc: "Smart search to find classmates by graduation year, location, or industry.",
                color: "from-primary/10 to-primary/5",
                iconColor: "text-primary"
              },
              {
                icon: Briefcase,
                title: "Exclusive Job Board",
                desc: "Access roles posted by fellow alumni at top companies around the world.",
                color: "from-accent/10 to-accent/5",
                iconColor: "text-accent"
              },
              {
                icon: GraduationCap,
                title: "Mentorship Program",
                desc: "Get guidance from experienced professionals or give back to recent grads.",
                color: "from-primary/10 to-primary/5",
                iconColor: "text-primary"
              },
              {
                icon: MessageSquare,
                title: "Community Groups",
                desc: "Join groups based on your interests, industry, or geographical region.",
                color: "from-accent/10 to-accent/5",
                iconColor: "text-accent"
              },
              {
                icon: BookOpen,
                title: "News & Updates",
                desc: "Stay informed about the latest school news, achievements, and milestones.",
                color: "from-primary/10 to-primary/5",
                iconColor: "text-primary"
              },
              {
                icon: Star,
                title: "Events & Reunions",
                desc: "RSVP to global meetups, webinars, and official school reunions.",
                color: "from-accent/10 to-accent/5",
                iconColor: "text-accent"
              }
            ].map((feature, i) => (
              <div key={i} className="group relative p-8 rounded-3xl bg-card border border-border hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 overflow-hidden hover:-translate-y-2">
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                <div className="relative z-10">
                  <div className={`w-14 h-14 rounded-2xl bg-background border border-border shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                    <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
                  </div>
                  <h4 className="text-2xl font-bold mb-3 text-foreground">{feature.title}</h4>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2000&auto=format&fit=crop')] mix-blend-overlay opacity-20 bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/90 to-primary/80"></div>

        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="max-w-4xl mx-auto backdrop-blur-sm bg-black/10 p-10 md:p-16 rounded-3xl border border-white/10 shadow-2xl">
            <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6">Your network is your net worth.</h2>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto font-light">
              Don't miss out on the value of the MPS Ajmer alumni network. Join your fellow graduates today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="h-16 px-10 text-lg rounded-full bg-white text-primary hover:bg-gray-100 shadow-xl hover:-translate-y-1 transition-all border-none">
                <Link to="/register">Create Your Profile</Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="h-16 px-10 text-lg rounded-full border border-white/60 bg-transparent text-white hover:bg-white/10 hover:text-white hover:-translate-y-1 transition-all">
                <Link to="/login">Sign In to Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer showFullFooter={true} isLandingPage={true} />
    </div>
  );
}
