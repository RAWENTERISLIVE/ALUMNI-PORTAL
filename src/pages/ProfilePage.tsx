import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { LinkedInImporter } from "@/components/profile/LinkedInImporter";
import { RequestMentorshipModal } from "@/components/mentorship/RequestMentorshipModal";
import apiService from "@/services/apiService";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { User, Briefcase, MapPin, GraduationCap, Mail, Phone, Globe, PlusCircle, Sparkles, Loader2, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface ExperienceItem {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
}

interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  startYear: string;
  endYear: string;
  location: string;
  description: string;
}

type DetailedSectionKey =
  | 'featured'
  | 'services'
  | 'careerBreak'
  | 'certifications'
  | 'projects'
  | 'courses'
  | 'recommendations'
  | 'volunteerExperience'
  | 'publications'
  | 'patents'
  | 'honorsAwards'
  | 'testScores'
  | 'languages'
  | 'organizations'
  | 'causes';

type DetailedSectionGroup = 'Core' | 'Recommended' | 'Additional';

interface DetailedProfileItem {
  id: string;
  title: string;
  organization: string;
  startDate: string;
  endDate: string;
  description: string;
  url: string;
  extraData?: Record<string, string | boolean | string[]>;
}

interface DetailedSectionConfig {
  key: DetailedSectionKey;
  label: string;
  group: DetailedSectionGroup;
  hint: string;
}

type DetailedFieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'multiselect';

interface DetailedSectionField {
  key: string;
  label: string;
  type: DetailedFieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  helperText?: string;
  rows?: number;
}

interface DetailedSectionFormConfig {
  helperText: string;
  fields: DetailedSectionField[];
  summaryMap: {
    title?: string;
    organization?: string;
    startDate?: string;
    endDate?: string;
    url?: string;
    description?: string;
  };
}

const DETAILED_SECTION_CONFIG: DetailedSectionConfig[] = [
  { key: 'featured', label: 'Featured', group: 'Recommended', hint: 'Showcase top posts, portfolios, and achievements' },
  { key: 'services', label: 'Services', group: 'Core', hint: 'List mentorship or consulting services you offer' },
  { key: 'careerBreak', label: 'Career Break', group: 'Core', hint: 'Add context for transition periods in your journey' },
  { key: 'certifications', label: 'Licenses & Certifications', group: 'Recommended', hint: 'Professional certifications and credential IDs' },
  { key: 'projects', label: 'Projects', group: 'Recommended', hint: 'Portfolio projects with outcomes and links' },
  { key: 'courses', label: 'Courses', group: 'Recommended', hint: 'Relevant upskilling and continuing education' },
  { key: 'recommendations', label: 'Recommendations', group: 'Recommended', hint: 'Peer and manager testimonials' },
  { key: 'volunteerExperience', label: 'Volunteer Experience', group: 'Additional', hint: 'Community leadership and social contribution' },
  { key: 'publications', label: 'Publications', group: 'Additional', hint: 'Articles, papers, journals, and blogs' },
  { key: 'patents', label: 'Patents', group: 'Additional', hint: 'Filed or granted patents' },
  { key: 'honorsAwards', label: 'Honors & Awards', group: 'Additional', hint: 'Recognitions and competition outcomes' },
  { key: 'testScores', label: 'Test Scores', group: 'Additional', hint: 'Standardized or professional exam scores' },
  { key: 'languages', label: 'Languages', group: 'Additional', hint: 'Languages and proficiency levels' },
  { key: 'organizations', label: 'Organizations', group: 'Additional', hint: 'Professional bodies and memberships' },
  { key: 'causes', label: 'Causes', group: 'Additional', hint: 'Social causes and initiatives you support' },
];

const DETAILED_SECTION_FORM_CONFIG: Record<DetailedSectionKey, DetailedSectionFormConfig> = {
  featured: {
    helperText: 'Add a featured post/article/link/media item.',
    fields: [
      { key: 'featureType', label: 'Type', type: 'select', required: true, options: ['Post', 'Article', 'Link', 'Media'] },
      { key: 'featureTitle', label: 'Title', type: 'text', required: true, placeholder: 'Featured item title' },
      { key: 'featureUrl', label: 'Link', type: 'text', placeholder: 'https://...' },
      { key: 'featureDescription', label: 'Description', type: 'textarea', rows: 4, placeholder: 'Brief context about this featured item' },
    ],
    summaryMap: { title: 'featureTitle', organization: 'featureType', url: 'featureUrl', description: 'featureDescription' },
  },
  services: {
    helperText: 'Set up services with offerings, location, and pricing.',
    fields: [
      { key: 'servicesOffered', label: 'Services provided', type: 'multiselect', required: true, options: ['Ad Design', 'Brand Design', 'Graphic Design', 'Logo Design', 'Video Editing', 'Video Production', 'Web Design', 'Software Testing', 'Web Development', 'Other'] },
      { key: 'otherServiceDetails', label: 'Other services', type: 'text', placeholder: 'Describe additional services you provide' },
      { key: 'serviceDescription', label: 'About', type: 'textarea', rows: 4, placeholder: 'Describe your services and value.' },
      { key: 'workLocation', label: 'Work location', type: 'text', placeholder: 'e.g. Pushkar, Rajasthan' },
      { key: 'workRemote', label: 'Available to work remotely', type: 'checkbox' },
      { key: 'pricingMode', label: 'Pricing', type: 'select', options: ['Contact for pricing', 'Starting at'] },
      { key: 'hourlyRate', label: 'Hourly rate', type: 'text', placeholder: 'e.g. 40 USD' },
    ],
    summaryMap: { title: 'servicesOffered', organization: 'pricingMode', description: 'serviceDescription' },
  },
  careerBreak: {
    helperText: 'Add type, location, timeline, and context for your career break.',
    fields: [
      { key: 'breakType', label: 'Type', type: 'select', required: true, options: ['Family caregiving', 'Full-time parenting', 'Health and wellbeing', 'Layoff', 'Career transition', 'Travel', 'Education', 'Other'] },
      { key: 'breakLocation', label: 'Location', type: 'text', placeholder: 'e.g. London, United Kingdom' },
      { key: 'currentlyOnBreak', label: 'I am currently on this career break', type: 'checkbox' },
      { key: 'breakStartDate', label: 'Start date', type: 'text', required: true, placeholder: 'Month / Year' },
      { key: 'breakEndDate', label: 'End date', type: 'text', placeholder: 'Month / Year' },
      { key: 'breakDescription', label: 'Description', type: 'textarea', rows: 4, placeholder: 'What you did and learned during this break' },
    ],
    summaryMap: { title: 'breakType', organization: 'breakLocation', startDate: 'breakStartDate', endDate: 'breakEndDate', description: 'breakDescription' },
  },
  certifications: {
    helperText: 'Include credential details like ID and URL.',
    fields: [
      { key: 'certName', label: 'Name', type: 'text', required: true, placeholder: 'Certification name' },
      { key: 'certIssuer', label: 'Issuing organization', type: 'text', required: true, placeholder: 'e.g. Microsoft' },
      { key: 'certIssueDate', label: 'Issue date', type: 'text', placeholder: 'Month / Year' },
      { key: 'certExpiryDate', label: 'Expiration date', type: 'text', placeholder: 'Month / Year' },
      { key: 'certCredentialId', label: 'Credential ID', type: 'text', placeholder: 'Credential ID' },
      { key: 'certCredentialUrl', label: 'Credential URL', type: 'text', placeholder: 'https://...' },
    ],
    summaryMap: { title: 'certName', organization: 'certIssuer', startDate: 'certIssueDate', endDate: 'certExpiryDate', url: 'certCredentialUrl', description: 'certCredentialId' },
  },
  projects: {
    helperText: 'Add project basics plus additional details.',
    fields: [
      { key: 'projectName', label: 'Project name', type: 'text', required: true, placeholder: 'Project name' },
      { key: 'projectDescription', label: 'Description', type: 'textarea', rows: 4, placeholder: 'Project summary and impact' },
      { key: 'projectCurrent', label: 'I am currently working on this project', type: 'checkbox' },
      { key: 'projectStartDate', label: 'Start date', type: 'text', placeholder: 'Month / Year' },
      { key: 'projectEndDate', label: 'End date', type: 'text', placeholder: 'Month / Year' },
      { key: 'projectContributors', label: 'Contributors', type: 'text', placeholder: 'Names (comma separated)' },
      { key: 'projectAssociatedWith', label: 'Associated with', type: 'text', placeholder: 'Organization or role' },
      { key: 'projectUrl', label: 'Project URL', type: 'text', placeholder: 'https://...' },
    ],
    summaryMap: { title: 'projectName', organization: 'projectAssociatedWith', startDate: 'projectStartDate', endDate: 'projectEndDate', url: 'projectUrl', description: 'projectDescription' },
  },
  courses: {
    helperText: 'Add course name, number, and association.',
    fields: [
      { key: 'courseName', label: 'Course name', type: 'text', required: true, placeholder: 'e.g. World History' },
      { key: 'courseNumber', label: 'Number', type: 'text', placeholder: 'e.g. HIS101' },
      { key: 'courseAssociatedWith', label: 'Associated with', type: 'text', placeholder: 'School / degree / role' },
    ],
    summaryMap: { title: 'courseName', organization: 'courseAssociatedWith', description: 'courseNumber' },
  },
  recommendations: {
    helperText: 'Request-focused recommendation details.',
    fields: [
      { key: 'recommendationPerson', label: 'Who do you want to ask?', type: 'text', required: true, placeholder: 'Person name' },
      { key: 'recommendationRelationship', label: 'Relationship', type: 'text', required: true, placeholder: 'e.g. Manager' },
      { key: 'recommendationPositionAtTime', label: 'Position at the time', type: 'text', placeholder: 'Your role then' },
      { key: 'recommendationMessage', label: 'Personalized message', type: 'textarea', rows: 5, placeholder: 'Request message' },
    ],
    summaryMap: { title: 'recommendationPerson', organization: 'recommendationRelationship', description: 'recommendationMessage' },
  },
  volunteerExperience: {
    helperText: 'Include role, cause, timeline, and contribution.',
    fields: [
      { key: 'volunteerOrganization', label: 'Organization', type: 'text', required: true, placeholder: 'e.g. Red Cross' },
      { key: 'volunteerRole', label: 'Role', type: 'text', required: true, placeholder: 'e.g. Fundraising Volunteer' },
      { key: 'volunteerCause', label: 'Cause', type: 'text', placeholder: 'Cause area' },
      { key: 'volunteerCurrent', label: 'I am currently volunteering in this role', type: 'checkbox' },
      { key: 'volunteerStartDate', label: 'Start date', type: 'text', placeholder: 'Month / Year' },
      { key: 'volunteerEndDate', label: 'End date', type: 'text', placeholder: 'Month / Year' },
      { key: 'volunteerDescription', label: 'Description', type: 'textarea', rows: 4, placeholder: 'Your contribution and outcomes' },
    ],
    summaryMap: { title: 'volunteerRole', organization: 'volunteerOrganization', startDate: 'volunteerStartDate', endDate: 'volunteerEndDate', description: 'volunteerDescription' },
  },
  publications: {
    helperText: 'Add publication details and contributors.',
    fields: [
      { key: 'publicationTitle', label: 'Title', type: 'text', required: true, placeholder: 'Publication title' },
      { key: 'publicationPublisher', label: 'Publication/Publisher', type: 'text', placeholder: 'Publisher name' },
      { key: 'publicationDate', label: 'Publication date', type: 'text', placeholder: 'mm/dd/yyyy' },
      { key: 'publicationAuthors', label: 'Author(s)', type: 'text', placeholder: 'Names (comma separated)' },
      { key: 'publicationUrl', label: 'Publication URL', type: 'text', placeholder: 'https://...' },
      { key: 'publicationDescription', label: 'Description', type: 'textarea', rows: 4, placeholder: 'Publication summary' },
    ],
    summaryMap: { title: 'publicationTitle', organization: 'publicationPublisher', startDate: 'publicationDate', url: 'publicationUrl', description: 'publicationDescription' },
  },
  patents: {
    helperText: 'Track patent number, status, and issue date.',
    fields: [
      { key: 'patentTitle', label: 'Patent title', type: 'text', required: true, placeholder: 'Patent title' },
      { key: 'patentNumber', label: 'Patent or application number', type: 'text', required: true, placeholder: 'e.g. US 9229900' },
      { key: 'patentInventors', label: 'Inventor(s)', type: 'text', placeholder: 'Names (comma separated)' },
      { key: 'patentStatus', label: 'Status', type: 'select', options: ['Patent issued', 'Patent pending'] },
      { key: 'patentIssueDate', label: 'Issue date', type: 'text', placeholder: 'mm/dd/yyyy' },
      { key: 'patentUrl', label: 'Patent URL', type: 'text', placeholder: 'https://...' },
      { key: 'patentDescription', label: 'Description', type: 'textarea', rows: 4, placeholder: 'Patent summary' },
    ],
    summaryMap: { title: 'patentTitle', organization: 'patentNumber', startDate: 'patentIssueDate', url: 'patentUrl', description: 'patentDescription' },
  },
  honorsAwards: {
    helperText: 'Capture award title, issuer, and date.',
    fields: [
      { key: 'awardTitle', label: 'Title', type: 'text', required: true, placeholder: 'Award title' },
      { key: 'awardAssociatedWith', label: 'Associated with', type: 'text', placeholder: 'Organization / role' },
      { key: 'awardIssuer', label: 'Issuer', type: 'text', placeholder: 'Issuer name' },
      { key: 'awardIssueDate', label: 'Issue date', type: 'text', placeholder: 'Month / Year' },
      { key: 'awardDescription', label: 'Description', type: 'textarea', rows: 4, placeholder: 'Award context' },
    ],
    summaryMap: { title: 'awardTitle', organization: 'awardIssuer', startDate: 'awardIssueDate', description: 'awardDescription' },
  },
  testScores: {
    helperText: 'Add the test, score, date, and context.',
    fields: [
      { key: 'testTitle', label: 'Title', type: 'text', required: true, placeholder: 'Test name' },
      { key: 'testAssociatedWith', label: 'Associated with', type: 'text', placeholder: 'Organization / purpose' },
      { key: 'testScore', label: 'Score', type: 'text', required: true, placeholder: 'e.g. 168/170' },
      { key: 'testDate', label: 'Test date', type: 'text', placeholder: 'Month / Year' },
      { key: 'testDescription', label: 'Description', type: 'textarea', rows: 4, placeholder: 'Additional context' },
    ],
    summaryMap: { title: 'testTitle', organization: 'testAssociatedWith', startDate: 'testDate', description: 'testDescription' },
  },
  languages: {
    helperText: 'Add language, proficiency, and optional score.',
    fields: [
      { key: 'languageName', label: 'Language', type: 'text', required: true, placeholder: 'Language name' },
      { key: 'languageProficiency', label: 'Proficiency', type: 'select', required: true, options: ['Native or bilingual', 'Full professional', 'Professional working', 'Limited working', 'Elementary'] },
      { key: 'languageDuolingoScore', label: 'Duolingo score (optional)', type: 'text', placeholder: 'e.g. 130' },
    ],
    summaryMap: { title: 'languageName', organization: 'languageProficiency', description: 'languageDuolingoScore' },
  },
  organizations: {
    helperText: 'Capture membership details and timeline.',
    fields: [
      { key: 'organizationName', label: 'Organization name', type: 'text', required: true, placeholder: 'Organization name' },
      { key: 'organizationPosition', label: 'Position held', type: 'text', placeholder: 'Position held' },
      { key: 'organizationAssociatedWith', label: 'Associated with', type: 'text', placeholder: 'Role / profile context' },
      { key: 'organizationOngoing', label: 'Membership ongoing', type: 'checkbox' },
      { key: 'organizationStartDate', label: 'Start date', type: 'text', placeholder: 'Month / Year' },
      { key: 'organizationEndDate', label: 'End date', type: 'text', placeholder: 'Month / Year' },
      { key: 'organizationDescription', label: 'Description', type: 'textarea', rows: 4, placeholder: 'Membership details' },
    ],
    summaryMap: { title: 'organizationName', organization: 'organizationPosition', startDate: 'organizationStartDate', endDate: 'organizationEndDate', description: 'organizationDescription' },
  },
  causes: {
    helperText: 'Choose causes you care about.',
    fields: [
      { key: 'causeList', label: 'Causes', type: 'multiselect', required: true, options: ['Animal Welfare', 'Arts and Culture', 'Children', 'Civil Rights and Social Action', 'Disaster and Humanitarian Relief', 'Economic Empowerment', 'Education', 'Environment', 'Health', 'Human Rights', 'Politics', 'Poverty Alleviation', 'Science and Technology', 'Social Services', 'Veteran Support'] },
    ],
    summaryMap: { title: 'causeList' },
  },
};

interface DetailedFormData {
  title: string;
  organization: string;
  startDate: string;
  endDate: string;
  description: string;
  url: string;
  extraData: Record<string, string | boolean | string[]>;
}

const getDefaultFieldValue = (field: DetailedSectionField): string | boolean | string[] => {
  if (field.type === 'checkbox') return false;
  if (field.type === 'multiselect') return [];
  return '';
};

const createDetailedFormData = (section: DetailedSectionKey, item?: DetailedProfileItem): DetailedFormData => {
  const sectionConfig = DETAILED_SECTION_FORM_CONFIG[section];
  const defaults: Record<string, string | boolean | string[]> = {};

  sectionConfig.fields.forEach((field) => {
    defaults[field.key] = getDefaultFieldValue(field);
  });

  const itemExtraData = item?.extraData && typeof item.extraData === 'object' ? item.extraData : {};
  const summaryFallbacks: Record<string, string | boolean | string[]> = {};
  const summaryPairs: Array<[string | undefined, string]> = [
    [sectionConfig.summaryMap.title, item?.title || ''],
    [sectionConfig.summaryMap.organization, item?.organization || ''],
    [sectionConfig.summaryMap.startDate, item?.startDate || ''],
    [sectionConfig.summaryMap.endDate, item?.endDate || ''],
    [sectionConfig.summaryMap.url, item?.url || ''],
    [sectionConfig.summaryMap.description, item?.description || ''],
  ];

  summaryPairs.forEach(([key, rawValue]) => {
    if (!key || !rawValue) return;
    const defaultValue = defaults[key];
    if (Array.isArray(defaultValue)) {
      summaryFallbacks[key] = rawValue.split(',').map((value) => value.trim()).filter(Boolean);
      return;
    }
    if (typeof defaultValue === 'boolean') {
      summaryFallbacks[key] = rawValue.toLowerCase() === 'yes' || rawValue.toLowerCase() === 'true';
      return;
    }
    summaryFallbacks[key] = rawValue;
  });

  return {
    title: item?.title || '',
    organization: item?.organization || '',
    startDate: item?.startDate || '',
    endDate: item?.endDate || '',
    description: item?.description || '',
    url: item?.url || '',
    extraData: {
      ...defaults,
      ...summaryFallbacks,
      ...itemExtraData,
    },
  };
};

const createEmptyDetailedSections = (): Record<DetailedSectionKey, DetailedProfileItem[]> => ({
  featured: [],
  services: [],
  careerBreak: [],
  certifications: [],
  projects: [],
  courses: [],
  recommendations: [],
  volunteerExperience: [],
  publications: [],
  patents: [],
  honorsAwards: [],
  testScores: [],
  languages: [],
  organizations: [],
  causes: [],
});

const profileSchema = z.object({
  name: z.string().min(2, { message: "Name is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  bio: z.string().optional(),
  headline: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  linkedin: z.string().optional(),
  twitter: z.string().optional(),
  github: z.string().optional(),
  availableAsMentor: z.boolean().optional(),
});

export default function ProfilePage() {
  const { id } = useParams<{ id?: string }>();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isLinkedInModalOpen, setIsLinkedInModalOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  
  // Add states for experience, education and skills forms
  const [isExperienceModalOpen, setIsExperienceModalOpen] = useState(false);
  const [isEducationModalOpen, setIsEducationModalOpen] = useState(false);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const [currentExperience, setCurrentExperience] = useState<ExperienceItem | null>(null);
  const [currentEducation, setCurrentEducation] = useState<EducationItem | null>(null);
  const [newSkill, setNewSkill] = useState("");
  const [skillEditorMode, setSkillEditorMode] = useState<'skills' | 'interests'>('skills');
  const [experiences, setExperiences] = useState<ExperienceItem[]>([]);
  const [educations, setEducations] = useState<EducationItem[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [detailedSections, setDetailedSections] = useState<Record<DetailedSectionKey, DetailedProfileItem[]>>(createEmptyDetailedSections());
  const [isAddToProfileModalOpen, setIsAddToProfileModalOpen] = useState(false);
  const [isDetailedItemModalOpen, setIsDetailedItemModalOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionState, setConnectionState] = useState<'none' | 'pending' | 'incoming' | 'connected'>('none');
  const [isRequestMentorshipModalOpen, setIsRequestMentorshipModalOpen] = useState(false);
  const [activeDetailedSection, setActiveDetailedSection] = useState<DetailedSectionKey>('projects');
  const [currentDetailedItem, setCurrentDetailedItem] = useState<DetailedProfileItem | null>(null);
  const [profilePhotoLoading, setProfilePhotoLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { refreshUser } = useAuth();

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    try {
      setProfilePhotoLoading(true);
      const uploadResponse = await apiService.uploadFile(selectedFile);
      const imageUrl = uploadResponse.data?.url;

      if (!uploadResponse.success || !imageUrl) {
        throw new Error(uploadResponse.message || "Failed to upload profile photo");
      }

      // Update backend
      const profileResponse = await apiService.updateProfile({ profileImage: imageUrl });
      if (!profileResponse.success) {
        throw new Error(profileResponse.message || "Failed to update profile photo");
      }

      // Update local state
      setProfile((prev: any) => ({ ...prev, profileImage: imageUrl }));
      
      // Update global user context if it's our own profile
      if (isOwnProfile && refreshUser) {
        await refreshUser();
      }

      toast({
        title: "Photo Updated",
        description: "Your profile photo has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile photo.",
        variant: "destructive",
      });
    } finally {
      setProfilePhotoLoading(false);
      // Reset input so the same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const [detailedFormData, setDetailedFormData] = useState<DetailedFormData>(createDetailedFormData('projects'));
  const [experienceFormData, setExperienceFormData] = useState<Omit<ExperienceItem, 'id'>>({
    title: '',
    company: '',
    startDate: '',
    endDate: '',
    location: '',
    description: '',
  });
  const [educationFormData, setEducationFormData] = useState<Omit<EducationItem, 'id'>>({
    degree: '',
    institution: '',
    startYear: '',
    endYear: '',
    location: '',
    description: '',
  });
  
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      bio: "",
      headline: "",
      contactEmail: "",
      contactPhone: "",
      company: "",
      position: "",
      location: "",
      website: "",
      linkedin: "",
      twitter: "",
      github: "",
      availableAsMentor: false,
    },
  });
  
  // Fetch user profile either by ID or current user
  useEffect(() => {
    const fetchProfile = async () => {
      // If an ID is provided and it's not the current user's ID, fetch that profile
      if (id && (!currentUser || id !== currentUser.id)) {
        setIsLoading(true);
        setIsError(false);
        
        try {
          console.log('Fetching profile for user ID:', id);
          const response = await apiService.getUserById(id);
          console.log('Profile response:', response);
          
          const userData = response.user || response.data;

          if (response.success && userData) {
            // Ensure id property exists alongside _id for consistency
            if (userData._id && !userData.id) {
              userData.id = userData._id;
            }
            setProfile(userData);
            setIsOwnProfile(false);
            setConnectionState((userData.connectionStatus as 'none' | 'pending' | 'incoming' | 'connected') || 'none');
          } else {
            setIsError(true);
            toast({
              title: "Profile not found",
              description: "We couldn't find the requested profile.",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
          setIsError(true);
          toast({
            title: "Error",
            description: "Failed to load profile. Please try again later.",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        // If no ID provided, or ID matches current user, show current user's profile
        if (currentUser) {
          setIsLoading(true);
          setIsError(false);

          try {
            const meResponse = await apiService.getCurrentUser();
            const userData = meResponse.user || meResponse.data || currentUser;
            setProfile({
              ...userData,
              id: userData.id || userData._id || currentUser.id,
            });
            setIsOwnProfile(true);
            setConnectionState('none');
          } catch (error) {
            const fallbackUser = { ...currentUser, id: currentUser.id };
            setProfile(fallbackUser);
            setIsOwnProfile(true);
            setConnectionState('none');
          } finally {
            setIsLoading(false);
            setIsError(false);
          }
        } else {
          // If no current user (not logged in), redirect to login
          navigate('/login', { state: { returnUrl: `/directory/profile/${id}` } });
        }
      }
    };
    
    fetchProfile();
  }, [id, currentUser, toast, navigate]);
  
  // Update form values when profile changes
  useEffect(() => {
    if (profile) {
      // Update form values with profile data
      form.reset({
        name: profile.name || "",
        email: profile.email || "",
        bio: profile.bio || "",
        headline: profile.headline || "",
        contactEmail: profile.contactEmail || profile.email || "",
        contactPhone: profile.contactPhone || "",
        company: profile.company || "",
        position: profile.jobTitle || "",
        location: profile.location || "",
        website: profile.website || profile?.privacySettings?.website || "",
        linkedin: profile.linkedInProfile || "",
        twitter: profile.twitterHandle || profile?.privacySettings?.twitterHandle || "",
        github: profile.githubHandle || profile?.privacySettings?.githubHandle || "",
        availableAsMentor: profile.isAvailableAsMentor || false,
      });

      const normalizedExperiences = Array.isArray(profile.experiences)
        ? profile.experiences
            .map((item: any) => ({
              id: String(item?.id || crypto.randomUUID()),
              title: item?.title || '',
              company: item?.company || '',
              startDate: item?.startDate || '',
              endDate: item?.endDate || '',
              location: item?.location || '',
              description: item?.description || '',
            }))
            .filter((item: ExperienceItem) => item.title || item.company)
        : [];

      const normalizedEducations = Array.isArray(profile.educations)
        ? profile.educations
            .map((item: any) => ({
              id: String(item?.id || crypto.randomUUID()),
              degree: item?.degree || '',
              institution: item?.institution || '',
              startYear: item?.startYear || '',
              endYear: item?.endYear || '',
              location: item?.location || '',
              description: item?.description || '',
            }))
            .filter((item: EducationItem) => item.degree || item.institution)
        : [];

      setExperiences(normalizedExperiences);
      setEducations(normalizedEducations);
      setSkills(Array.isArray(profile.skills) ? profile.skills.filter((value: unknown) => typeof value === 'string') : []);
      setInterests(Array.isArray(profile.interests) ? profile.interests.filter((value: unknown) => typeof value === 'string') : []);

      const rawSections = profile?.privacySettings?.profileSections;
      const normalizedSections = createEmptyDetailedSections();

      if (rawSections && typeof rawSections === 'object') {
        (Object.keys(normalizedSections) as DetailedSectionKey[]).forEach((key) => {
          const current = (rawSections as Record<string, unknown>)[key];
          if (!Array.isArray(current)) return;
          normalizedSections[key] = current
            .map((item: any) => ({
              id: String(item?.id || crypto.randomUUID()),
              title: item?.title || '',
              organization: item?.organization || '',
              startDate: item?.startDate || '',
              endDate: item?.endDate || '',
              description: item?.description || '',
              url: item?.url || '',
              extraData: item?.extraData && typeof item.extraData === 'object' ? item.extraData : {},
            }))
            .filter((item: DetailedProfileItem) => item.title || item.organization || item.description);
        });
      }

      setDetailedSections(normalizedSections);
    }
  }, [profile, form]);
  
  const saveProfileSections = async (
    nextExperiences: ExperienceItem[],
    nextEducations: EducationItem[],
    nextSkills: string[],
    nextInterests: string[]
  ) => {
    if (!isOwnProfile || !profile) return false;

    const response = await apiService.updateUserProfile(profile.id || profile._id, {
      experiences: nextExperiences,
      educations: nextEducations,
      skills: nextSkills,
      interests: nextInterests,
    });

    if (!response.success) {
      toast({
        title: 'Update failed',
        description: response.message || 'Could not save profile sections.',
        variant: 'destructive',
      });
      return false;
    }

    const updatedProfile = response.data || response.user;
    if (updatedProfile) {
      setProfile((previous: any) => ({
        ...previous,
        ...updatedProfile,
      }));
    }

    return true;
  };

  const saveDetailedSections = async (nextDetailedSections: Record<DetailedSectionKey, DetailedProfileItem[]>) => {
    if (!isOwnProfile || !profile) return false;

    const basePrivacySettings =
      profile.privacySettings && typeof profile.privacySettings === 'object'
        ? profile.privacySettings
        : {};

    const nextPrivacySettings = {
      ...basePrivacySettings,
      profileSections: nextDetailedSections,
    };

    const response = await apiService.updateUserProfile(profile.id || profile._id, {
      privacySettings: nextPrivacySettings,
    });

    if (!response.success) {
      toast({
        title: 'Update failed',
        description: response.message || 'Could not save detailed profile sections.',
        variant: 'destructive',
      });
      return false;
    }

    const updatedProfile = response.data || response.user;
    if (updatedProfile) {
      setProfile((previous: any) => ({
        ...previous,
        ...updatedProfile,
      }));
    }

    return true;
  };

  const openDetailedItemModal = (section: DetailedSectionKey, item?: DetailedProfileItem) => {
    setActiveDetailedSection(section);
    if (item) {
      setCurrentDetailedItem(item);
      setDetailedFormData(createDetailedFormData(section, item));
    } else {
      setCurrentDetailedItem(null);
      setDetailedFormData(createDetailedFormData(section));
    }
    setIsDetailedItemModalOpen(true);
    setIsAddToProfileModalOpen(false);
  };

  const handleSaveDetailedItem = async () => {
    const sectionConfig = DETAILED_SECTION_FORM_CONFIG[activeDetailedSection];

    const missingRequiredField = sectionConfig.fields.find((field) => {
      if (!field.required) return false;
      const value = detailedFormData.extraData[field.key];
      if (field.type === 'checkbox') return value !== true;
      if (field.type === 'multiselect') return !Array.isArray(value) || value.length === 0;
      return !String(value || '').trim();
    });

    if (missingRequiredField) {
      toast({
        title: `${missingRequiredField.label} is required`,
        description: 'Please complete the required fields before saving.',
        variant: 'destructive',
      });
      return;
    }

    const valueFor = (key?: string): string => {
      if (!key) return '';
      const value = detailedFormData.extraData[key];
      if (Array.isArray(value)) return value.join(', ');
      if (typeof value === 'boolean') return value ? 'Yes' : 'No';
      return String(value || '').trim();
    };

    const payload: Omit<DetailedProfileItem, 'id'> = {
      title: valueFor(sectionConfig.summaryMap.title),
      organization: valueFor(sectionConfig.summaryMap.organization),
      startDate: valueFor(sectionConfig.summaryMap.startDate),
      endDate: valueFor(sectionConfig.summaryMap.endDate),
      description: valueFor(sectionConfig.summaryMap.description),
      url: valueFor(sectionConfig.summaryMap.url),
      extraData: detailedFormData.extraData,
    };

    if (activeDetailedSection === 'services') {
      const otherDetails = valueFor('otherServiceDetails');
      if (otherDetails) {
        payload.description = [payload.description, `Other services: ${otherDetails}`]
          .filter(Boolean)
          .join('\n');
      }
    }

    if (!payload.title) {
      payload.title = activeDetailedSectionMeta?.label || 'Profile entry';
    }

    const previousSections = detailedSections;
    const nextSections = { ...detailedSections };
    const currentItems = [...nextSections[activeDetailedSection]];

    if (currentDetailedItem) {
      nextSections[activeDetailedSection] = currentItems.map((item) =>
        item.id === currentDetailedItem.id ? { ...payload, id: item.id } : item
      );
    } else {
      nextSections[activeDetailedSection] = [
        { ...payload, id: crypto.randomUUID() },
        ...currentItems,
      ];
    }

    setDetailedSections(nextSections);
    const saved = await saveDetailedSections(nextSections);
    if (!saved) {
      setDetailedSections(previousSections);
      return;
    }

    setIsDetailedItemModalOpen(false);
    toast({
      title: currentDetailedItem ? 'Entry updated' : 'Entry added',
      description: 'Detailed section has been saved successfully.',
    });
  };

  const handleDeleteDetailedItem = async (section: DetailedSectionKey, id: string) => {
    const previousSections = detailedSections;
    const nextSections = {
      ...detailedSections,
      [section]: detailedSections[section].filter((item) => item.id !== id),
    };

    setDetailedSections(nextSections);
    const saved = await saveDetailedSections(nextSections);
    if (!saved) {
      setDetailedSections(previousSections);
      return;
    }

    toast({
      title: 'Entry deleted',
      description: 'The section item was removed.',
    });
  };

  const handleImportLinkedInData = async (data: any) => {
    form.setValue("name", data.name || form.getValues().name);
    form.setValue("headline", data.headline || form.getValues().headline);
    form.setValue("contactEmail", data.email || form.getValues().contactEmail);
    form.setValue("company", data.company || form.getValues().company);
    form.setValue("position", data.position || form.getValues().position);
    form.setValue("bio", data.bio || form.getValues().bio);
    form.setValue("location", data.location || form.getValues().location);
    form.setValue("website", data.website || form.getValues().website);
    form.setValue("linkedin", data.linkedin || form.getValues().linkedin);
    form.setValue("twitter", data.twitter || form.getValues().twitter);
    form.setValue("github", data.github || form.getValues().github);

    const nextExperiences = Array.isArray(data.experiences)
      ? data.experiences
          .map((item: any) => ({
            id: String(item?.id || crypto.randomUUID()),
            title: item?.title || '',
            company: item?.company || '',
            startDate: item?.startDate || '',
            endDate: item?.endDate || '',
            location: item?.location || '',
            description: item?.description || '',
          }))
          .filter((item: ExperienceItem) => item.title || item.company)
      : experiences;

    const nextEducations = Array.isArray(data.educations)
      ? data.educations
          .map((item: any) => ({
            id: String(item?.id || crypto.randomUUID()),
            degree: item?.degree || '',
            institution: item?.institution || '',
            startYear: item?.startYear || '',
            endYear: item?.endYear || '',
            location: item?.location || '',
            description: item?.description || '',
          }))
          .filter((item: EducationItem) => item.degree || item.institution)
      : educations;

    const nextSkills = Array.isArray(data.skills)
      ? data.skills.filter((value: unknown) => typeof value === 'string')
      : skills;

    setExperiences(nextExperiences);
    setEducations(nextEducations);
    setSkills(nextSkills);

    if (isOwnProfile && profile) {
      const profileResponse = await apiService.updateUserProfile(profile.id || profile._id, {
        headline: data.headline || form.getValues().headline,
        company: data.company || form.getValues().company,
        position: data.position || form.getValues().position,
        bio: data.bio || form.getValues().bio,
        location: data.location || form.getValues().location,
        linkedInProfile: data.connectLinkedIn ? data.linkedin : form.getValues().linkedin,
        experiences: nextExperiences,
        educations: nextEducations,
        skills: nextSkills,
        interests,
      });

      if (!profileResponse.success) {
        throw new Error(profileResponse.message || 'Failed to connect LinkedIn profile');
      }

      const updatedProfile = profileResponse.user || profileResponse.data;
      if (updatedProfile) {
        setProfile((previous: any) => ({
          ...previous,
          ...updatedProfile,
        }));
      }
    } else {
      await saveProfileSections(nextExperiences, nextEducations, nextSkills, interests);
    }

    if (isOwnProfile && Array.isArray(data.posts) && data.posts.length > 0 && data.importPosts) {
      const payloadPosts = data.posts
        .map((item: any) => ({
          title: typeof item?.title === 'string' ? item.title : undefined,
          content: typeof item?.content === 'string' ? item.content.trim() : '',
          postUrl: typeof item?.postUrl === 'string' ? item.postUrl : undefined,
          publishedAt: typeof item?.publishedAt === 'string' ? item.publishedAt : undefined,
        }))
        .filter((item: { content: string }) => item.content.length > 0);

      if (payloadPosts.length > 0) {
        const importResponse = await apiService.importLinkedInPosts({
          linkedInProfile: data.linkedin,
          posts: payloadPosts,
        });

        if (importResponse.success) {
          const importedCount = Number(importResponse.importedCount || importResponse.data?.length || 0);
          const skippedCount = Number(importResponse.skippedCount || 0);
          return { importedCount, skippedCount };
        } else {
          throw new Error(importResponse.message || 'LinkedIn profile connected, but posts could not be imported.');
        }
      }
    }

    return { importedCount: 0, skippedCount: 0 };
  };
  
  // Handle experience functions
  const handleAddExperience = () => {
    setCurrentExperience(null);
    setExperienceFormData({
      title: '',
      company: '',
      startDate: '',
      endDate: '',
      location: '',
      description: '',
    });
    setIsExperienceModalOpen(true);
  };

  const handleEditExperience = (experience: ExperienceItem) => {
    setCurrentExperience(experience);
    setExperienceFormData({
      title: experience.title,
      company: experience.company,
      startDate: experience.startDate,
      endDate: experience.endDate,
      location: experience.location,
      description: experience.description,
    });
    setIsExperienceModalOpen(true);
  };

  const handleDeleteExperience = async (id: string) => {
    const previousExperiences = experiences;
    const nextExperiences = experiences.filter((exp) => exp.id !== id);
    setExperiences(nextExperiences);
    const saved = await saveProfileSections(nextExperiences, educations, skills, interests);
    if (!saved) {
      setExperiences(previousExperiences);
      return;
    }
    toast({
      title: "Experience deleted",
      description: "Your experience has been removed successfully."
    });
  };

  const handleSaveExperience = async (experienceData: Omit<ExperienceItem, 'id'>) => {
    let nextExperiences: ExperienceItem[];

    if (currentExperience) {
      nextExperiences = experiences.map((exp) =>
        exp.id === currentExperience.id ? { ...experienceData, id: exp.id } : exp
      );
    } else {
      nextExperiences = [{ ...experienceData, id: crypto.randomUUID() }, ...experiences];
    }

    setExperiences(nextExperiences);
    const saved = await saveProfileSections(nextExperiences, educations, skills, interests);
    if (!saved) {
      return;
    }

    setIsExperienceModalOpen(false);
    toast({
      title: currentExperience ? "Experience updated" : "Experience added",
      description: "Your experience has been updated successfully."
    });
  };
  
  // Handle education functions
  const handleAddEducation = () => {
    setCurrentEducation(null);
    setEducationFormData({
      degree: '',
      institution: '',
      startYear: '',
      endYear: '',
      location: '',
      description: '',
    });
    setIsEducationModalOpen(true);
  };

  const handleEditEducation = (education: EducationItem) => {
    setCurrentEducation(education);
    setEducationFormData({
      degree: education.degree,
      institution: education.institution,
      startYear: education.startYear,
      endYear: education.endYear,
      location: education.location,
      description: education.description,
    });
    setIsEducationModalOpen(true);
  };

  const handleDeleteEducation = async (id: string) => {
    const previousEducations = educations;
    const nextEducations = educations.filter((edu) => edu.id !== id);
    setEducations(nextEducations);
    const saved = await saveProfileSections(experiences, nextEducations, skills, interests);
    if (!saved) {
      setEducations(previousEducations);
      return;
    }
    toast({
      title: "Education deleted",
      description: "Your education record has been removed successfully."
    });
  };

  const handleSaveEducation = async (educationData: Omit<EducationItem, 'id'>) => {
    let nextEducations: EducationItem[];

    if (currentEducation) {
      nextEducations = educations.map((edu) =>
        edu.id === currentEducation.id ? { ...educationData, id: edu.id } : edu
      );
    } else {
      nextEducations = [{ ...educationData, id: crypto.randomUUID() }, ...educations];
    }

    setEducations(nextEducations);
    const saved = await saveProfileSections(experiences, nextEducations, skills, interests);
    if (!saved) {
      return;
    }

    setIsEducationModalOpen(false);
    toast({
      title: currentEducation ? "Education updated" : "Education added",
      description: "Your education has been updated successfully."
    });
  };

  // Handle skills and interests
  const handleAddSkill = async () => {
    const normalized = newSkill.trim();
    if (normalized && !skills.some((skill) => skill.toLowerCase() === normalized.toLowerCase())) {
      const nextSkills = [...skills, normalized];
      setSkills(nextSkills);
      setNewSkill("");

      await saveProfileSections(experiences, educations, nextSkills, interests);

      toast({
        title: "Skill added",
        description: `"${normalized}" has been added to your skills.`
      });
    }
  };

  const handleAddInterest = async () => {
    const normalized = newSkill.trim();
    if (normalized && !interests.some((interest) => interest.toLowerCase() === normalized.toLowerCase())) {
      const nextInterests = [...interests, normalized];
      setInterests(nextInterests);
      setNewSkill("");

      await saveProfileSections(experiences, educations, skills, nextInterests);

      toast({
        title: "Interest added",
        description: `"${normalized}" has been added to your interests.`
      });
    }
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    const nextSkills = skills.filter(skill => skill !== skillToRemove);
    setSkills(nextSkills);
    await saveProfileSections(experiences, educations, nextSkills, interests);
  };

  const handleRemoveInterest = async (interestToRemove: string) => {
    const nextInterests = interests.filter((interest) => interest !== interestToRemove);
    setInterests(nextInterests);
    await saveProfileSections(experiences, educations, skills, nextInterests);
  };

  const openSkillsEditor = (mode: 'skills' | 'interests') => {
    setSkillEditorMode(mode);
    setNewSkill('');
    setIsSkillsModalOpen(true);
  };
  
  if (isLoading && !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (isError || !profile) {
    return (
      <div>
        <PageHeader 
          title="Profile Not Found"
          description="We couldn't find the requested alumni profile"
        />
        <EmptyState 
          icon={<User className="h-12 w-12 text-muted-foreground" />}
          title="Profile not found"
          description="The requested profile could not be found or you don't have permission to view it."
          action={{
            label: "Back to Directory",
            onClick: () => navigate('/directory')
          }}
        />
      </div>
    );
  }

  const hasDetailedSectionEntries = DETAILED_SECTION_CONFIG.some(
    (config) => detailedSections[config.key].length > 0
  );
  const activeDetailedSectionMeta = DETAILED_SECTION_CONFIG.find((item) => item.key === activeDetailedSection);
  const activeDetailedFormConfig = DETAILED_SECTION_FORM_CONFIG[activeDetailedSection];

  const updateDetailedExtraField = (key: string, value: string | boolean | string[]) => {
    setDetailedFormData((prev) => ({
      ...prev,
      extraData: {
        ...prev.extraData,
        [key]: value,
      },
    }));
  };

  const toggleDetailedMultiSelectOption = (key: string, option: string) => {
    const current = detailedFormData.extraData[key];
    const selected = Array.isArray(current) ? current : [];
    const nextSelected = selected.includes(option)
      ? selected.filter((item) => item !== option)
      : [...selected, option];

    updateDetailedExtraField(key, nextSelected);
  };

  const handleConnectAction = async () => {
    if (!profile || isOwnProfile) return;
    const targetId = profile.id || profile._id;
    if (!targetId) return;

    try {
      setIsConnecting(true);

      const response =
        connectionState === 'connected' || connectionState === 'pending'
          ? await apiService.disconnectFromUser(targetId)
          : connectionState === 'incoming'
            ? await apiService.acceptConnectionRequest(targetId)
            : await apiService.connectWithUser(targetId);

      if (!response.success) {
        toast({
          title: 'Connection action failed',
          description: response.message || 'Please try again.',
          variant: 'destructive',
        });
        return;
      }

      const nextState = (response.data?.connectionStatus as 'none' | 'pending' | 'incoming' | 'connected') || 'none';
      setConnectionState(nextState);

      toast({
        title:
          nextState === 'connected'
            ? 'Connected'
            : nextState === 'pending'
              ? 'Request sent'
              : nextState === 'none'
                ? 'Connection removed'
                : 'Connection updated',
        description:
          nextState === 'connected'
            ? 'You are now connected.'
            : nextState === 'pending'
              ? 'Connection request sent.'
              : nextState === 'none'
                ? 'Connection request/connection removed.'
                : 'Status updated.',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const mentorshipProfileId = profile?.mentorshipProfile?.id;
  const parseMentorshipAvailability = (raw?: string) => {
    if (!raw) return { monthlyAvailability: '', sessionMode: 'chat', availableSlots: [] as Array<{ day: string; startTime: string; endTime: string }>, iceBreakerTemplate: '' };
    try {
      const parsed = JSON.parse(raw);
      return {
        monthlyAvailability: parsed?.monthlyAvailability || raw,
        sessionMode: parsed?.sessionMode || 'chat',
        availableSlots: Array.isArray(parsed?.availableSlots) ? parsed.availableSlots : [],
        iceBreakerTemplate: parsed?.iceBreakerTemplate || '',
      };
    } catch {
      return { monthlyAvailability: raw, sessionMode: 'chat', availableSlots: [] as Array<{ day: string; startTime: string; endTime: string }>, iceBreakerTemplate: '' };
    }
  };
  const mentorshipAvailability = parseMentorshipAvailability(profile?.mentorshipProfile?.availability);
  const mentorshipTopics: string[] =
    Array.isArray(profile?.mentorshipProfile?.expertise) && profile.mentorshipProfile.expertise.length > 0
      ? profile.mentorshipProfile.expertise
      : ['General Guidance'];

  const handleSubmitMentorshipRequest = async (data: {
    mentorId: string;
    topic: string;
    message: string;
    sessionMode?: 'chat' | 'video' | 'meet';
    selectedSlot?: { day: string; startTime: string; endTime: string } | null;
  }) => {
    const response = await apiService.requestMentorship(data.mentorId, data.message, data.topic, {
      sessionMode: data.sessionMode,
      selectedSlot: data.selectedSlot,
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to send mentorship request.');
    }

    toast({
      title: 'Request Sent',
      description: 'Your mentorship request has been sent.',
    });
    setIsRequestMentorshipModalOpen(false);
  };
  
  return (
    <div>
      <PageHeader 
        title={isOwnProfile ? "My Profile" : `${profile?.name || "Alumni"}'s Profile`}
        description={isOwnProfile ? "Manage your profile information visible to other alumni" : "View alumni profile information"}
      />
      
      <Card className="mb-8 border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex flex-col items-center">
              <Avatar className="h-32 w-32 mb-2 ring-4 ring-primary/10">
                <AvatarImage src={profile.profileImage || undefined} alt={profile.name} />
                <AvatarFallback className="text-3xl font-medium bg-primary/10 text-foreground/90">
                  {profile.firstName?.[0] || profile.name?.charAt(0)}
                  {profile.lastName?.[0] || profile.name?.split(' ')?.[1]?.charAt(0) || ''}
                </AvatarFallback>
              </Avatar>
              
              {isOwnProfile && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="mt-2 border-primary text-foreground hover:bg-primary/5 transition-colors"
                    disabled={profilePhotoLoading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {profilePhotoLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Change Photo"
                    )}
                  </Button>
                </>
              )}
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold">{profile.name}</h2>
                <p className="text-muted-foreground">{profile.headline || profile.jobTitle}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {profile.company && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.jobTitle ? `${profile.jobTitle} at ${profile.company}` : profile.company}</span>
                  </div>
                )}
                
                {(profile.location || profile.city || profile.country) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.location || `${profile.city || ''} ${profile.country || ''}`.trim()}</span>
                  </div>
                )}
                
                {profile.graduationYear && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span>Class of {profile.graduationYear}</span>
                  </div>
                )}
                
                {(profile.contactEmail || profile.email) && (isOwnProfile || profile?.privacySettings?.showEmail !== false) && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.contactEmail || profile.email}</span>
                  </div>
                )}
                
                {profile.contactPhone && (isOwnProfile || profile?.privacySettings?.showPhone !== false) && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.contactPhone}</span>
                  </div>
                )}
                
                {(profile.website || profile?.privacySettings?.website) && (isOwnProfile || profile?.privacySettings?.showEmail !== false) && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={profile.website || profile?.privacySettings?.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground/90 hover:underline"
                    >
                      {profile.website || profile?.privacySettings?.website}
                    </a>
                  </div>
                )}
                
                {profile.linkedInProfile && (isOwnProfile || profile?.privacySettings?.showEmail !== false) && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a href={profile.linkedInProfile} target="_blank" rel="noopener noreferrer" className="text-foreground/90 hover:underline">LinkedIn Profile</a>
                  </div>
                )}
              </div>
              
              {profile.bio && (
                <div className="mt-4">
                  <h3 className="font-medium mb-1">About</h3>
                  <p className="text-sm">{profile.bio}</p>
                </div>
              )}
              
              {!isOwnProfile && (
                <div className="flex gap-2 mt-4">
                  {(profile?.privacySettings?.allowConnection !== false || connectionState === 'connected' || connectionStatus === 'connected') && (
                    <Button
                      onClick={handleConnectAction}
                      disabled={isConnecting}
                      variant={connectionState === 'connected' ? 'secondary' : 'default'}
                    >
                      {isConnecting
                        ? 'Please wait...'
                        : connectionState === 'incoming'
                          ? 'Accept Request'
                          : connectionState === 'connected'
                            ? 'Connected'
                            : connectionState === 'pending'
                              ? 'Pending'
                              : 'Connect'}
                    </Button>
                  )}
                  {profile?.privacySettings?.allowMessaging !== false && connectionState === 'connected' && (
                    <Button variant="outline" onClick={() => navigate(`/messages?user=${profile.id || profile._id}`)}>Message</Button>
                  )}
                  {profile.isAvailableAsMentor && (
                    <Button
                      variant="outline"
                      disabled={!mentorshipProfileId}
                      onClick={() => {
                        if (!mentorshipProfileId) {
                          toast({
                            title: 'Mentorship unavailable',
                            description: 'This mentor profile is not ready yet. Please try from the Mentorship page.',
                            variant: 'destructive',
                          });
                          return;
                        }
                        setIsRequestMentorshipModalOpen(true);
                      }}
                    >
                      Request Mentorship
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div>
        {profile.isRestricted ? (
          <div className="mt-8 text-center py-12 px-6 border-2 border-dashed rounded-3xl bg-muted/5 flex flex-col items-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold">Profile is Private</h3>
            <p className="text-muted-foreground max-w-md mx-auto mt-2 text-sm">
              {profile.name} has set their profile visibility to connections only. 
              Send a connection request to see their full profile, experience, and education.
            </p>
            <div className="mt-6">
              <Button 
                onClick={handleConnectAction}
                disabled={isConnecting}
                className="rounded-full px-8 shadow-lg shadow-primary/20"
              >
                {connectionState === 'pending' ? 'Connection Pending' : 'Connect with Alumni'}
              </Button>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="profile" className="mt-6">
            <TabsList className="bg-muted/30 p-1 rounded-lg w-full">
              <TabsTrigger 
                value="profile"
                className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-white hover:text-foreground"
              >
                {isOwnProfile ? 'Edit Profile' : 'Profile'}
              </TabsTrigger>
              <TabsTrigger 
                value="experiences"
                className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-white hover:text-foreground"
              >
                Experience
              </TabsTrigger>
              <TabsTrigger 
                value="education"
                className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-white hover:text-foreground"
              >
                Education
              </TabsTrigger>
              <TabsTrigger 
                value="skills"
                className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-white hover:text-foreground"
              >
                Skills & Interests
              </TabsTrigger>
              <TabsTrigger 
                value="detailed"
                className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-white hover:text-foreground"
              >
                Detailed Sections
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {isOwnProfile && (
                    <div className="flex justify-end mb-4 gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsAddToProfileModalOpen(true)}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add to Profile
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsLinkedInModalOpen(true)}
                      >
                        Import from LinkedIn
                      </Button>
                    </div>
                  )}
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(async (data) => {
                      if (!isOwnProfile || !profile) return;

                      try {
                        const basePrivacySettings =
                          profile.privacySettings && typeof profile.privacySettings === 'object'
                            ? profile.privacySettings
                            : {};

                        const payload = {
                          name: data.name,
                          email: data.email,
                          bio: data.bio,
                          headline: data.headline,
                          contactEmail: data.contactEmail,
                          contactPhone: data.contactPhone,
                          company: data.company,
                          jobTitle: data.position,
                          location: data.location,
                          linkedInProfile: data.linkedin,
                          isAvailableAsMentor: data.availableAsMentor,
                          privacySettings: {
                            ...basePrivacySettings,
                            website: data.website,
                            twitterHandle: data.twitter,
                            githubHandle: data.github,
                          },
                        };

                        const response = await apiService.updateUserProfile(profile.id || profile._id, payload);
                        if (!response.success) {
                          toast({
                            title: "Update failed",
                            description: response.message || "Failed to update profile",
                            variant: "destructive"
                          });
                          return;
                        }

                        const updatedProfile = response.user || response.data;
                        if (updatedProfile) {
                          setProfile((previous: any) => ({
                            ...previous,
                            ...updatedProfile,
                            id: updatedProfile.id || previous?.id,
                          }));
                        }

                        toast({
                          title: "Profile updated",
                          description: "Your profile has been updated successfully."
                        });
                      } catch (error: any) {
                        toast({
                          title: "Update failed",
                          description: error?.message || "Failed to update profile",
                          variant: "destructive"
                        });
                      }
                    })} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={!isOwnProfile} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input {...field} disabled />
                              </FormControl>
                              <FormDescription>
                                Your email is used for login and cannot be changed here.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="headline"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Headline</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={!isOwnProfile} />
                              </FormControl>
                              <FormDescription>
                                A brief description of your professional identity.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={!isOwnProfile} />
                              </FormControl>
                              <FormDescription>
                                City, State, Country
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="contactEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Email</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={!isOwnProfile} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="contactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Phone</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={!isOwnProfile} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>


                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="company"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={!isOwnProfile} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="position"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Position</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={!isOwnProfile} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                disabled={!isOwnProfile}
                                className="min-h-[120px]" 
                              />
                            </FormControl>
                            <FormDescription>
                              Tell others about yourself and your professional journey.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="linkedin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>LinkedIn URL</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={!isOwnProfile} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Personal Website</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={!isOwnProfile} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {isOwnProfile && (
                        <div className="flex justify-end">
                          <Button 
                            type="submit"
                            className="bg-primary hover:bg-primary/90 text-white rounded-lg px-4 py-2 transform hover:scale-105 hover:shadow-lg transition-all duration-300"
                          >
                            Save Changes
                          </Button>
                        </div>
                      )}
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="experiences" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium">Work Experience</h3>
                    {isOwnProfile && (
                      <Button 
                        className="bg-primary hover:bg-primary/90 text-white rounded-lg transform hover:scale-105 hover:shadow-lg transition-all duration-300"
                        onClick={handleAddExperience}
                      >
                        + Add Experience
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-6">
                    {experiences.map((experience) => (
                      <div key={experience.id} className="border-b pb-4">
                        <div className="flex justify-between">
                          <div>
                            <h4 className="font-semibold text-foreground">{experience.title}</h4>
                            <p className="text-foreground/90">{experience.company}</p>
                            <p className="text-sm text-muted-foreground/80">{experience.startDate} - {experience.endDate} · {experience.location}</p>
                            <p className="mt-2 text-foreground/80">{experience.description}</p>
                          </div>
                          {isOwnProfile && (
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditExperience(experience)}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-500"
                                onClick={() => handleDeleteExperience(experience.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="education" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium">Education</h3>
                    {isOwnProfile && (
                      <Button
                        className="bg-primary hover:bg-primary/90 text-white rounded-lg transform hover:scale-105 hover:shadow-lg transition-all duration-300"
                        onClick={handleAddEducation}
                      >
                        + Add Education
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-6">
                    {educations.map((education) => (
                      <div key={education.id} className="border-b pb-4">
                        <div className="flex justify-between">
                          <div>
                            <h4 className="font-semibold text-foreground">{education.degree}</h4>
                            <p className="text-foreground/90">{education.institution}</p>
                            <p className="text-sm text-muted-foreground/80">{education.startYear} - {education.endYear}</p>
                            <p className="mt-2 text-foreground/80">{education.description}</p>
                          </div>
                          {isOwnProfile && (
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditEducation(education)}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-500"
                                onClick={() => handleDeleteEducation(education.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="skills" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-8">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Skills</h3>
                        {isOwnProfile && (
                          <Button
                            className="bg-primary hover:bg-primary/90 text-white rounded-lg transform hover:scale-105 hover:shadow-lg transition-all duration-300"
                            onClick={() => openSkillsEditor('skills')}
                          >
                            + Add Skills
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill) => (
                          <div key={skill} className="relative group">
                            <Badge className="bg-primary/10 text-foreground/90 hover:bg-primary/20 px-3 py-1 rounded-lg">
                              {skill}
                              {isOwnProfile && (
                                <button 
                                  className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleRemoveSkill(skill);
                                  }}
                                >
                                  ×
                                </button>
                              )}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Interests</h3>
                        {isOwnProfile && (
                          <Button
                            className="bg-primary hover:bg-primary/90 text-white rounded-lg transform hover:scale-105 hover:shadow-lg transition-all duration-300"
                            onClick={() => openSkillsEditor('interests')}
                          >
                            + Add Interests
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {interests.map((interest) => (
                          <div key={interest} className="relative group">
                            <Badge className="bg-primary/10 text-blue-800 hover:bg-blue-200 px-3 py-1 rounded-lg">
                              {interest}
                              {isOwnProfile && (
                                <button 
                                  className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleRemoveInterest(interest);
                                  }}
                                >
                                  ×
                                </button>
                              )}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      Use the <span className="font-medium">Detailed Sections</span> tab to add languages, certifications, projects, publications, and other advanced profile data.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="detailed" className="mt-4">
              <Card>
                <CardContent className="pt-6 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-medium">Detailed Profile Sections</h3>
                      <p className="text-sm text-muted-foreground">Build a richer profile with achievements, projects, credentials, and more.</p>
                    </div>
                    {isOwnProfile && (
                      <Button variant="outline" onClick={() => setIsAddToProfileModalOpen(true)}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Add to Profile
                      </Button>
                    )}
                  </div>

                  {DETAILED_SECTION_CONFIG.map((config) => {
                    const entries = detailedSections[config.key];
                    return (
                      <div key={config.key} className="border rounded-lg p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                          <div>
                            <h4 className="font-semibold">{config.label}</h4>
                            <p className="text-xs text-muted-foreground">{config.hint}</p>
                          </div>
                          {isOwnProfile && (
                            <Button variant="outline" size="sm" onClick={() => openDetailedItemModal(config.key)}>
                              + Add
                            </Button>
                          )}
                        </div>

                        {entries.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No entries yet.</p>
                        ) : (
                          <div className="space-y-3">
                            {entries.map((entry) => (
                              <div key={entry.id} className="border rounded-md p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="font-medium">{entry.title}</p>
                                    {(entry.organization || entry.startDate || entry.endDate) && (
                                      <p className="text-sm text-muted-foreground">
                                        {[entry.organization, [entry.startDate, entry.endDate].filter(Boolean).join(' - ')].filter(Boolean).join(' · ')}
                                      </p>
                                    )}
                                    {entry.description && <p className="text-sm mt-2">{entry.description}</p>}
                                    {entry.url && (
                                      <a href={entry.url} target="_blank" rel="noopener noreferrer" className="text-sm text-foreground hover:underline">
                                        {entry.url}
                                      </a>
                                    )}
                                  </div>
                                  {isOwnProfile && (
                                    <div className="flex gap-2 shrink-0">
                                      <Button variant="outline" size="sm" onClick={() => openDetailedItemModal(config.key, entry)}>Edit</Button>
                                      <Button variant="outline" size="sm" className="text-red-500" onClick={() => handleDeleteDetailedItem(config.key, entry.id)}>Delete</Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>


      {hasDetailedSectionEntries && (
        <Card className="mt-6">
          <CardContent className="pt-6 space-y-6">
            <h3 className="text-lg font-semibold">Additional Profile Details</h3>
            {DETAILED_SECTION_CONFIG.map((config) => {
              const entries = detailedSections[config.key];
              if (!entries.length) return null;

              return (
                <div key={config.key} className="border-b last:border-b-0 pb-4 last:pb-0">
                  <h4 className="font-medium mb-3">{config.label}</h4>
                  <div className="space-y-3">
                    {entries.map((entry) => (
                      <div key={entry.id} className="rounded-md border p-3">
                        <p className="font-medium">{entry.title}</p>
                        {(entry.organization || entry.startDate || entry.endDate) && (
                          <p className="text-sm text-muted-foreground">
                            {[entry.organization, [entry.startDate, entry.endDate].filter(Boolean).join(' - ')].filter(Boolean).join(' · ')}
                          </p>
                        )}
                        {entry.description && <p className="text-sm mt-2">{entry.description}</p>}
                        {entry.url && (
                          <a href={entry.url} target="_blank" rel="noopener noreferrer" className="text-sm text-foreground hover:underline">
                            {entry.url}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
      
      {isOwnProfile && isLinkedInModalOpen && (
        <LinkedInImporter 
          isOpen={isLinkedInModalOpen}
          onClose={() => setIsLinkedInModalOpen(false)}
          onImport={handleImportLinkedInData}
        />
      )}

      {isOwnProfile && (
        <Dialog open={isAddToProfileModalOpen} onOpenChange={setIsAddToProfileModalOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add to profile</DialogTitle>
              <DialogDescription>
                Start with core details, then add recommended and additional sections to build a complete profile.
              </DialogDescription>
            </DialogHeader>

            {(['Core', 'Recommended', 'Additional'] as DetailedSectionGroup[]).map((group) => {
              const sections = DETAILED_SECTION_CONFIG.filter((section) => section.group === group);
              return (
                <div key={group} className="border rounded-lg p-3">
                  <h4 className="font-semibold mb-2">{group}</h4>
                  <div className="space-y-2">
                    {sections.map((section) => (
                      <div key={section.key} className="flex items-start justify-between gap-3 py-2 border-b last:border-b-0">
                        <div>
                          <p className="font-medium">Add {section.label}</p>
                          <p className="text-xs text-muted-foreground">{section.hint}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => openDetailedItemModal(section.key)}>
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </DialogContent>
        </Dialog>
      )}

      {isOwnProfile && (
        <Dialog open={isDetailedItemModalOpen} onOpenChange={setIsDetailedItemModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{currentDetailedItem ? `Edit ${activeDetailedSectionMeta?.label || 'entry'}` : `Add ${activeDetailedSectionMeta?.label || 'entry'}`}</DialogTitle>
            <DialogDescription>
              {activeDetailedFormConfig.helperText}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {activeDetailedFormConfig.fields.map((field) => {
              if (activeDetailedSection === 'services' && field.key === 'otherServiceDetails') {
                const selectedServices = detailedFormData.extraData.servicesOffered;
                const hasOtherSelected = Array.isArray(selectedServices) && selectedServices.includes('Other');
                if (!hasOtherSelected) {
                  return null;
                }
              }

              const fieldId = `detail-${field.key}`;
              const fieldValue = detailedFormData.extraData[field.key];

              if (field.type === 'checkbox') {
                return (
                  <div key={field.key} className="flex items-center gap-2">
                    <input
                      id={fieldId}
                      type="checkbox"
                      checked={fieldValue === true}
                      onChange={(e) => updateDetailedExtraField(field.key, e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor={fieldId}>{field.label}</Label>
                  </div>
                );
              }

              if (field.type === 'multiselect') {
                const selectedValues = Array.isArray(fieldValue) ? fieldValue : [];
                return (
                  <div key={field.key}>
                    <Label>{field.label}{field.required ? ' *' : ''}</Label>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 border rounded-md p-3 max-h-52 overflow-y-auto">
                      {(field.options || []).map((option) => (
                        <label key={option} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={selectedValues.includes(option)}
                            onChange={() => toggleDetailedMultiSelectOption(field.key, option)}
                            className="h-4 w-4"
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              }

              if (field.type === 'select') {
                return (
                  <div key={field.key}>
                    <Label htmlFor={fieldId}>{field.label}{field.required ? ' *' : ''}</Label>
                    <select
                      id={fieldId}
                      className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={typeof fieldValue === 'string' ? fieldValue : ''}
                      onChange={(e) => updateDetailedExtraField(field.key, e.target.value)}
                    >
                      <option value="">Please select</option>
                      {(field.options || []).map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                );
              }

              if (field.type === 'textarea') {
                return (
                  <div key={field.key}>
                    <Label htmlFor={fieldId}>{field.label}{field.required ? ' *' : ''}</Label>
                    <Textarea
                      id={fieldId}
                      className="mt-2"
                      value={typeof fieldValue === 'string' ? fieldValue : ''}
                      onChange={(e) => updateDetailedExtraField(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      rows={field.rows || 4}
                    />
                    {field.helperText && <p className="text-xs text-muted-foreground mt-1">{field.helperText}</p>}
                  </div>
                );
              }

              return (
                <div key={field.key}>
                  <Label htmlFor={fieldId}>{field.label}{field.required ? ' *' : ''}</Label>
                  <Input
                    id={fieldId}
                    className="mt-2"
                    value={typeof fieldValue === 'string' ? fieldValue : ''}
                    onChange={(e) => updateDetailedExtraField(field.key, e.target.value)}
                    placeholder={field.placeholder}
                  />
                  {field.helperText && <p className="text-xs text-muted-foreground mt-1">{field.helperText}</p>}
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailedItemModalOpen(false)}>Cancel</Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={handleSaveDetailedItem}>Save</Button>
          </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Experience Modal */}
      <Dialog open={isExperienceModalOpen} onOpenChange={setIsExperienceModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{currentExperience ? "Edit Experience" : "Add New Experience"}</DialogTitle>
            <DialogDescription>
              {currentExperience 
                ? "Update your work experience details below." 
                : "Add details about your work experience."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="title">Job Title</Label>
                <Input 
                  id="title" 
                  value={experienceFormData.title}
                  onChange={(e) => setExperienceFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="mt-2"
                  placeholder="e.g. Software Engineer"
                />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input 
                  id="company" 
                  value={experienceFormData.company}
                  onChange={(e) => setExperienceFormData((prev) => ({ ...prev, company: e.target.value }))}
                  className="mt-2"
                  placeholder="e.g. Tech Company Inc."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input 
                  id="startDate" 
                  value={experienceFormData.startDate}
                  onChange={(e) => setExperienceFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="mt-2"
                  placeholder="e.g. Jan 2020"
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input 
                  id="endDate" 
                  value={experienceFormData.endDate}
                  onChange={(e) => setExperienceFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="mt-2"
                  placeholder="e.g. Present or Dec 2022"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input 
                id="location" 
                value={experienceFormData.location}
                onChange={(e) => setExperienceFormData((prev) => ({ ...prev, location: e.target.value }))}
                className="mt-2"
                placeholder="e.g. San Francisco, CA"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={experienceFormData.description}
                onChange={(e) => setExperienceFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="mt-2"
                placeholder="Describe your responsibilities and achievements"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExperienceModalOpen(false)}>Cancel</Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={() => {
              handleSaveExperience(experienceFormData);
            }}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Education Modal */}
      <Dialog open={isEducationModalOpen} onOpenChange={setIsEducationModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{currentEducation ? "Edit Education" : "Add New Education"}</DialogTitle>
            <DialogDescription>
              {currentEducation 
                ? "Update your education details below." 
                : "Add details about your education."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="degree">Degree / Certificate</Label>
              <Input 
                id="degree" 
                value={educationFormData.degree}
                onChange={(e) => setEducationFormData((prev) => ({ ...prev, degree: e.target.value }))}
                className="mt-2"
                placeholder="e.g. Bachelor of Science in Computer Science"
              />
            </div>
            <div>
              <Label htmlFor="institution">Institution</Label>
              <Input 
                id="institution" 
                value={educationFormData.institution}
                onChange={(e) => setEducationFormData((prev) => ({ ...prev, institution: e.target.value }))}
                className="mt-2"
                placeholder="e.g. Stanford University"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startYear">Start Year</Label>
                <Input 
                  id="startYear" 
                  value={educationFormData.startYear}
                  onChange={(e) => setEducationFormData((prev) => ({ ...prev, startYear: e.target.value }))}
                  className="mt-2"
                  placeholder="e.g. 2018"
                />
              </div>
              <div>
                <Label htmlFor="endYear">End Year</Label>
                <Input 
                  id="endYear" 
                  value={educationFormData.endYear}
                  onChange={(e) => setEducationFormData((prev) => ({ ...prev, endYear: e.target.value }))}
                  className="mt-2"
                  placeholder="e.g. 2022 or Present"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="eduLocation">Location</Label>
              <Input 
                id="eduLocation" 
                value={educationFormData.location}
                onChange={(e) => setEducationFormData((prev) => ({ ...prev, location: e.target.value }))}
                className="mt-2"
                placeholder="e.g. Stanford, CA"
              />
            </div>
            <div>
              <Label htmlFor="eduDescription">Description</Label>
              <Textarea 
                id="eduDescription" 
                value={educationFormData.description}
                onChange={(e) => setEducationFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="mt-2"
                placeholder="Additional details about your studies"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEducationModalOpen(false)}>Cancel</Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={() => {
              handleSaveEducation(educationFormData);
            }}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skills Modal */}
      {isOwnProfile && isSkillsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-medium mb-4">
              {newSkill
                ? `Add New ${skillEditorMode === 'skills' ? 'Skill' : 'Interest'}`
                : `Manage ${skillEditorMode === 'skills' ? 'Skills' : 'Interests'}`}
            </h3>
            
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                if (skillEditorMode === 'skills') {
                  await handleAddSkill();
                } else {
                  await handleAddInterest();
                }
              }} 
              className="space-y-4"
            >
              <div>
                <label htmlFor="new-skill" className="block text-sm font-medium text-foreground/80">
                  {skillEditorMode === 'skills' ? 'Skill' : 'Interest'}
                </label>
                <input
                  id="new-skill"
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  placeholder={skillEditorMode === 'skills' ? 'e.g. Python' : 'e.g. Product Design'}
                  required
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline"
                  type="button"
                  onClick={() => setIsSkillsModalOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-white rounded-lg px-4 py-2 transform hover:scale-105 hover:shadow-lg transition-all duration-300 w-full sm:w-auto"
                >
                  {skillEditorMode === 'skills' ? 'Add Skill' : 'Add Interest'}
                </Button>
              </div>
            </form>
            
            <div className="mt-4">
              <h4 className="text-sm font-medium text-foreground/80 mb-2">
                Existing {skillEditorMode === 'skills' ? 'Skills' : 'Interests'}
              </h4>
              <div className="flex flex-wrap gap-2">
                {(skillEditorMode === 'skills' ? skills : interests).map((value) => (
                  <Badge key={value} className="bg-primary/10 text-foreground/90 hover:bg-primary/20 px-3 py-1 rounded-lg">
                    {value}
                  </Badge>
                ))}
              </div>
            </div>
            
            <button
              onClick={() => setIsSkillsModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground/80 hover:text-foreground/80"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {!isOwnProfile && mentorshipProfileId && (
        <RequestMentorshipModal
          mentor={{
            id: mentorshipProfileId,
            expertise: mentorshipTopics,
            sessionMode: mentorshipAvailability.sessionMode,
            availableSlots: mentorshipAvailability.availableSlots,
            iceBreakerTemplate: mentorshipAvailability.iceBreakerTemplate,
            user: {
              name: profile?.name,
              title: profile?.jobTitle,
              company: profile?.company,
              graduationYear: profile?.graduationYear,
              profileImage: profile?.profileImage,
            },
          }}
          isOpen={isRequestMentorshipModalOpen}
          onClose={() => setIsRequestMentorshipModalOpen(false)}
          onSubmit={handleSubmitMentorshipRequest}
        />
      )}
    </div>
  );
}
