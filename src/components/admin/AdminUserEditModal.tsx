import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import apiService from "@/services/apiService";

interface AdminUserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onUserUpdated: (updatedUser: any) => void;
}

export default function AdminUserEditModal({
  isOpen,
  onClose,
  user,
  onUserUpdated,
}: AdminUserEditModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    admissionNumber: "",
    admissionYear: "",
    graduationYear: "",
    accountType: "alumni",
    status: "active",
    role: "user",
    isVerified: false,
    hasPremiumBadge: false,
  });

  useEffect(() => {
    if (user) {
      let fName = user.firstName || "";
      let lName = user.lastName || "";
      
      if (!fName && !lName && user.name) {
        const parts = user.name.trim().split(/\s+/);
        if (parts.length > 1) {
          fName = parts[0];
          lName = parts.slice(1).join(" ");
        } else {
          fName = parts[0];
        }
      }

      setFormData({
        email: user.email || "",
        firstName: fName,
        lastName: lName,
        admissionNumber: user.admissionNumber || "",
        admissionYear: user.admissionYear || "",
        graduationYear: user.graduationYear || "",
        accountType: (user.accountType || "alumni").toLowerCase(),
        status: (user.status || "active").toLowerCase(),
        role: (user.role || "user").toLowerCase(),
        isVerified: user.isVerified || false,
        hasPremiumBadge: user.hasPremiumBadge || false,
      });
    }
  }, [user, isOpen]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      
      // Auto-determine admission year from admission number (e.g., 10168/19 -> 2019)
      if (field === "admissionNumber" && value && value.includes('/')) {
        const parts = value.split('/');
        const yearPart = parts[parts.length - 1];
        if (yearPart.length === 2 && /^\d+$/.test(yearPart)) {
          const yearInt = parseInt(yearPart, 10);
          const fullYear = yearInt > 50 ? `19${yearPart}` : `20${yearPart}`;
          next.admissionYear = fullYear;
        }
      }
      
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!formData.email?.trim()) {
      toast({ title: "Validation Error", description: "Email is required", variant: "destructive" });
      return;
    }

    if (!formData.firstName?.trim()) {
      toast({ title: "Validation Error", description: "First name is required", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Reconstruct the payload for the backend
      const payload = {
        ...formData,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        role: formData.role.toUpperCase(),
        status: formData.status.toUpperCase(),
        accountType: formData.accountType.toUpperCase(),
      };

      const response = await apiService.adminEditUser(user.id, payload);

      if (response.success) {
        toast({ title: "Success", description: "User updated successfully" });
        if (response.data) onUserUpdated(response.data);
        onClose();
      } else {
        toast({ title: "Error", description: response.message || "Failed to update user", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update user", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-none bg-background dark:bg-zinc-950 shadow-2xl">
        <div className="bg-primary/5 p-6 border-b border-border/50">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Edit User Details</DialogTitle>
            <DialogDescription className="text-muted-foreground/70">
              Manage core administrative data for {formData.firstName}.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* Names Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                placeholder="First name"
                className="bg-muted/30 border-border/50 focus:ring-primary/20 rounded-lg h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                placeholder="Last name"
                className="bg-muted/30 border-border/50 focus:ring-primary/20 rounded-lg h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="john@example.com"
              className="bg-muted/30 border-border/50 focus:ring-primary/20 rounded-lg h-11"
            />
          </div>

          {/* Academic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="admissionNumber" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admission Number</Label>
              <Input
                id="admissionNumber"
                value={formData.admissionNumber}
                onChange={(e) => handleChange("admissionNumber", e.target.value)}
                placeholder="e.g. 10168/19"
                className="bg-muted/30 border-border/50 focus:ring-primary/20 rounded-lg h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admissionYear" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Adm. Year (Auto)</Label>
              <Input
                id="admissionYear"
                value={formData.admissionYear}
                readOnly
                className="bg-muted/10 border-border/50 text-muted-foreground rounded-lg h-11 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="graduationYear" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Class of (Year)</Label>
              <Input
                id="graduationYear"
                value={formData.graduationYear}
                onChange={(e) => handleChange("graduationYear", e.target.value)}
                placeholder="e.g. 2026"
                className="bg-muted/30 border-border/50 focus:ring-primary/20 rounded-lg h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountType" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account Type</Label>
              <Select
                value={formData.accountType}
                onValueChange={(value) => handleChange("accountType", value)}
              >
                <SelectTrigger id="accountType" className="h-11 bg-muted/30 border-border/50 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alumni">Alumni</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Admin Controls */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange("status", value)}
                >
                  <SelectTrigger id="status" className="h-10 bg-background/50 border-primary/20 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleChange("role", value)}
                >
                  <SelectTrigger id="role" className="h-10 bg-background/50 border-primary/20 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isVerified"
                  checked={formData.isVerified}
                  onCheckedChange={(checked) => handleChange("isVerified", checked)}
                  className="data-[state=checked]:bg-emerald-500 border-emerald-500/50"
                />
                <Label htmlFor="isVerified" className="text-sm font-medium cursor-pointer">Verified Member</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="hasPremiumBadge"
                  checked={formData.hasPremiumBadge}
                  onCheckedChange={(checked) => handleChange("hasPremiumBadge", checked)}
                  className="data-[state=checked]:bg-amber-500 border-amber-500/50"
                />
                <Label htmlFor="hasPremiumBadge" className="text-sm font-medium cursor-pointer">Premium Badge</Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-muted/20 border-t border-border/50 gap-2">
          <Button variant="ghost" onClick={onClose} disabled={loading} className="rounded-lg h-11 px-6">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="rounded-lg h-11 px-8 bg-primary hover:bg-primary/90">
            {loading ? <LoadingSpinner size="sm" /> : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
