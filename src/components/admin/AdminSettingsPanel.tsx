import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, RotateCcw, X } from "lucide-react";

type AdminRole = "user" | "moderator" | "admin" | "super_admin";
type ModulePermission = "posts" | "groups" | "events" | "jobs" | "messages" | "mentorship" | "directory";
type AccountType = "student" | "alumni" | "faculty";
type InstitutionUserType = "alumni" | "student" | "faculty" | "staff" | "guest";
type CreationPolicy = "open" | "alumni_only" | "admin_approved";
type DirectoryPrivacy = "public" | "alumni" | "restricted";
type DmPermission = "all" | "same_type_only" | "alumni_faculty_only" | "approved_connections";
type DigestMode = "instant" | "daily" | "weekly" | "off";

interface AdminSettingsData {
  institutionRules: {
    admissionNumberPattern: string;
    enforceAdmissionNumberUniqueness: boolean;
    minAdmissionYear: number;
    maxAdmissionYear: number;
    userTypePolicies: Record<InstitutionUserType, { allowRegistration: boolean; requiresManualApproval: boolean }>;
    enforceDomainAllowlist: boolean;
    allowedSignupDomainsCsv: string;
  };
  contentLifecycle: {
    posts: {
      commentsEnabledByDefault: boolean;
      mediaLimitMb: number;
      linkPreviewEnabled: boolean;
      editWindowMinutes: number;
      archiveAfterInactivityDays: number;
    };
    events: {
      approvalRequired: boolean;
      rsvpCap: number;
      waitlistModeEnabled: boolean;
      autoCloseHoursBeforeEvent: number;
      attendanceTrackingEnabled: boolean;
    };
    jobs: {
      employerVerificationRequired: boolean;
      postingDurationDays: number;
      featuredJobSlots: number;
      applicationDeadlineRequired: boolean;
    };
  };
  automation: {
    autoApproveTrustedDomain: boolean;
    autoApproveGraduationYearMatch: boolean;
    autoApproveVerifiedAlumniRecord: boolean;
    autoFlagReportThreshold: number;
    autoSuspendReportThreshold: number;
    suspiciousActivitySpikeThreshold: number;
    cleanup: {
      inactiveAccountsAfterDays: number;
      expiredJobsAfterDays: number;
      oldEventsAfterDays: number;
      staleMentorshipRequestsAfterDays: number;
      unreadNotificationRetentionDays: number;
    };
  };
  communication: {
    notificationTemplates: {
      approval: string;
      rejection: string;
      reportResolution: string;
      eventReminder: string;
      mentorshipMatch: string;
    };
    digestByModule: {
      posts: DigestMode;
      groups: DigestMode;
      events: DigestMode;
      jobs: DigestMode;
      mentorship: DigestMode;
      messages: DigestMode;
    };
    broadcastControls: {
      campusWideAnnouncements: boolean;
      alumniBatchEmails: boolean;
      emergencyAlertsEnabled: boolean;
      broadcastsPerHourLimit: number;
    };
  };
  adminOperations: {
    moderatorScopes: Record<ModulePermission, boolean>;
    audit: {
      immutableActionLogs: boolean;
      exportableModerationHistory: boolean;
      requireReasonForSuspensions: boolean;
      requireReasonForDeletions: boolean;
    };
    operationalFlags: {
      betaRolloutMode: boolean;
      maintenanceMode: boolean;
      readOnlyMode: boolean;
      campusSpecificReleaseControl: boolean;
    };
  };
  accessControl: {
    rolePermissions: Record<AdminRole, Record<ModulePermission, boolean>>;
    inviteOnlyAdminCreation: boolean;
    moderatorApprovalRequired: boolean;
    adminSessionTimeoutMinutes: number;
    enforceAdmin2FA: boolean;
    loginAlertsForAdmins: boolean;
    passwordStrength: "standard" | "strong" | "very_strong";
  };
  alumniDataRules: {
    requiredFieldsByType: Record<AccountType, string[]>;
    enforceAdmissionNumberUniqueness: boolean;
    alumniVerification: {
      requireAdmissionProof: boolean;
      requireGraduationYearCheck: boolean;
      requireManualReviewOnMismatch: boolean;
    };
    badgeRules: {
      byGraduationYear: boolean;
      byChapter: boolean;
      byDonorStatus: boolean;
      byMentorStatus: boolean;
    };
    approvalRulesByType: Record<AccountType, "auto" | "moderator" | "admin">;
  };
  moderation: {
    severityThresholds: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
    autoHideAfterReports: number;
    bannedWordsCsv: string;
    scamLinkFilterEnabled: boolean;
    spamPatternFilterEnabled: boolean;
    allowedAttachmentTypesCsv: string;
    maxAttachmentSizeMb: number;
    suspensionPresets: {
      h24: boolean;
      d7: boolean;
      permanent: boolean;
    };
    appeals: {
      allowAppeals: boolean;
      allowAppealsForPermanentSuspension: boolean;
      moderatorActionTemplate: string;
    };
  };
  community: {
    groupCreationPolicy: CreationPolicy;
    eventCreationPolicy: CreationPolicy;
    jobsRequirePreModeration: boolean;
    jobsRequireCompanyVerification: boolean;
    defaultJobExpiryDays: number;
    mentorshipMaxMenteesPerMentor: number;
    mentorshipMonthlyBookingLimit: number;
    mentorshipFeedbackRequired: boolean;
    directoryPrivacy: DirectoryPrivacy;
    dmPermission: DmPermission;
    postAttachmentLimitMb: number;
  };
  platformAndAnalytics: {
    notificationDefaults: {
      approvalsEmail: boolean;
      reportsEmail: boolean;
      eventRemindersPush: boolean;
      mentorshipRequestEmail: boolean;
    };
    csvExportPermissions: {
      users: Record<AdminRole, boolean>;
      reports: Record<AdminRole, boolean>;
      events: Record<AdminRole, boolean>;
      jobApplicants: Record<AdminRole, boolean>;
    };
    backupFrequency: "daily" | "weekly" | "monthly";
    auditLogRetentionDays: number;
    announcementBannerEnabled: boolean;
    announcementBannerText: string;
    featureFlags: {
      jobs: boolean;
      mentorship: boolean;
      events: boolean;
      groups: boolean;
      rolloutScope: "all" | "campus" | "cohort";
      rolloutTarget: string;
    };
    dashboardWidgets: {
      totalUsers: boolean;
      adminTeam: boolean;
      suspendedAccounts: boolean;
      recentRegistrations: boolean;
      reportsQueue: boolean;
      moderationTrends: boolean;
    };
  };
}

type SettingsSection =
  | "institution-rules"
  | "content-lifecycle"
  | "automation"
  | "communication"
  | "admin-operations"
  | "access-control"
  | "alumni-data-rules"
  | "moderation-controls"
  | "community-settings"
  | "platform-analytics";

const STORAGE_KEY = "admin-platform-settings-v2";

const defaultSettings: AdminSettingsData = {
  institutionRules: {
    admissionNumberPattern: String.raw`^[A-Za-z0-9\/-]{4,20}$`,
    enforceAdmissionNumberUniqueness: true,
    minAdmissionYear: 1980,
    maxAdmissionYear: new Date().getFullYear() + 1,
    userTypePolicies: {
      alumni: { allowRegistration: true, requiresManualApproval: true },
      student: { allowRegistration: true, requiresManualApproval: true },
      faculty: { allowRegistration: true, requiresManualApproval: true },
      staff: { allowRegistration: true, requiresManualApproval: true },
      guest: { allowRegistration: false, requiresManualApproval: true },
    },
    enforceDomainAllowlist: false,
    allowedSignupDomainsCsv: "alumni.edu, university.edu",
  },
  contentLifecycle: {
    posts: {
      commentsEnabledByDefault: true,
      mediaLimitMb: 15,
      linkPreviewEnabled: true,
      editWindowMinutes: 30,
      archiveAfterInactivityDays: 180,
    },
    events: {
      approvalRequired: true,
      rsvpCap: 300,
      waitlistModeEnabled: true,
      autoCloseHoursBeforeEvent: 2,
      attendanceTrackingEnabled: true,
    },
    jobs: {
      employerVerificationRequired: true,
      postingDurationDays: 30,
      featuredJobSlots: 8,
      applicationDeadlineRequired: true,
    },
  },
  automation: {
    autoApproveTrustedDomain: false,
    autoApproveGraduationYearMatch: false,
    autoApproveVerifiedAlumniRecord: true,
    autoFlagReportThreshold: 3,
    autoSuspendReportThreshold: 7,
    suspiciousActivitySpikeThreshold: 10,
    cleanup: {
      inactiveAccountsAfterDays: 365,
      expiredJobsAfterDays: 30,
      oldEventsAfterDays: 120,
      staleMentorshipRequestsAfterDays: 45,
      unreadNotificationRetentionDays: 60,
    },
  },
  communication: {
    notificationTemplates: {
      approval: "Your account request has been approved.",
      rejection: "Your account request was rejected. Contact support for details.",
      reportResolution: "Your report has been reviewed and resolved.",
      eventReminder: "Reminder: your registered event starts soon.",
      mentorshipMatch: "You have a new mentorship match.",
    },
    digestByModule: {
      posts: "daily",
      groups: "daily",
      events: "instant",
      jobs: "daily",
      mentorship: "instant",
      messages: "instant",
    },
    broadcastControls: {
      campusWideAnnouncements: true,
      alumniBatchEmails: true,
      emergencyAlertsEnabled: true,
      broadcastsPerHourLimit: 3,
    },
  },
  adminOperations: {
    moderatorScopes: {
      posts: true,
      groups: true,
      events: true,
      jobs: false,
      messages: true,
      mentorship: true,
      directory: false,
    },
    audit: {
      immutableActionLogs: true,
      exportableModerationHistory: true,
      requireReasonForSuspensions: true,
      requireReasonForDeletions: true,
    },
    operationalFlags: {
      betaRolloutMode: true,
      maintenanceMode: false,
      readOnlyMode: false,
      campusSpecificReleaseControl: true,
    },
  },
  accessControl: {
    rolePermissions: {
      user: {
        posts: true,
        groups: false,
        events: false,
        jobs: false,
        messages: true,
        mentorship: false,
        directory: true,
      },
      moderator: {
        posts: true,
        groups: true,
        events: true,
        jobs: true,
        messages: true,
        mentorship: true,
        directory: true,
      },
      admin: {
        posts: true,
        groups: true,
        events: true,
        jobs: true,
        messages: true,
        mentorship: true,
        directory: true,
      },
      super_admin: {
        posts: true,
        groups: true,
        events: true,
        jobs: true,
        messages: true,
        mentorship: true,
        directory: true,
      },
    },
    inviteOnlyAdminCreation: true,
    moderatorApprovalRequired: true,
    adminSessionTimeoutMinutes: 60,
    enforceAdmin2FA: true,
    loginAlertsForAdmins: true,
    passwordStrength: "strong",
  },
  alumniDataRules: {
    requiredFieldsByType: {
      student: ["name", "email", "admissionNumber", "admissionYear"],
      alumni: ["name", "email", "admissionNumber", "admissionYear", "graduationYear"],
      faculty: ["name", "email", "department", "employeeId"],
    },
    enforceAdmissionNumberUniqueness: true,
    alumniVerification: {
      requireAdmissionProof: true,
      requireGraduationYearCheck: true,
      requireManualReviewOnMismatch: true,
    },
    badgeRules: {
      byGraduationYear: true,
      byChapter: true,
      byDonorStatus: true,
      byMentorStatus: true,
    },
    approvalRulesByType: {
      student: "moderator",
      alumni: "moderator",
      faculty: "admin",
    },
  },
  moderation: {
    severityThresholds: {
      low: 1,
      medium: 3,
      high: 5,
      critical: 7,
    },
    autoHideAfterReports: 3,
    bannedWordsCsv: "fake certificate, scam, phishing, abusive",
    scamLinkFilterEnabled: true,
    spamPatternFilterEnabled: true,
    allowedAttachmentTypesCsv: "jpg,png,pdf,doc,docx",
    maxAttachmentSizeMb: 10,
    suspensionPresets: {
      h24: true,
      d7: true,
      permanent: true,
    },
    appeals: {
      allowAppeals: true,
      allowAppealsForPermanentSuspension: false,
      moderatorActionTemplate: "Reason, evidence, action taken, suspension duration, appeal decision",
    },
  },
  community: {
    groupCreationPolicy: "alumni_only",
    eventCreationPolicy: "admin_approved",
    jobsRequirePreModeration: true,
    jobsRequireCompanyVerification: true,
    defaultJobExpiryDays: 30,
    mentorshipMaxMenteesPerMentor: 5,
    mentorshipMonthlyBookingLimit: 12,
    mentorshipFeedbackRequired: true,
    directoryPrivacy: "alumni",
    dmPermission: "approved_connections",
    postAttachmentLimitMb: 15,
  },
  platformAndAnalytics: {
    notificationDefaults: {
      approvalsEmail: true,
      reportsEmail: true,
      eventRemindersPush: true,
      mentorshipRequestEmail: true,
    },
    csvExportPermissions: {
      users: { user: false, moderator: true, admin: true, super_admin: true },
      reports: { user: false, moderator: true, admin: true, super_admin: true },
      events: { user: false, moderator: true, admin: true, super_admin: true },
      jobApplicants: { user: false, moderator: false, admin: true, super_admin: true },
    },
    backupFrequency: "daily",
    auditLogRetentionDays: 180,
    announcementBannerEnabled: false,
    announcementBannerText: "",
    featureFlags: {
      jobs: true,
      mentorship: true,
      events: true,
      groups: true,
      rolloutScope: "all",
      rolloutTarget: "",
    },
    dashboardWidgets: {
      totalUsers: true,
      adminTeam: true,
      suspendedAccounts: true,
      recentRegistrations: true,
      reportsQueue: true,
      moderationTrends: false,
    },
  },
};

const sectionList: { id: SettingsSection; label: string; short: string }[] = [
  { id: "institution-rules", label: "Institution", short: "Institution" },
  { id: "alumni-data-rules", label: "Registration", short: "Registration" },
  { id: "content-lifecycle", label: "Verification", short: "Verification" },
  { id: "moderation-controls", label: "Moderation", short: "Moderation" },
  { id: "automation", label: "Automation", short: "Automation" },
  { id: "communication", label: "Notifications", short: "Notifications" },
  { id: "access-control", label: "Permissions", short: "Permissions" },
  { id: "admin-operations", label: "Audit", short: "Audit" },
];

const admissionPatternPresets = {
  standard: String.raw`^[A-Za-z0-9\/-]{4,20}$`,
  slashYearSerial: String.raw`^[0-9]{2,4}\/[A-Za-z]{1,5}\/[0-9]{2,5}$`,
  alphanumericHyphen: String.raw`^[A-Za-z]{2,6}-[0-9]{3,8}$`,
} as const;

type AdmissionPatternPreset = keyof typeof admissionPatternPresets | "custom";

const roleLabels: Record<AdminRole, string> = {
  user: "User",
  moderator: "Moderator",
  admin: "Admin",
  super_admin: "Super Admin",
};

const moduleLabels: Record<ModulePermission, string> = {
  posts: "Posts",
  groups: "Groups",
  events: "Events",
  jobs: "Jobs",
  messages: "Messages",
  mentorship: "Mentorship",
  directory: "Directory",
};

const datasetLabels = {
  users: "Users",
  reports: "Reports",
  events: "Events",
  jobApplicants: "Job Applicants",
} as const;

const institutionUserTypeLabels: Record<InstitutionUserType, string> = {
  alumni: "Alumni",
  student: "Student",
  faculty: "Faculty",
  staff: "Staff",
  guest: "Guest",
};

const digestModeOptions: Array<{ value: DigestMode; label: string }> = [
  { value: "instant", label: "Instant" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "off", label: "Off" },
];

export default function AdminSettingsPanel() {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<SettingsSection>("institution-rules");
  const [settings, setSettings] = useState<AdminSettingsData>(defaultSettings);
  const [savedSettings, setSavedSettings] = useState<AdminSettingsData>(defaultSettings);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [sampleAdmissionNumber, setSampleAdmissionNumber] = useState("");
  const [newDomain, setNewDomain] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as AdminSettingsData;
      setSettings(parsed);
      setSavedSettings(parsed);
      setLastSavedAt(new Date().toISOString());
    } catch {
      setSettings(defaultSettings);
      setSavedSettings(defaultSettings);
    }
  }, []);

  const saveSettings = () => {
    setSaveState("saving");
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      const timestamp = new Date().toISOString();
      setLastSavedAt(timestamp);
      setSavedSettings(settings);
      setSaveState("success");
      toast({
        title: "Settings Saved",
        description: `Saved ${changedSections.length || 1} section${changedSections.length === 1 ? "" : "s"} successfully.`,
      });
    } catch {
      setSaveState("error");
      toast({
        title: "Save Failed",
        description: "Could not save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    setSavedSettings(defaultSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSettings));
    const timestamp = new Date().toISOString();
    setLastSavedAt(timestamp);
    setSaveState("success");
    toast({
      title: "Defaults Restored",
      description: "Settings were reset to default values.",
    });
  };

  const getSectionSnapshot = (allSettings: AdminSettingsData, sectionId: SettingsSection) => {
    switch (sectionId) {
      case "institution-rules":
        return allSettings.institutionRules;
      case "content-lifecycle":
        return allSettings.contentLifecycle;
      case "automation":
        return allSettings.automation;
      case "communication":
        return allSettings.communication;
      case "admin-operations":
        return allSettings.adminOperations;
      case "access-control":
        return allSettings.accessControl;
      case "alumni-data-rules":
        return allSettings.alumniDataRules;
      case "moderation-controls":
        return allSettings.moderation;
      case "community-settings":
        return allSettings.community;
      case "platform-analytics":
        return allSettings.platformAndAnalytics;
      default:
        return allSettings.institutionRules;
    }
  };

  const sectionHasChanges = (sectionId: SettingsSection) => {
    return JSON.stringify(getSectionSnapshot(settings, sectionId)) !== JSON.stringify(getSectionSnapshot(savedSettings, sectionId));
  };

  const changedSections = sectionList.filter((section) => sectionHasChanges(section.id));
  const hasUnsavedChanges = changedSections.length > 0;
  const activeSectionMeta = sectionList.find((section) => section.id === activeSection);

  const domainList = settings.institutionRules.allowedSignupDomainsCsv
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  const addDomain = () => {
    const normalized = newDomain.trim().toLowerCase();
    if (!normalized) return;
    if (domainList.includes(normalized)) {
      setNewDomain("");
      return;
    }

    const nextDomains = [...domainList, normalized].join(", ");
    setSettings((prev) => ({
      ...prev,
      institutionRules: { ...prev.institutionRules, allowedSignupDomainsCsv: nextDomains },
    }));
    setNewDomain("");
  };

  const removeDomain = (domain: string) => {
    const nextDomains = domainList.filter((item) => item !== domain).join(", ");
    setSettings((prev) => ({
      ...prev,
      institutionRules: { ...prev.institutionRules, allowedSignupDomainsCsv: nextDomains },
    }));
  };

  const toggleRolePermission = (role: AdminRole, module: ModulePermission, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      accessControl: {
        ...prev.accessControl,
        rolePermissions: {
          ...prev.accessControl.rolePermissions,
          [role]: {
            ...prev.accessControl.rolePermissions[role],
            [module]: value,
          },
        },
      },
    }));
  };

  const setRequiredFieldsByType = (type: AccountType, csv: string) => {
    const next = csv
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    setSettings((prev) => ({
      ...prev,
      alumniDataRules: {
        ...prev.alumniDataRules,
        requiredFieldsByType: {
          ...prev.alumniDataRules.requiredFieldsByType,
          [type]: next,
        },
      },
    }));
  };

  const renderInstitutionRules = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Admission Number & Year Policy</CardTitle>
          <CardDescription>Define format, uniqueness, and allowed academic year ranges.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Admission format preset</Label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={(Object.entries(admissionPatternPresets).find(([, pattern]) => pattern === settings.institutionRules.admissionNumberPattern)?.[0] as AdmissionPatternPreset) || "custom"}
              onChange={(e) => {
                const selected = e.target.value as AdmissionPatternPreset;
                if (selected === "custom") return;
                setSettings((prev) => ({
                  ...prev,
                  institutionRules: { ...prev.institutionRules, admissionNumberPattern: admissionPatternPresets[selected] },
                }));
              }}
            >
              <option value="standard">Standard (4-20 chars, letters/numbers/slash/hyphen)</option>
              <option value="slashYearSerial">Slash format (e.g. 2020/CSE/0342)</option>
              <option value="alphanumericHyphen">Hyphen format (e.g. CSE-202301)</option>
              <option value="custom">Custom pattern</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Custom admission number pattern</Label>
            <Input
              value={settings.institutionRules.admissionNumberPattern}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  institutionRules: { ...prev.institutionRules, admissionNumberPattern: e.target.value },
                }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Accepted format example: 4–20 characters with letters, numbers, slash, or hyphen.
            </p>
          </div>

          <div className="space-y-2 rounded-md border p-3">
            <Label>Test sample admission number</Label>
            <Input
              placeholder="Try a sample like 2020/CSE/0342"
              value={sampleAdmissionNumber}
              onChange={(e) => setSampleAdmissionNumber(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {sampleAdmissionNumber.length === 0
                ? "Enter a sample to validate against the current pattern."
                : (() => {
                    try {
                      const valid = new RegExp(settings.institutionRules.admissionNumberPattern).test(sampleAdmissionNumber);
                      return valid ? "Sample is valid for this pattern." : "Sample does not match this pattern.";
                    } catch {
                      return "Pattern is invalid. Please correct the custom pattern.";
                    }
                  })()}
            </p>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label>Enforce admission number uniqueness</Label>
            </div>
            <Switch
              checked={settings.institutionRules.enforceAdmissionNumberUniqueness}
              onCheckedChange={(value) =>
                setSettings((prev) => ({
                  ...prev,
                  institutionRules: { ...prev.institutionRules, enforceAdmissionNumberUniqueness: value },
                }))
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Minimum allowed admission year</Label>
              <Input
                type="number"
                value={settings.institutionRules.minAdmissionYear}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    institutionRules: { ...prev.institutionRules, minAdmissionYear: Number(e.target.value) || 1900 },
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">Dynamic recommendation: {new Date().getFullYear() - 50}</p>
            </div>
            <div className="space-y-2">
              <Label>Maximum allowed admission year</Label>
              <Input
                type="number"
                value={settings.institutionRules.maxAdmissionYear}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    institutionRules: { ...prev.institutionRules, maxAdmissionYear: Number(e.target.value) || 1900 },
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">Dynamic recommendation: {new Date().getFullYear() + 1}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Type Policies & Domain Allowlist</CardTitle>
          <CardDescription>Configure registration and manual approval requirements by institution user type.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-3">User Type</th>
                  <th className="text-left py-2 px-3">Registration Policy</th>
                  <th className="text-left py-2 px-3">Logic</th>
                </tr>
              </thead>
              <tbody>
                {(Object.keys(institutionUserTypeLabels) as InstitutionUserType[]).map((userType) => (
                  <tr key={userType} className="border-b last:border-0">
                    <td className="py-3 pr-3 font-medium">{institutionUserTypeLabels[userType]}</td>
                    <td className="py-3 px-3">
                      <select
                        className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
                        value={
                          !settings.institutionRules.userTypePolicies[userType].allowRegistration
                            ? "closed"
                            : settings.institutionRules.userTypePolicies[userType].requiresManualApproval
                              ? "approval"
                              : "open"
                        }
                        onChange={(e) => {
                          const policy = e.target.value;
                          setSettings((prev) => ({
                            ...prev,
                            institutionRules: {
                              ...prev.institutionRules,
                              userTypePolicies: {
                                ...prev.institutionRules.userTypePolicies,
                                [userType]: {
                                  allowRegistration: policy !== "closed",
                                  requiresManualApproval: policy === "approval",
                                },
                              },
                            },
                          }));
                        }}
                      >
                        <option value="open">Open</option>
                        <option value="approval">Approval Required</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="py-3 px-3 text-xs text-muted-foreground">
                      {settings.institutionRules.userTypePolicies[userType].allowRegistration
                        ? settings.institutionRules.userTypePolicies[userType].requiresManualApproval
                          ? "Approval is enforced before account activation."
                          : "Registration is open without manual approval."
                        : "Approval applies only when registration is enabled."}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <Label>Enforce signup domain allowlist</Label>
              <Switch
                checked={settings.institutionRules.enforceDomainAllowlist}
                onCheckedChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    institutionRules: { ...prev.institutionRules, enforceDomainAllowlist: value },
                  }))
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {settings.institutionRules.enforceDomainAllowlist
                ? "Only these domains can register."
                : "Allowlist is currently inactive; listed domains are saved but not enforced."}
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {domainList.length === 0 && <span className="text-xs text-muted-foreground">No allowed domains configured.</span>}
              {domainList.map((domain) => (
                <Badge key={domain} variant="outline" className="flex items-center gap-1">
                  {domain}
                  <button
                    type="button"
                    onClick={() => removeDomain(domain)}
                    className="ml-1 rounded hover:bg-muted"
                    aria-label={`Remove ${domain}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <Input
                placeholder="Add domain (e.g. alumni.edu)"
                value={newDomain}
                disabled={!settings.institutionRules.enforceDomainAllowlist}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addDomain();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addDomain} disabled={!settings.institutionRules.enforceDomainAllowlist}>
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContentLifecycle = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Post Defaults</CardTitle>
          <CardDescription>Set default creation, edit, and archival behavior for posts.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label>Comments enabled by default</Label>
            <Switch
              checked={settings.contentLifecycle.posts.commentsEnabledByDefault}
              onCheckedChange={(value) =>
                setSettings((prev) => ({
                  ...prev,
                  contentLifecycle: {
                    ...prev.contentLifecycle,
                    posts: { ...prev.contentLifecycle.posts, commentsEnabledByDefault: value },
                  },
                }))
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label>Link preview enabled</Label>
            <Switch
              checked={settings.contentLifecycle.posts.linkPreviewEnabled}
              onCheckedChange={(value) =>
                setSettings((prev) => ({
                  ...prev,
                  contentLifecycle: {
                    ...prev.contentLifecycle,
                    posts: { ...prev.contentLifecycle.posts, linkPreviewEnabled: value },
                  },
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Media limit (MB)</Label>
            <Input
              type="number"
              value={settings.contentLifecycle.posts.mediaLimitMb}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  contentLifecycle: {
                    ...prev.contentLifecycle,
                    posts: { ...prev.contentLifecycle.posts, mediaLimitMb: Number(e.target.value) || 1 },
                  },
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Edit window (minutes)</Label>
            <Input
              type="number"
              value={settings.contentLifecycle.posts.editWindowMinutes}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  contentLifecycle: {
                    ...prev.contentLifecycle,
                    posts: { ...prev.contentLifecycle.posts, editWindowMinutes: Number(e.target.value) || 0 },
                  },
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Archive after inactivity (days)</Label>
            <Input
              type="number"
              value={settings.contentLifecycle.posts.archiveAfterInactivityDays}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  contentLifecycle: {
                    ...prev.contentLifecycle,
                    posts: { ...prev.contentLifecycle.posts, archiveAfterInactivityDays: Number(e.target.value) || 0 },
                  },
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Event & Job Defaults</CardTitle>
          <CardDescription>Control review requirements, caps, and expiry behavior for events and jobs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <Label>Event defaults</Label>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center justify-between rounded-md border p-3">
                <Label>Approval required</Label>
                <Switch
                  checked={settings.contentLifecycle.events.approvalRequired}
                  onCheckedChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      contentLifecycle: {
                        ...prev.contentLifecycle,
                        events: { ...prev.contentLifecycle.events, approvalRequired: value },
                      },
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <Label>Waitlist mode</Label>
                <Switch
                  checked={settings.contentLifecycle.events.waitlistModeEnabled}
                  onCheckedChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      contentLifecycle: {
                        ...prev.contentLifecycle,
                        events: { ...prev.contentLifecycle.events, waitlistModeEnabled: value },
                      },
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <Label>Attendance tracking</Label>
                <Switch
                  checked={settings.contentLifecycle.events.attendanceTrackingEnabled}
                  onCheckedChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      contentLifecycle: {
                        ...prev.contentLifecycle,
                        events: { ...prev.contentLifecycle.events, attendanceTrackingEnabled: value },
                      },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>RSVP cap</Label>
                <Input
                  type="number"
                  value={settings.contentLifecycle.events.rsvpCap}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      contentLifecycle: {
                        ...prev.contentLifecycle,
                        events: { ...prev.contentLifecycle.events, rsvpCap: Number(e.target.value) || 1 },
                      },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Auto-close registrations (hours before)</Label>
                <Input
                  type="number"
                  value={settings.contentLifecycle.events.autoCloseHoursBeforeEvent}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      contentLifecycle: {
                        ...prev.contentLifecycle,
                        events: {
                          ...prev.contentLifecycle.events,
                          autoCloseHoursBeforeEvent: Number(e.target.value) || 0,
                        },
                      },
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Job defaults</Label>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center justify-between rounded-md border p-3">
                <Label>Employer verification required</Label>
                <Switch
                  checked={settings.contentLifecycle.jobs.employerVerificationRequired}
                  onCheckedChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      contentLifecycle: {
                        ...prev.contentLifecycle,
                        jobs: { ...prev.contentLifecycle.jobs, employerVerificationRequired: value },
                      },
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <Label>Application deadline required</Label>
                <Switch
                  checked={settings.contentLifecycle.jobs.applicationDeadlineRequired}
                  onCheckedChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      contentLifecycle: {
                        ...prev.contentLifecycle,
                        jobs: { ...prev.contentLifecycle.jobs, applicationDeadlineRequired: value },
                      },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Posting duration (days)</Label>
                <Input
                  type="number"
                  value={settings.contentLifecycle.jobs.postingDurationDays}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      contentLifecycle: {
                        ...prev.contentLifecycle,
                        jobs: { ...prev.contentLifecycle.jobs, postingDurationDays: Number(e.target.value) || 1 },
                      },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Featured job slots</Label>
                <Input
                  type="number"
                  value={settings.contentLifecycle.jobs.featuredJobSlots}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      contentLifecycle: {
                        ...prev.contentLifecycle,
                        jobs: { ...prev.contentLifecycle.jobs, featuredJobSlots: Number(e.target.value) || 0 },
                      },
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAutomation = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Auto-Approval & Auto-Moderation</CardTitle>
          <CardDescription>Reduce repetitive moderation through trusted user and threshold-based automation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label>Auto-approve trusted domains</Label>
              <Switch
                checked={settings.automation.autoApproveTrustedDomain}
                onCheckedChange={(value) =>
                  setSettings((prev) => ({ ...prev, automation: { ...prev.automation, autoApproveTrustedDomain: value } }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label>Auto-approve graduation year match</Label>
              <Switch
                checked={settings.automation.autoApproveGraduationYearMatch}
                onCheckedChange={(value) =>
                  setSettings((prev) => ({ ...prev, automation: { ...prev.automation, autoApproveGraduationYearMatch: value } }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label>Auto-approve verified alumni record</Label>
              <Switch
                checked={settings.automation.autoApproveVerifiedAlumniRecord}
                onCheckedChange={(value) =>
                  setSettings((prev) => ({ ...prev, automation: { ...prev.automation, autoApproveVerifiedAlumniRecord: value } }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Auto-flag after reports</Label>
              <Input
                type="number"
                value={settings.automation.autoFlagReportThreshold}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, automation: { ...prev.automation, autoFlagReportThreshold: Number(e.target.value) || 1 } }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Auto-suspend after reports</Label>
              <Input
                type="number"
                value={settings.automation.autoSuspendReportThreshold}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, automation: { ...prev.automation, autoSuspendReportThreshold: Number(e.target.value) || 1 } }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Suspicious activity spike threshold</Label>
              <Input
                type="number"
                value={settings.automation.suspiciousActivitySpikeThreshold}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, automation: { ...prev.automation, suspiciousActivitySpikeThreshold: Number(e.target.value) || 1 } }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scheduled Cleanup Policies</CardTitle>
          <CardDescription>Set retention windows for stale, inactive, and expired records.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Inactive accounts (days)</Label>
            <Input
              type="number"
              value={settings.automation.cleanup.inactiveAccountsAfterDays}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  automation: {
                    ...prev.automation,
                    cleanup: { ...prev.automation.cleanup, inactiveAccountsAfterDays: Number(e.target.value) || 1 },
                  },
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Expired jobs cleanup (days)</Label>
            <Input
              type="number"
              value={settings.automation.cleanup.expiredJobsAfterDays}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  automation: {
                    ...prev.automation,
                    cleanup: { ...prev.automation.cleanup, expiredJobsAfterDays: Number(e.target.value) || 1 },
                  },
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Old events cleanup (days)</Label>
            <Input
              type="number"
              value={settings.automation.cleanup.oldEventsAfterDays}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  automation: {
                    ...prev.automation,
                    cleanup: { ...prev.automation.cleanup, oldEventsAfterDays: Number(e.target.value) || 1 },
                  },
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Stale mentorship requests (days)</Label>
            <Input
              type="number"
              value={settings.automation.cleanup.staleMentorshipRequestsAfterDays}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  automation: {
                    ...prev.automation,
                    cleanup: {
                      ...prev.automation.cleanup,
                      staleMentorshipRequestsAfterDays: Number(e.target.value) || 1,
                    },
                  },
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Unread notification retention (days)</Label>
            <Input
              type="number"
              value={settings.automation.cleanup.unreadNotificationRetentionDays}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  automation: {
                    ...prev.automation,
                    cleanup: {
                      ...prev.automation.cleanup,
                      unreadNotificationRetentionDays: Number(e.target.value) || 1,
                    },
                  },
                }))
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCommunication = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Notification Templates</CardTitle>
          <CardDescription>Centralize message templates for key user communication flows.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(Object.keys(settings.communication.notificationTemplates) as Array<keyof AdminSettingsData["communication"]["notificationTemplates"]>).map((templateKey) => (
            <div key={templateKey} className="space-y-2">
              <Label className="capitalize">{String(templateKey).replace(/([A-Z])/g, " $1")}</Label>
              <Textarea
                value={settings.communication.notificationTemplates[templateKey]}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    communication: {
                      ...prev.communication,
                      notificationTemplates: {
                        ...prev.communication.notificationTemplates,
                        [templateKey]: e.target.value,
                      },
                    },
                  }))
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Digest & Broadcast Controls</CardTitle>
          <CardDescription>Tune notification cadence and mass communication safety limits.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(Object.keys(settings.communication.digestByModule) as Array<keyof AdminSettingsData["communication"]["digestByModule"]>).map((moduleKey) => (
              <div key={moduleKey} className="space-y-2">
                <Label className="capitalize">{moduleKey}</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={settings.communication.digestByModule[moduleKey]}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      communication: {
                        ...prev.communication,
                        digestByModule: {
                          ...prev.communication.digestByModule,
                          [moduleKey]: e.target.value as DigestMode,
                        },
                      },
                    }))
                  }
                >
                  {digestModeOptions.map((mode) => (
                    <option key={mode.value} value={mode.value}>{mode.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label>Campus-wide announcements</Label>
              <Switch
                checked={settings.communication.broadcastControls.campusWideAnnouncements}
                onCheckedChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    communication: {
                      ...prev.communication,
                      broadcastControls: { ...prev.communication.broadcastControls, campusWideAnnouncements: value },
                    },
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label>Alumni batch emails</Label>
              <Switch
                checked={settings.communication.broadcastControls.alumniBatchEmails}
                onCheckedChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    communication: {
                      ...prev.communication,
                      broadcastControls: { ...prev.communication.broadcastControls, alumniBatchEmails: value },
                    },
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label>Emergency alerts enabled</Label>
              <Switch
                checked={settings.communication.broadcastControls.emergencyAlertsEnabled}
                onCheckedChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    communication: {
                      ...prev.communication,
                      broadcastControls: { ...prev.communication.broadcastControls, emergencyAlertsEnabled: value },
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Broadcasts rate limit (per hour)</Label>
              <Input
                type="number"
                value={settings.communication.broadcastControls.broadcastsPerHourLimit}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    communication: {
                      ...prev.communication,
                      broadcastControls: {
                        ...prev.communication.broadcastControls,
                        broadcastsPerHourLimit: Number(e.target.value) || 1,
                      },
                    },
                  }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAdminOperations = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Moderator Scopes by Module</CardTitle>
          <CardDescription>Grant or revoke moderator access per module area.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(moduleLabels) as ModulePermission[]).map((module) => (
            <div key={module} className="flex items-center justify-between rounded-md border p-3">
              <Label>{moduleLabels[module]}</Label>
              <Switch
                checked={settings.adminOperations.moderatorScopes[module]}
                onCheckedChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    adminOperations: {
                      ...prev.adminOperations,
                      moderatorScopes: { ...prev.adminOperations.moderatorScopes, [module]: value },
                    },
                  }))
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit & Operational Controls</CardTitle>
          <CardDescription>Strengthen accountability and lifecycle controls for admin actions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 md:grid-cols-2">
            {(Object.keys(settings.adminOperations.audit) as Array<keyof AdminSettingsData["adminOperations"]["audit"]>).map((auditKey) => (
              <div key={auditKey} className="flex items-center justify-between rounded-md border p-3">
                <Label className="capitalize">{String(auditKey).replace(/([A-Z])/g, " $1")}</Label>
                <Switch
                  checked={settings.adminOperations.audit[auditKey]}
                  onCheckedChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      adminOperations: {
                        ...prev.adminOperations,
                        audit: { ...prev.adminOperations.audit, [auditKey]: value },
                      },
                    }))
                  }
                />
              </div>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {(Object.keys(settings.adminOperations.operationalFlags) as Array<keyof AdminSettingsData["adminOperations"]["operationalFlags"]>).map((flagKey) => (
              <div key={flagKey} className="flex items-center justify-between rounded-md border p-3">
                <Label className="capitalize">{String(flagKey).replace(/([A-Z])/g, " $1")}</Label>
                <Switch
                  checked={settings.adminOperations.operationalFlags[flagKey]}
                  onCheckedChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      adminOperations: {
                        ...prev.adminOperations,
                        operationalFlags: { ...prev.adminOperations.operationalFlags, [flagKey]: value },
                      },
                    }))
                  }
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAccessControl = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Granular RBAC Matrix</CardTitle>
          <CardDescription>Enable or block module access per role.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-3">Role</th>
                  {Object.entries(moduleLabels).map(([key, label]) => (
                    <th key={key} className="text-left py-2 px-3">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(Object.keys(roleLabels) as AdminRole[]).map((role) => (
                  <tr key={role} className="border-b last:border-0">
                    <td className="py-3 pr-3 font-medium">{roleLabels[role]}</td>
                    {(Object.keys(moduleLabels) as ModulePermission[]).map((module) => (
                      <td key={`${role}-${module}`} className="py-3 px-3">
                        <Switch
                          checked={settings.accessControl.rolePermissions[role][module]}
                          onCheckedChange={(value) => toggleRolePermission(role, module, value)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Admin Workflow & Security Policies</CardTitle>
          <CardDescription>Control admin invitation, approvals, and account security.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label>Invite-only admin creation</Label>
              <p className="text-xs text-muted-foreground">Only invited users can become admins.</p>
            </div>
            <Switch
              checked={settings.accessControl.inviteOnlyAdminCreation}
              onCheckedChange={(value) =>
                setSettings((prev) => ({
                  ...prev,
                  accessControl: { ...prev.accessControl, inviteOnlyAdminCreation: value },
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label>Approval required for new moderators</Label>
              <p className="text-xs text-muted-foreground">Requires explicit approval before moderator activation.</p>
            </div>
            <Switch
              checked={settings.accessControl.moderatorApprovalRequired}
              onCheckedChange={(value) =>
                setSettings((prev) => ({
                  ...prev,
                  accessControl: { ...prev.accessControl, moderatorApprovalRequired: value },
                }))
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Admin session timeout (minutes)</Label>
              <Input
                type="number"
                min={15}
                value={settings.accessControl.adminSessionTimeoutMinutes}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    accessControl: {
                      ...prev.accessControl,
                      adminSessionTimeoutMinutes: Number(e.target.value) || 15,
                    },
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Password strength policy</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={settings.accessControl.passwordStrength}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    accessControl: {
                      ...prev.accessControl,
                      passwordStrength: e.target.value as "standard" | "strong" | "very_strong",
                    },
                  }))
                }
              >
                <option value="standard">Standard</option>
                <option value="strong">Strong</option>
                <option value="very_strong">Very strong</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label>Enforce 2FA for admins</Label>
                <p className="text-xs text-muted-foreground">Require two-factor authentication for admin logins.</p>
              </div>
              <Switch
                checked={settings.accessControl.enforceAdmin2FA}
                onCheckedChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    accessControl: { ...prev.accessControl, enforceAdmin2FA: value },
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label>IP / device login alerts</Label>
                <p className="text-xs text-muted-foreground">Notify admins on unusual login device or location.</p>
              </div>
              <Switch
                checked={settings.accessControl.loginAlertsForAdmins}
                onCheckedChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    accessControl: { ...prev.accessControl, loginAlertsForAdmins: value },
                  }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAlumniDataRules = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Required Profile Fields by User Type</CardTitle>
          <CardDescription>Set mandatory fields for student, alumni, and faculty profiles.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(Object.keys(settings.alumniDataRules.requiredFieldsByType) as AccountType[]).map((type) => (
            <div key={type} className="space-y-2">
              <Label className="capitalize">{type} required fields (comma-separated)</Label>
              <Input
                value={settings.alumniDataRules.requiredFieldsByType[type].join(", ")}
                onChange={(e) => setRequiredFieldsByType(type, e.target.value)}
              />
            </div>
          ))}

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label>Admission number uniqueness</Label>
              <p className="text-xs text-muted-foreground">Reject duplicate admission numbers globally.</p>
            </div>
            <Switch
              checked={settings.alumniDataRules.enforceAdmissionNumberUniqueness}
              onCheckedChange={(value) =>
                setSettings((prev) => ({
                  ...prev,
                  alumniDataRules: {
                    ...prev.alumniDataRules,
                    enforceAdmissionNumberUniqueness: value,
                  },
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verification, Badge, and Approval Rules</CardTitle>
          <CardDescription>Define alumni identity checks and account approval policies.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label>Require admission proof</Label>
              <Switch
                checked={settings.alumniDataRules.alumniVerification.requireAdmissionProof}
                onCheckedChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    alumniDataRules: {
                      ...prev.alumniDataRules,
                      alumniVerification: {
                        ...prev.alumniDataRules.alumniVerification,
                        requireAdmissionProof: value,
                      },
                    },
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label>Verify graduation year</Label>
              <Switch
                checked={settings.alumniDataRules.alumniVerification.requireGraduationYearCheck}
                onCheckedChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    alumniDataRules: {
                      ...prev.alumniDataRules,
                      alumniVerification: {
                        ...prev.alumniDataRules.alumniVerification,
                        requireGraduationYearCheck: value,
                      },
                    },
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label>Manual review on mismatch</Label>
              <Switch
                checked={settings.alumniDataRules.alumniVerification.requireManualReviewOnMismatch}
                onCheckedChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    alumniDataRules: {
                      ...prev.alumniDataRules,
                      alumniVerification: {
                        ...prev.alumniDataRules.alumniVerification,
                        requireManualReviewOnMismatch: value,
                      },
                    },
                  }))
                }
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Auto-badge assignment logic</Label>
              <Badge variant="outline">Year / Chapter / Donor / Mentor</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-center justify-between rounded-md border p-3">
                <Label>Graduation year-based badges</Label>
                <Switch
                  checked={settings.alumniDataRules.badgeRules.byGraduationYear}
                  onCheckedChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      alumniDataRules: {
                        ...prev.alumniDataRules,
                        badgeRules: { ...prev.alumniDataRules.badgeRules, byGraduationYear: value },
                      },
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <Label>Chapter badges</Label>
                <Switch
                  checked={settings.alumniDataRules.badgeRules.byChapter}
                  onCheckedChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      alumniDataRules: {
                        ...prev.alumniDataRules,
                        badgeRules: { ...prev.alumniDataRules.badgeRules, byChapter: value },
                      },
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <Label>Donor status badges</Label>
                <Switch
                  checked={settings.alumniDataRules.badgeRules.byDonorStatus}
                  onCheckedChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      alumniDataRules: {
                        ...prev.alumniDataRules,
                        badgeRules: { ...prev.alumniDataRules.badgeRules, byDonorStatus: value },
                      },
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <Label>Mentor status badges</Label>
                <Switch
                  checked={settings.alumniDataRules.badgeRules.byMentorStatus}
                  onCheckedChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      alumniDataRules: {
                        ...prev.alumniDataRules,
                        badgeRules: { ...prev.alumniDataRules.badgeRules, byMentorStatus: value },
                      },
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {(Object.keys(settings.alumniDataRules.approvalRulesByType) as AccountType[]).map((type) => (
              <div key={type} className="space-y-2">
                <Label className="capitalize">{type} account approval</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={settings.alumniDataRules.approvalRulesByType[type]}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      alumniDataRules: {
                        ...prev.alumniDataRules,
                        approvalRulesByType: {
                          ...prev.alumniDataRules.approvalRulesByType,
                          [type]: e.target.value as "auto" | "moderator" | "admin",
                        },
                      },
                    }))
                  }
                >
                  <option value="auto">Auto approve</option>
                  <option value="moderator">Moderator approval</option>
                  <option value="admin">Admin approval</option>
                </select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderModerationControls = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Report Severity & Auto-Hide</CardTitle>
          <CardDescription>Automate moderation outcomes based on report volume and severity.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            {(Object.keys(settings.moderation.severityThresholds) as Array<keyof AdminSettingsData["moderation"]["severityThresholds"]>).map((level) => (
              <div key={level} className="space-y-2">
                <Label className="capitalize">{level} severity threshold</Label>
                <Input
                  type="number"
                  min={1}
                  value={settings.moderation.severityThresholds[level]}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      moderation: {
                        ...prev.moderation,
                        severityThresholds: {
                          ...prev.moderation.severityThresholds,
                          [level]: Number(e.target.value) || 1,
                        },
                      },
                    }))
                  }
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Auto-hide content after n reports</Label>
            <Input
              type="number"
              min={1}
              value={settings.moderation.autoHideAfterReports}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  moderation: {
                    ...prev.moderation,
                    autoHideAfterReports: Number(e.target.value) || 1,
                  },
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filters, Attachments, and Suspension Presets</CardTitle>
          <CardDescription>Configure banned words, scam links, spam filters, and suspension behavior.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Banned words (comma-separated)</Label>
            <Textarea
              value={settings.moderation.bannedWordsCsv}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  moderation: { ...prev.moderation, bannedWordsCsv: e.target.value },
                }))
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label>Scam-link filter</Label>
                <p className="text-xs text-muted-foreground">Flag suspicious URL patterns automatically.</p>
              </div>
              <Switch
                checked={settings.moderation.scamLinkFilterEnabled}
                onCheckedChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    moderation: { ...prev.moderation, scamLinkFilterEnabled: value },
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label>Spam pattern filter</Label>
                <p className="text-xs text-muted-foreground">Detect repeated promos and high-frequency posting.</p>
              </div>
              <Switch
                checked={settings.moderation.spamPatternFilterEnabled}
                onCheckedChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    moderation: { ...prev.moderation, spamPatternFilterEnabled: value },
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Allowed attachment types (comma-separated)</Label>
              <Input
                value={settings.moderation.allowedAttachmentTypesCsv}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    moderation: { ...prev.moderation, allowedAttachmentTypesCsv: e.target.value },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Max attachment size (MB)</Label>
              <Input
                type="number"
                min={1}
                value={settings.moderation.maxAttachmentSizeMb}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    moderation: {
                      ...prev.moderation,
                      maxAttachmentSizeMb: Number(e.target.value) || 1,
                    },
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Suspension duration presets</Label>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="flex items-center justify-between rounded-md border p-3">
                <Label>24 hours</Label>
                <Switch
                  checked={settings.moderation.suspensionPresets.h24}
                  onCheckedChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      moderation: {
                        ...prev.moderation,
                        suspensionPresets: { ...prev.moderation.suspensionPresets, h24: value },
                      },
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <Label>7 days</Label>
                <Switch
                  checked={settings.moderation.suspensionPresets.d7}
                  onCheckedChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      moderation: {
                        ...prev.moderation,
                        suspensionPresets: { ...prev.moderation.suspensionPresets, d7: value },
                      },
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <Label>Permanent</Label>
                <Switch
                  checked={settings.moderation.suspensionPresets.permanent}
                  onCheckedChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      moderation: {
                        ...prev.moderation,
                        suspensionPresets: { ...prev.moderation.suspensionPresets, permanent: value },
                      },
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label>Allow appeals</Label>
                <p className="text-xs text-muted-foreground">Enable a formal appeal workflow for suspended users.</p>
              </div>
              <Switch
                checked={settings.moderation.appeals.allowAppeals}
                onCheckedChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    moderation: {
                      ...prev.moderation,
                      appeals: { ...prev.moderation.appeals, allowAppeals: value },
                    },
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label>Allow appeals for permanent suspension</Label>
              </div>
              <Switch
                checked={settings.moderation.appeals.allowAppealsForPermanentSuspension}
                onCheckedChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    moderation: {
                      ...prev.moderation,
                      appeals: { ...prev.moderation.appeals, allowAppealsForPermanentSuspension: value },
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Moderator action template</Label>
              <Textarea
                value={settings.moderation.appeals.moderatorActionTemplate}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    moderation: {
                      ...prev.moderation,
                      appeals: { ...prev.moderation.appeals, moderatorActionTemplate: e.target.value },
                    },
                  }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCommunitySettings = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Groups, Events, Jobs, and Directory</CardTitle>
          <CardDescription>Define who can create resources and how content is approved.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Group creation policy</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={settings.community.groupCreationPolicy}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    community: {
                      ...prev.community,
                      groupCreationPolicy: e.target.value as "open" | "alumni_only" | "admin_approved",
                    },
                  }))
                }
              >
                <option value="open">Open</option>
                <option value="alumni_only">Alumni only</option>
                <option value="admin_approved">Admin approved</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Event creation policy</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={settings.community.eventCreationPolicy}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    community: {
                      ...prev.community,
                      eventCreationPolicy: e.target.value as "open" | "alumni_only" | "admin_approved",
                    },
                  }))
                }
              >
                <option value="open">Open</option>
                <option value="alumni_only">Alumni only</option>
                <option value="admin_approved">Admin approved</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label>Jobs require pre-moderation</Label>
              </div>
              <Switch
                checked={settings.community.jobsRequirePreModeration}
                onCheckedChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    community: { ...prev.community, jobsRequirePreModeration: value },
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label>Company verification required</Label>
              </div>
              <Switch
                checked={settings.community.jobsRequireCompanyVerification}
                onCheckedChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    community: { ...prev.community, jobsRequireCompanyVerification: value },
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Default job expiry (days)</Label>
              <Input
                type="number"
                min={1}
                value={settings.community.defaultJobExpiryDays}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    community: { ...prev.community, defaultJobExpiryDays: Number(e.target.value) || 1 },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Directory privacy</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={settings.community.directoryPrivacy}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    community: {
                      ...prev.community,
                      directoryPrivacy: e.target.value as "public" | "alumni" | "restricted",
                    },
                  }))
                }
              >
                <option value="public">Public</option>
                <option value="alumni">Alumni-only</option>
                <option value="restricted">Restricted</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>DM permission</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={settings.community.dmPermission}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    community: {
                      ...prev.community,
                      dmPermission: e.target.value as "all" | "same_type_only" | "alumni_faculty_only" | "approved_connections",
                    },
                  }))
                }
              >
                <option value="all">All users</option>
                <option value="same_type_only">Same user type only</option>
                <option value="alumni_faculty_only">Alumni and faculty only</option>
                <option value="approved_connections">Approved connections only</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mentorship and Post Limits</CardTitle>
          <CardDescription>Control mentorship matching and posting constraints.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Max mentees per mentor</Label>
            <Input
              type="number"
              min={1}
              value={settings.community.mentorshipMaxMenteesPerMentor}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  community: {
                    ...prev.community,
                    mentorshipMaxMenteesPerMentor: Number(e.target.value) || 1,
                  },
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Booking limit per mentor/month</Label>
            <Input
              type="number"
              min={1}
              value={settings.community.mentorshipMonthlyBookingLimit}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  community: {
                    ...prev.community,
                    mentorshipMonthlyBookingLimit: Number(e.target.value) || 1,
                  },
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Post attachment limit (MB)</Label>
            <Input
              type="number"
              min={1}
              value={settings.community.postAttachmentLimitMb}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  community: {
                    ...prev.community,
                    postAttachmentLimitMb: Number(e.target.value) || 1,
                  },
                }))
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label>Feedback required after mentorship</Label>
            </div>
            <Switch
              checked={settings.community.mentorshipFeedbackRequired}
              onCheckedChange={(value) =>
                setSettings((prev) => ({
                  ...prev,
                  community: { ...prev.community, mentorshipFeedbackRequired: value },
                }))
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPlatformAnalytics = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Notification Defaults & CSV Exports</CardTitle>
          <CardDescription>Set notification policy and export controls for admin users.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label>Approval emails</Label>
              <Switch
                checked={settings.platformAndAnalytics.notificationDefaults.approvalsEmail}
                onCheckedChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    platformAndAnalytics: {
                      ...prev.platformAndAnalytics,
                      notificationDefaults: { ...prev.platformAndAnalytics.notificationDefaults, approvalsEmail: value },
                    },
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label>Report alerts emails</Label>
              <Switch
                checked={settings.platformAndAnalytics.notificationDefaults.reportsEmail}
                onCheckedChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    platformAndAnalytics: {
                      ...prev.platformAndAnalytics,
                      notificationDefaults: { ...prev.platformAndAnalytics.notificationDefaults, reportsEmail: value },
                    },
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label>Event reminders push</Label>
              <Switch
                checked={settings.platformAndAnalytics.notificationDefaults.eventRemindersPush}
                onCheckedChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    platformAndAnalytics: {
                      ...prev.platformAndAnalytics,
                      notificationDefaults: { ...prev.platformAndAnalytics.notificationDefaults, eventRemindersPush: value },
                    },
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label>Mentorship request emails</Label>
              <Switch
                checked={settings.platformAndAnalytics.notificationDefaults.mentorshipRequestEmail}
                onCheckedChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    platformAndAnalytics: {
                      ...prev.platformAndAnalytics,
                      notificationDefaults: { ...prev.platformAndAnalytics.notificationDefaults, mentorshipRequestEmail: value },
                    },
                  }))
                }
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Label className="mb-2 block">CSV export permissions by role</Label>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-3">Dataset</th>
                  {(Object.keys(roleLabels) as AdminRole[]).map((role) => (
                    <th key={role} className="text-left py-2 px-3">{roleLabels[role]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(Object.keys(settings.platformAndAnalytics.csvExportPermissions) as Array<keyof AdminSettingsData["platformAndAnalytics"]["csvExportPermissions"]>).map((dataset) => (
                  <tr key={dataset} className="border-b last:border-0">
                    <td className="py-3 pr-3 font-medium">{datasetLabels[dataset]}</td>
                    {(Object.keys(roleLabels) as AdminRole[]).map((role) => (
                      <td key={`${dataset}-${role}`} className="py-3 px-3">
                        <Switch
                          checked={settings.platformAndAnalytics.csvExportPermissions[dataset][role]}
                          onCheckedChange={(value) =>
                            setSettings((prev) => ({
                              ...prev,
                              platformAndAnalytics: {
                                ...prev.platformAndAnalytics,
                                csvExportPermissions: {
                                  ...prev.platformAndAnalytics.csvExportPermissions,
                                  [dataset]: {
                                    ...prev.platformAndAnalytics.csvExportPermissions[dataset],
                                    [role]: value,
                                  },
                                },
                              },
                            }))
                          }
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backups, Audit Retention, Announcements & Feature Flags</CardTitle>
          <CardDescription>Configure platform operations and phased feature rollouts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Backup frequency</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={settings.platformAndAnalytics.backupFrequency}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    platformAndAnalytics: {
                      ...prev.platformAndAnalytics,
                      backupFrequency: e.target.value as "daily" | "weekly" | "monthly",
                    },
                  }))
                }
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Audit log retention (days)</Label>
              <Input
                type="number"
                min={30}
                value={settings.platformAndAnalytics.auditLogRetentionDays}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    platformAndAnalytics: {
                      ...prev.platformAndAnalytics,
                      auditLogRetentionDays: Number(e.target.value) || 30,
                    },
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-3 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Announcement banner</Label>
                <p className="text-xs text-muted-foreground">Show platform-wide policy and launch updates.</p>
              </div>
              <Switch
                checked={settings.platformAndAnalytics.announcementBannerEnabled}
                onCheckedChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    platformAndAnalytics: {
                      ...prev.platformAndAnalytics,
                      announcementBannerEnabled: value,
                    },
                  }))
                }
              />
            </div>
            <Textarea
              placeholder="Enter announcement text"
              value={settings.platformAndAnalytics.announcementBannerText}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  platformAndAnalytics: {
                    ...prev.platformAndAnalytics,
                    announcementBannerText: e.target.value,
                  },
                }))
              }
            />
          </div>

          <div className="space-y-3 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <Label>Feature flags</Label>
              <Badge variant="outline">Controlled rollout</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {(
                ["jobs", "mentorship", "events", "groups"] as Array<keyof AdminSettingsData["platformAndAnalytics"]["featureFlags"]>
              ).map((feature) => (
                <div key={feature} className="flex items-center justify-between rounded-md border p-3">
                  <Label className="capitalize">{feature}</Label>
                  <Switch
                    checked={settings.platformAndAnalytics.featureFlags[feature] as boolean}
                    onCheckedChange={(value) =>
                      setSettings((prev) => ({
                        ...prev,
                        platformAndAnalytics: {
                          ...prev.platformAndAnalytics,
                          featureFlags: {
                            ...prev.platformAndAnalytics.featureFlags,
                            [feature]: value,
                          },
                        },
                      }))
                    }
                  />
                </div>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Rollout scope</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={settings.platformAndAnalytics.featureFlags.rolloutScope}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      platformAndAnalytics: {
                        ...prev.platformAndAnalytics,
                        featureFlags: {
                          ...prev.platformAndAnalytics.featureFlags,
                          rolloutScope: e.target.value as "all" | "campus" | "cohort",
                        },
                      },
                    }))
                  }
                >
                  <option value="all">All users</option>
                  <option value="campus">Selected campuses</option>
                  <option value="cohort">Selected cohorts</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Rollout target</Label>
                <Input
                  placeholder="e.g. North Campus / 2015-2020"
                  value={settings.platformAndAnalytics.featureFlags.rolloutTarget}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      platformAndAnalytics: {
                        ...prev.platformAndAnalytics,
                        featureFlags: {
                          ...prev.platformAndAnalytics.featureFlags,
                          rolloutTarget: e.target.value,
                        },
                      },
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dashboard widgets</Label>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {(Object.keys(settings.platformAndAnalytics.dashboardWidgets) as Array<keyof AdminSettingsData["platformAndAnalytics"]["dashboardWidgets"]>).map((widget) => (
                <div key={widget} className="flex items-center justify-between rounded-md border p-3">
                  <Label className="capitalize">{String(widget).replace(/([A-Z])/g, " $1")}</Label>
                  <Switch
                    checked={settings.platformAndAnalytics.dashboardWidgets[widget]}
                    onCheckedChange={(value) =>
                      setSettings((prev) => ({
                        ...prev,
                        platformAndAnalytics: {
                          ...prev.platformAndAnalytics,
                          dashboardWidgets: {
                            ...prev.platformAndAnalytics.dashboardWidgets,
                            [widget]: value,
                          },
                        },
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case "institution-rules":
        return renderInstitutionRules();
      case "content-lifecycle":
        return renderContentLifecycle();
      case "automation":
        return renderAutomation();
      case "communication":
        return renderCommunication();
      case "admin-operations":
        return renderAdminOperations();
      case "access-control":
        return renderAccessControl();
      case "alumni-data-rules":
        return renderAlumniDataRules();
      case "moderation-controls":
        return renderModerationControls();
      case "community-settings":
        return renderCommunitySettings();
      case "platform-analytics":
        return renderPlatformAnalytics();
      default:
        return renderAccessControl();
    }
  };

  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="space-y-3 xl:sticky xl:top-4 self-start">
            <div>
              <h3 className="text-base font-semibold">Admin Settings</h3>
              <p className="text-xs text-muted-foreground">Centralized platform policy controls.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
              {sectionList.map((section) => (
                <Button
                  key={section.id}
                  variant={activeSection === section.id ? "default" : "outline"}
                  className="w-full justify-between min-w-0"
                  onClick={() => setActiveSection(section.id)}
                >
                  <span className="truncate">{section.label}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {sectionHasChanges(section.id) && <Badge variant="secondary">Changed</Badge>}
                    {activeSection === section.id && !sectionHasChanges(section.id) && <Badge variant="outline">Active</Badge>}
                  </div>
                </Button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              {hasUnsavedChanges
                ? `${changedSections.length} section${changedSections.length === 1 ? "" : "s"} changed`
                : lastSavedAt
                  ? `All changes saved · ${new Date(lastSavedAt).toLocaleString()}`
                  : "No saved changes yet"}
            </p>
          </aside>

          <section className="space-y-4 min-w-0">
            <Card>
              <CardContent className="pt-6 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{activeSectionMeta?.label || "Settings"}</h3>
                    {sectionHasChanges(activeSection) ? (
                      <Badge variant="secondary">Unsaved changes</Badge>
                    ) : (
                      <Badge variant="outline">Saved</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {lastSavedAt ? `Last saved: ${new Date(lastSavedAt).toLocaleString()}` : "Last saved: Not yet"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {renderSectionContent()}

            <Card className="md:sticky md:bottom-3 z-10 border-primary/20 shadow-sm backdrop-blur bg-background/95">
              <CardContent className="py-3">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div className="text-sm">
                    <span className="font-medium">{hasUnsavedChanges ? `${changedSections.length} unsaved change${changedSections.length === 1 ? "" : "s"}` : "All changes saved"}</span>
                    <span className="text-muted-foreground"> · {activeSectionMeta?.label || "Settings"}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="destructive"
                      onClick={resetSettings}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset Defaults
                    </Button>
                    <Button
                      onClick={saveSettings}
                      disabled={!hasUnsavedChanges || saveState === "saving"}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saveState === "saving" ? "Saving..." : "Save Settings"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </CardContent>
    </Card>
  );
}
