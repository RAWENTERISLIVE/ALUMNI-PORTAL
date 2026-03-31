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
    name: "",
    admissionNumber: "",
    admissionYear: "",
    accountType: "ALUMNI",
    contactEmail: "",
    contactPhone: "",
    city: "",
    country: "",
    company: "",
    jobTitle: "",
    location: "",
    isAvailableAsMentor: false,
    bio: "",
    headline: "",
    linkedInProfile: "",
    skills: [] as string[],
    status: "ACTIVE",
    role: "USER",
    isVerified: false,
    hasPremiumBadge: false,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        name: user.name || "",
        admissionNumber: user.admissionNumber || "",
        admissionYear: user.admissionYear || "",
        accountType: user.accountType || "ALUMNI",
        contactEmail: user.contactEmail || "",
        contactPhone: user.contactPhone || "",
        city: user.city || "",
        country: user.country || "",
        company: user.company || "",
        jobTitle: user.jobTitle || "",
        location: user.location || "",
        isAvailableAsMentor: user.isAvailableAsMentor || false,
        bio: user.bio || "",
        headline: user.headline || "",
        linkedInProfile: user.linkedInProfile || "",
        skills: Array.isArray(user.skills) ? user.skills : [],
        status: user.status || "ACTIVE",
        role: user.role || "USER",
        isVerified: user.isVerified || false,
        hasPremiumBadge: user.hasPremiumBadge || false,
      });
    }
  }, [user, isOpen]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.email?.trim()) {
      toast({
        title: "Validation Error",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name?.trim()) {
      toast({
        title: "Validation Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.admissionNumber?.trim()) {
      toast({
        title: "Validation Error",
        description: "Admission number is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.admissionYear?.trim()) {
      toast({
        title: "Validation Error",
        description: "Admission year is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.adminEditUser(user.id, formData);

      if (response.success) {
        toast({
          title: "Success",
          description: "User updated successfully",
        });
        if (response.data) {
          onUserUpdated(response.data);
        }
        onClose();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update user",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User Details</DialogTitle>
          <DialogDescription>
            Update core user information like email, admission details, and contact information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Personal Information */}
          <div className="space-y-3 border-b pb-4">
            <h3 className="text-sm font-semibold">Personal Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="John Doe"
                className="border-red-200"
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="john@example.com"
                className="border-red-200"
              />
            </div>

            <div>
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleChange("contactEmail", e.target.value)}
                placeholder="personal@example.com"
              />
            </div>

            <div>
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                value={formData.contactPhone}
                onChange={(e) => handleChange("contactPhone", e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          {/* Academic Information */}
          <div className="space-y-3 border-b pb-4">
            <h3 className="text-sm font-semibold">Academic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="admissionNumber">Admission Number *</Label>
                <Input
                  id="admissionNumber"
                  value={formData.admissionNumber}
                  onChange={(e) => handleChange("admissionNumber", e.target.value)}
                  placeholder="ADM001"
                  className="border-red-200"
                />
              </div>
              <div>
                <Label htmlFor="admissionYear">Admission Year *</Label>
                <Input
                  id="admissionYear"
                  value={formData.admissionYear}
                  onChange={(e) => handleChange("admissionYear", e.target.value)}
                  placeholder="2020"
                  className="border-red-200"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="accountType">Account Type</Label>
              <Select
                value={formData.accountType}
                onValueChange={(value) => handleChange("accountType", value)}
              >
                <SelectTrigger id="accountType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALUMNI">Alumni</SelectItem>
                  <SelectItem value="FACULTY">Faculty</SelectItem>
                  <SelectItem value="STUDENT">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-3 border-b pb-4">
            <h3 className="text-sm font-semibold">Professional Information</h3>

            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleChange("company", e.target.value)}
                placeholder="Acme Corp"
              />
            </div>

            <div>
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                value={formData.jobTitle}
                onChange={(e) => handleChange("jobTitle", e.target.value)}
                placeholder="Senior Developer"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isAvailableAsMentor"
                checked={formData.isAvailableAsMentor}
                onCheckedChange={(checked) =>
                  handleChange("isAvailableAsMentor", checked)
                }
              />
              <Label htmlFor="isAvailableAsMentor" className="font-normal cursor-pointer">
                Available as Mentor
              </Label>
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Location Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="San Francisco"
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                  placeholder="United States"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="San Francisco, CA"
              />
            </div>
          </div>

          {/* Professional Profile */}
          <div className="space-y-3 border-b pb-4">
            <h3 className="text-sm font-semibold">Professional Profile</h3>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleChange("bio", e.target.value)}
                placeholder="A brief biography..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div>
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                value={formData.headline}
                onChange={(e) => handleChange("headline", e.target.value)}
                placeholder="Software Engineer at Tech Company"
              />
            </div>

            <div>
              <Label htmlFor="linkedInProfile">LinkedIn Profile</Label>
              <Input
                id="linkedInProfile"
                value={formData.linkedInProfile}
                onChange={(e) => handleChange("linkedInProfile", e.target.value)}
                placeholder="https://linkedin.com/in/username"
              />
            </div>

            <div>
              <Label htmlFor="skills">Skills (comma-separated)</Label>
              <Input
                id="skills"
                value={formData.skills.join(", ")}
                onChange={(e) => {
                  const skillsArray = e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter((s) => s.length > 0);
                  handleChange("skills", skillsArray);
                }}
                placeholder="JavaScript, React, Node.js"
              />
            </div>
          </div>

          {/* Admin Settings */}
          <div className="space-y-3 border-b pb-4 bg-amber-50 dark:bg-amber-950/30 p-3 rounded">
            <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">Admin Settings</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">User Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange("status", value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    <SelectItem value="DELETED">Deleted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="role">User Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleChange("role", value)}
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="MODERATOR">Moderator</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isVerified"
                checked={formData.isVerified}
                onCheckedChange={(checked) => handleChange("isVerified", checked)}
              />
              <Label htmlFor="isVerified" className="font-normal cursor-pointer">
                Mark as Verified
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasPremiumBadge"
                checked={formData.hasPremiumBadge}
                onCheckedChange={(checked) => handleChange("hasPremiumBadge", checked)}
              />
              <Label htmlFor="hasPremiumBadge" className="font-normal cursor-pointer">
                Grant Premium Badge
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Updating...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
