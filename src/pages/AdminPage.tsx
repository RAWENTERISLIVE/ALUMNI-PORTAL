import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, UserX, Check, X, UserCheck, Building, Users, Briefcase, MessageSquare, Shield, Trash2, UserPlus, UserMinus, RotateCcw, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import apiService from "@/services/apiService";
import Phase1Dashboard from "@/components/admin/Phase1Dashboard";

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  status: 'pending' | 'active' | 'suspended' | 'deleted';
  admissionNumber: string;
  admissionYear: string; // changed from graduationYear
  isVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  suspendedUsers: number;
  adminUsers: number;
  superAdminUsers: number;
  recentRegistrations: number;
  totalJobs: number;
  totalGroups: number;
  totalPosts: number;
}

interface Report {
  id: string;
  type: string;
  description: string;
  reporter: string;
  target: string;
  status: 'pending' | 'resolved';
  createdAt: string;
}

interface Activity {
  id: string;
  action: string;
  details: string;
  date: string;
  user: string;
}

export default function AdminPage() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    suspendedUsers: 0,
    adminUsers: 0,
    superAdminUsers: 0,
    recentRegistrations: 0,
    totalJobs: 0,
    totalGroups: 0,
    totalPosts: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');

  // Check if user has admin permissions
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  const isSuperAdmin = currentUser?.role === 'super_admin';

  // Redirect if not admin
  useEffect(() => {
    if (!loading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive"
      });
      // Redirect would happen here in a real app
    }
  }, [isAdmin, loading, toast]);

  // Load initial data
  useEffect(() => {
    loadData();
  }, [currentPage, statusFilter, roleFilter, searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [usersResponse, pendingResponse, statsResponse, reportsResponse] = await Promise.all([
        apiService.getAllUsers({
          page: currentPage,
          limit: 10,
          status: statusFilter || undefined,
          role: roleFilter || undefined,
          search: searchTerm || undefined,
        }),
        apiService.getPendingUsers(),
        apiService.getUserStats(),
        apiService.getReports({ page: 1, limit: 50 })
      ]);

      if (usersResponse.success) {
        setUsers(usersResponse.users || []);
        if (usersResponse.pagination) {
          setTotalPages(usersResponse.pagination.pages);
        }
      }

      if (pendingResponse.success) {
        setPendingUsers(pendingResponse.users || []);
      }

      if (statsResponse.success) {
        setStats(statsResponse.stats || stats);
      }

      if (reportsResponse.success) {
        setReports(reportsResponse.data || []);
      }

      // Initialize empty activities array
      setActivities([]);
    } catch (error: any) {
      console.error('Failed to load admin data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load admin data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: () => Promise<void>, loadingKey: string) => {
    try {
      setActionLoading(loadingKey);
      await action();
      await loadData(); // Refresh data
    } catch (error: any) {
      console.error('Action failed:', error);
      toast({
        title: "Action Failed",
        description: error.message || "An error occurred.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const approveUser = async (userId: string, userName: string) => {
    await handleAction(async () => {
      const response = await apiService.approveUser(userId);
      if (response.success) {
        toast({
          title: "User Approved",
          description: `${userName} has been approved and can now access the platform.`,
        });
      }
    }, `approve-${userId}`);
  };

  const rejectUser = async (userId: string, userName: string) => {
    await handleAction(async () => {
      const response = await apiService.rejectUser(userId);
      if (response.success) {
        toast({
          title: "User Rejected",
          description: `${userName}'s registration has been rejected.`,
        });
      }
    }, `reject-${userId}`);
  };

  const suspendUser = async (userId: string, userName: string) => {
    await handleAction(async () => {
      const response = await apiService.suspendUser(userId);
      if (response.success) {
        toast({
          title: "User Suspended",
          description: `${userName} has been suspended from the platform.`,
        });
      }
    }, `suspend-${userId}`);
  };

  const reactivateUser = async (userId: string, userName: string) => {
    await handleAction(async () => {
      const response = await apiService.reactivateUser(userId);
      if (response.success) {
        toast({
          title: "User Reactivated",
          description: `${userName} has been reactivated.`,
        });
      }
    }, `reactivate-${userId}`);
  };

  const promoteToAdmin = async (userId: string, userName: string) => {
    await handleAction(async () => {
      const response = await apiService.promoteToAdmin(userId);
      if (response.success) {
        toast({
          title: "User Promoted",
          description: `${userName} has been promoted to admin.`,
        });
      }
    }, `promote-${userId}`);
  };

  const demoteAdmin = async (userId: string, userName: string) => {
    await handleAction(async () => {
      const response = await apiService.demoteAdmin(userId);
      if (response.success) {
        toast({
          title: "Admin Demoted",
          description: `${userName} has been demoted to regular user.`,
        });
      }
    }, `demote-${userId}`);
  };

  const deleteUser = async (userId: string, userName: string) => {
    await handleAction(async () => {
      const response = await apiService.deleteUser(userId);
      if (response.success) {
        toast({
          title: "User Deleted",
          description: `${userName} has been permanently deleted.`,
        });
      }
    }, `delete-${userId}`);
  };

  const resolveReport = async (reportId: string) => {
    try {
      const response = await apiService.updateReportStatus(reportId, 'resolved');
      
      if (response.success) {
        setReports(prev => prev.map(report => 
          report.id === reportId ? { ...report, status: 'resolved' as const } : report
        ));
        toast({
          title: "Report Resolved",
          description: "The report has been marked as resolved.",
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to resolve report",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error resolving report:', error);
      toast({
        title: "Error",
        description: "An error occurred while resolving the report",
        variant: "destructive"
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Admin Dashboard"
        description="Manage users, reports, and platform activity"
      />
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeUsers} active, {stats.pendingUsers} pending
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.adminUsers + stats.superAdminUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.superAdminUsers} super admins, {stats.adminUsers} admins
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.suspendedUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Suspended accounts
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentRegistrations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registrations in last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="phase1">
        <TabsList className="mb-4">
          <TabsTrigger value="phase1">
            <Activity className="h-4 w-4 mr-2" />
            Phase 1 Status
          </TabsTrigger>
          <TabsTrigger value="users">All Users</TabsTrigger>
          <TabsTrigger value="pending">
            Pending Approval ({pendingUsers.length})
          </TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>
        
        <TabsContent value="phase1">
          <Phase1Dashboard />
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <CardTitle>User Management</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      className="pl-8 w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">All Roles</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Admission</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.role)}>
                          {user.role.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(user.status)}>
                          {user.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.admissionNumber}</TableCell>
                      <TableCell>{user.admissionYear}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {user.status === 'suspended' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => reactivateUser(user.id, user.name)}
                              disabled={actionLoading === `reactivate-${user.id}`}
                            >
                              {actionLoading === `reactivate-${user.id}` ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                <RotateCcw className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                          
                          {user.status === 'active' && user.role !== 'super_admin' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => suspendUser(user.id, user.name)}
                              disabled={actionLoading === `suspend-${user.id}`}
                            >
                              {actionLoading === `suspend-${user.id}` ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                <UserX className="h-3 w-3" />
                              )}
                            </Button>
                          )}

                          {isSuperAdmin && user.role === 'user' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => promoteToAdmin(user.id, user.name)}
                              disabled={actionLoading === `promote-${user.id}`}
                            >
                              {actionLoading === `promote-${user.id}` ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                <Shield className="h-3 w-3" />
                              )}
                            </Button>
                          )}

                          {isSuperAdmin && user.role === 'admin' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => demoteAdmin(user.id, user.name)}
                              disabled={actionLoading === `demote-${user.id}`}
                            >
                              {actionLoading === `demote-${user.id}` ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                <UserMinus className="h-3 w-3" />
                              )}
                            </Button>
                          )}

                          {isSuperAdmin && user.role !== 'super_admin' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={actionLoading === `delete-${user.id}`}
                                >
                                  {actionLoading === `delete-${user.id}` ? (
                                    <LoadingSpinner size="sm" />
                                  ) : (
                                    <Trash2 className="h-3 w-3" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to permanently delete {user.name}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteUser(user.id, user.name)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="px-4 py-2 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending User Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No pending user approvals
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Admission Number</TableHead>
                      <TableHead>Registration Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.admissionNumber}</TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => approveUser(user.id, user.name)}
                              disabled={actionLoading === `approve-${user.id}`}
                            >
                              {actionLoading === `approve-${user.id}` ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                <>
                                  <Check className="h-3 w-3 mr-1" />
                                  Approve
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => rejectUser(user.id, user.name)}
                              disabled={actionLoading === `reject-${user.id}`}
                            >
                              {actionLoading === `reject-${user.id}` ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                <>
                                  <X className="h-3 w-3 mr-1" />
                                  Reject
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Content Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Reported By</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        {report.type === "Post" && <MessageSquare className="h-4 w-4 inline mr-1" />}
                        {report.type === "User" && <Users className="h-4 w-4 inline mr-1" />}
                        {report.type === "Job" && <Briefcase className="h-4 w-4 inline mr-1" />}
                        {report.type}
                      </TableCell>
                      <TableCell className="font-medium">{report.description}</TableCell>
                      <TableCell>{report.reporter}</TableCell>
                      <TableCell>{report.target}</TableCell>
                      <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant={report.status === "pending" ? "secondary" : "outline"}
                        >
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {report.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resolveReport(report.id)}
                            className="h-8 px-2"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Resolve
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Platform Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium">{activity.action}</TableCell>
                      <TableCell>{activity.details}</TableCell>
                      <TableCell>{activity.user}</TableCell>
                      <TableCell>{activity.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}