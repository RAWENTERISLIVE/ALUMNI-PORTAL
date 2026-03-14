import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Clock, Users, Shield, Database, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import apiService from '@/services/apiService';

interface Phase1StatusData {
  success: boolean;
  phase: string;
  title: string;
  status: 'completed' | 'in_progress' | 'failed';
  completionPercentage: number;
  checks: {
    superAdminsCreated: boolean;
    authenticationWorking: boolean;
    databaseConnected: boolean;
    uploadsDirectoryExists: boolean;
    rateLimitingActive: boolean;
  };
  message: string;
  readyForNextPhase: boolean;
}

const DEFAULT_CHECKS = {
  superAdminsCreated: false,
  authenticationWorking: false,
  databaseConnected: false,
  uploadsDirectoryExists: false,
  rateLimitingActive: false,
};

const normalizePhase1Status = (response: any): Phase1StatusData => {
  const checks = response?.checks ?? DEFAULT_CHECKS;
  const completionPercentage = typeof response?.completionPercentage === 'number'
    ? response.completionPercentage
    : Object.values(checks).filter(Boolean).length * 20;

  return {
    success: Boolean(response?.success),
    phase: response?.phase || 'phase1',
    title: response?.title || 'Phase 1 Status',
    status: (response?.status === 'completed' || response?.status === 'in_progress' || response?.status === 'failed')
      ? response.status
      : 'in_progress',
    completionPercentage,
    checks: {
      superAdminsCreated: Boolean(checks.superAdminsCreated),
      authenticationWorking: Boolean(checks.authenticationWorking),
      databaseConnected: Boolean(checks.databaseConnected),
      uploadsDirectoryExists: Boolean(checks.uploadsDirectoryExists),
      rateLimitingActive: Boolean(checks.rateLimitingActive),
    },
    message: response?.message || 'Phase 1 status endpoint is reachable.',
    readyForNextPhase: Boolean(response?.readyForNextPhase),
  };
};

interface SystemStats {
  users: {
    total: number;
    active: number;
    pending: number;
    suspended: number;
  };
  content: {
    posts: number;
    jobs: number;
  };
}

export default function Phase1Dashboard() {
  const [status, setStatus] = useState<Phase1StatusData | null>(null);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch Phase 1 status
      const phase1Response = await apiService.request('/status/phase1');
      if (phase1Response.success) {
        setStatus(normalizePhase1Status(phase1Response));
      }

      // Fetch system stats
      const systemResponse = await apiService.request('/status/system');
      if (systemResponse.success) {
        const stats = systemResponse.statistics || systemResponse.data?.statistics;
        if (stats) {
          setSystemStats(stats);
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch Phase 1 status:', error);
      toast({
        title: "Error",
        description: "Failed to load Phase 1 status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="text-center text-red-600">
        Failed to load Phase 1 status
      </div>
    );
  }

  const getStatusIcon = (checkStatus: boolean) => {
    return checkStatus ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <AlertCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-foreground/90">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Phase 1 Dashboard</h1>
          <p className="text-muted-foreground">Core Authentication & Security + Profiles</p>
        </div>
        <Button onClick={fetchData} variant="outline">
          <Activity className="h-4 w-4 mr-2" />
          Refresh Status
        </Button>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-foreground" />
            Phase 1 Status
          </CardTitle>
          <CardDescription>
            Current completion status of Phase 1 features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold">{status.title}</h3>
                {getStatusBadge(status.status)}
              </div>
              <p className="text-muted-foreground">{status.message}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-foreground">
                {status.completionPercentage}%
              </div>
              <div className="text-sm text-muted/300">Complete</div>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-primary h-3 rounded-full transition-all duration-300"
              style={{ width: `${status.completionPercentage}%` }}
            />
          </div>

          {status.readyForNextPhase && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-green-800 font-medium">
                  Ready for Phase 2 - Social & Content
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Checks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-foreground" />
            System Health Checks
          </CardTitle>
          <CardDescription>
            Core system components and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span>Super Admins Created</span>
              {getStatusIcon(status.checks.superAdminsCreated)}
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span>Authentication Working</span>
              {getStatusIcon(status.checks.authenticationWorking)}
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span>Database Connected</span>
              {getStatusIcon(status.checks.databaseConnected)}
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span>Uploads Directory</span>
              {getStatusIcon(status.checks.uploadsDirectoryExists)}
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span>Rate Limiting Active</span>
              {getStatusIcon(status.checks.rateLimitingActive)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {systemStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-foreground" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.users.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {systemStats.users.active}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                Pending Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {systemStats.users.pending}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                Suspended Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {systemStats.users.suspended}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Phase 1 Features Completed */}
      <Card>
        <CardHeader>
          <CardTitle>Phase 1 Features Implemented</CardTitle>
          <CardDescription>
            All core features for Phase 1 have been successfully implemented
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-green-700">✅ Authentication & Security</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• JWT-based login (1h access / 7d refresh)</li>
                <li>• Role-based access control (RBAC)</li>
                <li>• Admission number verification</li>
                <li>• Manual verification flow</li>
                <li>• Rate limiting on all auth endpoints</li>
                <li>• Password hashing with bcrypt</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-green-700">✅ User Management</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• User registration (standard + manual)</li>
                <li>• Admin approval workflow</li>
                <li>• User suspension/reactivation</li>
                <li>• Role promotion/demotion</li>
                <li>• Super admin auto-creation</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-green-700">✅ Profiles & Directory</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Rich user profiles with bio & headline</li>
                <li>• Privacy controls per section</li>
                <li>• Profile picture support</li>
                <li>• Alumni directory with search</li>
                <li>• User suggestions algorithm</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-blue-700">🚀 Ready for Phase 2</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Social Feed implementation</li>
                <li>• Connections system</li>
                <li>• Posts with rich media</li>
                <li>• Content moderation</li>
                <li>• Real-time updates</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
