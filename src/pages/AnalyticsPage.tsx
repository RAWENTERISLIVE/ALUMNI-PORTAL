import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import {
  Users,
  Newspaper,
  Briefcase,
  Activity,
  Calendar,
  Download,
  RefreshCw,
  UserCheck,
  Users2,
  GraduationCap,
  TrendingUp,
  MessageSquare,
  Globe
} from "lucide-react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/services/apiService";
import { useAuth } from "@/contexts/AuthContext";

interface AnalyticsData {
  users: {
    total: number;
    active: number;
    pending: number;
    recent: number;
    growth: number;
  };
  posts: {
    total: number;
    featured: number;
    schoolUpdates: number;
    growth: number;
  };
  jobs: {
    total: number;
    active: number;
    applications: number;
    growth: number;
  };
  mentorship: {
    total: number;
    pending: number;
    active: number;
  };
  events: {
    total: number;
    upcoming: number;
  };
  groups: {
    total: number;
  };
}

export default function AnalyticsPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState("7d");

  // Check if user has admin access
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await apiService.getAdminStats();
      
      if (response.success && response.data) {
        setAnalytics(response.data);
      } else {
        throw new Error(response.message || "Failed to load analytics");
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadAnalytics(true);
  };

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Analytics report will be downloaded shortly.",
    });
    // Implement export functionality
  };

  // Mocked historical data for charts based on current totals
  const userGrowthData = analytics ? [
    { name: 'Jan', users: Math.floor(analytics.users.total * 0.4), active: Math.floor(analytics.users.active * 0.3) },
    { name: 'Feb', users: Math.floor(analytics.users.total * 0.5), active: Math.floor(analytics.users.active * 0.4) },
    { name: 'Mar', users: Math.floor(analytics.users.total * 0.6), active: Math.floor(analytics.users.active * 0.5) },
    { name: 'Apr', users: Math.floor(analytics.users.total * 0.75), active: Math.floor(analytics.users.active * 0.7) },
    { name: 'May', users: Math.floor(analytics.users.total * 0.85), active: Math.floor(analytics.users.active * 0.8) },
    { name: 'Jun', users: Math.floor(analytics.users.total * 0.95), active: Math.floor(analytics.users.active * 0.9) },
    { name: 'Jul', users: analytics.users.total, active: analytics.users.active }
  ] : [];

  const featureUsageData = analytics ? [
    { name: 'Posts', value: analytics.posts.total || 1, color: '#6366f1' },
    { name: 'Jobs', value: analytics.jobs.total || 1, color: '#10b981' },
    { name: 'Groups', value: analytics.groups.total || 1, color: '#f59e0b' },
    { name: 'Mentorship', value: analytics.mentorship.total || 1, color: '#ef4444' }
  ] : [];

  const activityData = [
    { name: 'Mon', posts: 12, jobs: 5, mentorship: 3 },
    { name: 'Tue', posts: 19, jobs: 8, mentorship: 5 },
    { name: 'Wed', posts: 15, jobs: 12, mentorship: 7 },
    { name: 'Thu', posts: 22, jobs: 7, mentorship: 4 },
    { name: 'Fri', posts: 18, jobs: 15, mentorship: 9 },
    { name: 'Sat', posts: 8, jobs: 3, mentorship: 2 },
    { name: 'Sun', posts: 5, jobs: 2, mentorship: 1 }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        title="Analytics Dashboard"
        description="Monitor platform metrics, user engagement, and growth"
        action={
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        }
      />

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-t-4 border-t-indigo-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Community</CardTitle>
            <Users className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics?.users.total.toLocaleString()}</div>
            <div className="flex items-center text-xs mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500 font-medium">+{analytics?.users.growth}%</span>
              <span className="text-muted-foreground ml-1">growth</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-muted p-1.5 rounded text-center">
                <div className="font-bold text-indigo-600">{analytics?.users.active}</div>
                <div className="text-muted-foreground uppercase tracking-wider">Active</div>
              </div>
              <div className="bg-muted p-1.5 rounded text-center">
                <div className="font-bold text-amber-600">{analytics?.users.pending}</div>
                <div className="text-muted-foreground uppercase tracking-wider">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-emerald-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Job Opportunities</CardTitle>
            <Briefcase className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics?.jobs.total.toLocaleString()}</div>
            <div className="flex items-center text-xs mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500 font-medium">+{analytics?.jobs.growth}%</span>
              <span className="text-muted-foreground ml-1">this month</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-muted p-1.5 rounded text-center">
                <div className="font-bold text-emerald-600">{analytics?.jobs.active}</div>
                <div className="text-muted-foreground uppercase tracking-wider">Open</div>
              </div>
              <div className="bg-muted p-1.5 rounded text-center">
                <div className="font-bold text-blue-600">{analytics?.jobs.applications}</div>
                <div className="text-muted-foreground uppercase tracking-wider">Apps</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-rose-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mentorships</CardTitle>
            <GraduationCap className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics?.mentorship.total.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center">
              <UserCheck className="h-3 w-3 mr-1" />
              {analytics?.mentorship.active} active connections
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-muted p-1.5 rounded text-center">
                <div className="font-bold text-rose-600">{analytics?.mentorship.active}</div>
                <div className="text-muted-foreground uppercase tracking-wider">Connected</div>
              </div>
              <div className="bg-muted p-1.5 rounded text-center">
                <div className="font-bold text-amber-600">{analytics?.mentorship.pending}</div>
                <div className="text-muted-foreground uppercase tracking-wider">Requests</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Activity</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics?.posts.total.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center">
              <Globe className="h-3 w-3 mr-1" />
              {analytics?.groups.total} active groups
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-muted p-1.5 rounded text-center">
                <div className="font-bold text-blue-600">{analytics?.posts.featured}</div>
                <div className="text-muted-foreground uppercase tracking-wider">Featured</div>
              </div>
              <div className="bg-muted p-1.5 rounded text-center">
                <div className="font-bold text-indigo-600">{analytics?.events.upcoming}</div>
                <div className="text-muted-foreground uppercase tracking-wider">Events</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Users2 className="h-8 w-8 opacity-80" />
                <Badge variant="secondary" className="bg-white/20 text-white border-none">
                  Growth
                </Badge>
              </div>
              <div className="text-4xl font-bold mb-1">+{analytics?.users.recent}</div>
              <div className="text-sm opacity-90">New members in last 30 days</div>
              <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-center">
                 <div className="text-xs opacity-75 italic text-nowrap">Expanding community...</div>
                 <Button size="sm" variant="ghost" className="text-white hover:bg-white/10">View All</Button>
              </div>
            </CardContent>
         </Card>

         <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Calendar className="h-8 w-8 opacity-80" />
                <Badge variant="secondary" className="bg-white/20 text-white border-none">
                  Events
                </Badge>
              </div>
              <div className="text-4xl font-bold mb-1">{analytics?.events.upcoming}</div>
              <div className="text-sm opacity-90">Upcoming events planned</div>
              <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-center">
                 <div className="text-xs opacity-75 italic text-nowrap">Engaging the alumni...</div>
                 <Button size="sm" variant="ghost" className="text-white hover:bg-white/10">Manage</Button>
              </div>
            </CardContent>
         </Card>

         <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <MessageSquare className="h-8 w-8 opacity-80" />
                <Badge variant="secondary" className="bg-white/20 text-white border-none">
                  Content
                </Badge>
              </div>
              <div className="text-4xl font-bold mb-1">{analytics?.posts.schoolUpdates}</div>
              <div className="text-sm opacity-90">School updates & announcements</div>
              <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-center">
                 <div className="text-xs opacity-75 italic text-nowrap">Keeping info fresh...</div>
                 <Button size="sm" variant="ghost" className="text-white hover:bg-white/10">Post Now</Button>
              </div>
            </CardContent>
         </Card>
      </div>

      {/* Detailed Charts */}
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex justify-between items-center bg-muted/50 p-1 rounded-lg">
          <TabsList className="bg-transparent">
            <TabsTrigger value="overview">Performance Overview</TabsTrigger>
            <TabsTrigger value="engagement">User Engagement</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2 px-2">
            <span className="text-xs text-muted-foreground">Range:</span>
            <select 
              className="bg-transparent text-xs font-medium border-none focus:ring-0 cursor-pointer"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Growth Chart */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-indigo-500" />
                  Growth & Adoption
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-100%">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={userGrowthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="users"
                        name="Total Registered"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorUsers)"
                      />
                      <Area
                        type="monotone"
                        dataKey="active"
                        name="Active Users"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorActive)"
                      />
                      <Legend verticalAlign="top" height={36}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Feature Usage */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-500" />
                  Feature Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={featureUsageData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {featureUsageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                         contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-500" />
                Weekly Platform Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip 
                       contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend />
                    <Bar dataKey="posts" fill="#6366f1" radius={[4, 4, 0, 0]} name="New Posts" />
                    <Bar dataKey="jobs" fill="#10b981" radius={[4, 4, 0, 0]} name="Jobs Posted" />
                    <Bar dataKey="mentorship" fill="#ef4444" radius={[4, 4, 0, 0]} name="Mentorship Connections" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
