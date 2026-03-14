
import { useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/services/apiService";

interface LinkedInImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any) => Promise<{ importedCount?: number; skippedCount?: number } | void> | { importedCount?: number; skippedCount?: number } | void;
}

interface LinkedInPostInput {
  title?: string;
  content: string;
  postUrl?: string;
  publishedAt?: string;
}

const toLinkedInPost = (item: any): LinkedInPostInput | null => {
  if (!item) return null;

  if (typeof item === 'string') {
    const content = item.trim();
    return content ? { content } : null;
  }

  const contentCandidates = [
    item.content,
    item.text,
    item.description,
    item.commentary,
    item.shareCommentary,
    item.message,
    item.caption,
    item.body,
  ];

  const content = contentCandidates.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim() || '';
  if (!content) return null;

  const postUrl = typeof item.postUrl === 'string'
    ? item.postUrl
    : undefined;
  const fallbackUrl = typeof item.url === 'string' ? item.url : undefined;

  const publishedAt = typeof item.publishedAt === 'string'
    ? item.publishedAt
    : undefined;
  const createdAt = typeof item.createdAt === 'string' ? item.createdAt : undefined;
  const date = typeof item.date === 'string' ? item.date : undefined;

  return {
    title: typeof item.title === 'string' ? item.title : undefined,
    content,
    postUrl: postUrl || fallbackUrl,
    publishedAt: publishedAt || createdAt || date,
  };
};

const extractPostsFromUnknownJson = (parsed: any): LinkedInPostInput[] => {
  if (Array.isArray(parsed)) {
    return parsed
      .map((item) => toLinkedInPost(item))
      .filter((item): item is LinkedInPostInput => Boolean(item));
  }

  const directCollections = [
    parsed?.posts,
    parsed?.activities,
    parsed?.updates,
    parsed?.shares,
    parsed?.linkedinPosts,
    parsed?.ugcPosts,
  ].filter(Array.isArray);

  for (const collection of directCollections) {
    const mapped = collection
      .map((item: any) => toLinkedInPost(item))
      .filter((item: LinkedInPostInput | null): item is LinkedInPostInput => Boolean(item));
    if (mapped.length > 0) return mapped;
  }

  return [];
};

export function LinkedInImporter({ isOpen, onClose, onImport }: Readonly<LinkedInImporterProps>) {
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [profileText, setProfileText] = useState("");
  const [importedFileName, setImportedFileName] = useState("");
  const [importedFilePosts, setImportedFilePosts] = useState<LinkedInPostInput[]>([]);
  const [importPosts, setImportPosts] = useState(true);
  const [connectLinkedIn, setConnectLinkedIn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const { toast } = useToast();

  const handleAutoImportOAuth = async () => {
    setIsOAuthLoading(true);

    try {
      const oauthResponse = await apiService.getLinkedInOAuthUrl();
      const oauthUrl = oauthResponse.data?.url;
      const redirectUri = (oauthResponse as any)?.redirectUri || oauthResponse.data?.redirectUri;

      if (!oauthResponse.success || !oauthUrl) {
        const baseMessage = oauthResponse.message || 'LinkedIn OAuth is not configured.';
        const details = redirectUri ? ` Configure this Redirect URL in LinkedIn app: ${redirectUri}` : '';
        throw new Error(`${baseMessage}${details}`.trim());
      }

      const popup = globalThis.open(
        oauthUrl,
        'linkedin-oauth',
        'width=620,height=760,menubar=no,toolbar=no,status=no'
      );

      if (!popup) {
        throw new Error('Popup blocked by browser. Please allow popups and try again.');
      }

      const oauthResult = await new Promise<{
        success: boolean;
        message?: string;
        profile?: {
          name?: string;
          firstName?: string;
          lastName?: string;
          profileImage?: string;
          contactEmail?: string;
          linkedInProfile?: string;
        };
      }>((resolve, reject) => {
        let resolved = false;
        let closedWhilePendingPolls = 0;

        const settle = (value: {
          success: boolean;
          message?: string;
          profile?: {
            name?: string;
            firstName?: string;
            lastName?: string;
            profileImage?: string;
            contactEmail?: string;
            linkedInProfile?: string;
          };
        }) => {
          if (resolved) return;
          resolved = true;
          globalThis.clearTimeout(timeoutId);
          globalThis.clearInterval(pollInterval);
          globalThis.removeEventListener('message', handleMessage);
          resolve(value);
        };

        const timeoutId = globalThis.setTimeout(() => {
          globalThis.clearInterval(pollInterval);
          globalThis.removeEventListener('message', handleMessage);
          reject(new Error('LinkedIn OAuth timed out. Please try again.'));
        }, 120000);

        const handleMessage = (event: MessageEvent) => {
          const data = event.data;
          if (data?.source !== 'linkedin-oauth') {
            return;
          }

          settle(data);
        };

        globalThis.addEventListener('message', handleMessage);

        const pollInterval = globalThis.setInterval(async () => {
          if (resolved) {
            return;
          }

          const statusResponse = await apiService.getLinkedInOAuthStatus();
          const status = statusResponse.data;
          if (!statusResponse.success || !status) {
            return;
          }

          if (status.state === 'success') {
            settle({
              success: true,
              message: status.message,
              profile: status.profile,
            });
            return;
          }

          if (status.state === 'error') {
            settle({
              success: false,
              message: status.message || 'LinkedIn OAuth failed.',
            });
            return;
          }

          if (popup.closed) {
            closedWhilePendingPolls += 1;
            if (closedWhilePendingPolls >= 3) {
              settle({
                success: false,
                message: 'LinkedIn OAuth window closed before completion. Please ensure LinkedIn redirect URL is configured correctly and try again.',
              });
            }
            return;
          }

          closedWhilePendingPolls = 0;
        }, 1500);
      });

      if (!oauthResult.success) {
        throw new Error(oauthResult.message || 'LinkedIn auto import failed.');
      }

      await onImport({
        connectLinkedIn: true,
        importPosts: false,
        linkedin: oauthResult.profile?.linkedInProfile,
        name: oauthResult.profile?.name,
        email: oauthResult.profile?.contactEmail,
        headline: oauthResult.profile?.headline,
        posts: [],
      });

      toast({
        title: 'LinkedIn profile imported',
        description: oauthResult.message || 'Profile details imported from LinkedIn.',
      });

      onClose();
    } catch (error: any) {
      toast({
        title: 'LinkedIn auto import failed',
        description: error?.message || 'Could not auto import from LinkedIn.',
        variant: 'destructive',
      });
    } finally {
      setIsOAuthLoading(false);
    }
  };

  const normalizeUrl = (input: string) => {
    const value = input.trim();
    if (!value) return '';
    return value.startsWith('http') ? value : `https://${value}`;
  };

  const buildNameFromSlug = (url: string) => {
    const parts = url.split('/').filter(Boolean);
    const slug = parts[parts.length - 1] || '';
    return slug
      .replaceAll('-', ' ')
      .replaceAll(/\b\w/g, (char) => char.toUpperCase())
      .trim();
  };

  const parseLinkedInPayload = (text: string) => {
    if (!text.trim()) {
      return { posts: [] as LinkedInPostInput[] };
    }

    try {
      const parsed = JSON.parse(text);

      const parsedPosts = extractPostsFromUnknownJson(parsed);

      const headline = parsed?.headline || parsed?.position || parsed?.jobTitle || parsed?.currentRole || '';
      const company = parsed?.company || parsed?.currentCompany || parsed?.organization || '';
      const bio = parsed?.summary || parsed?.bio || parsed?.about || parsed?.description || '';
      const location = parsed?.location || parsed?.geoLocation || '';
      const experiences = Array.isArray(parsed?.experiences)
        ? parsed.experiences
        : [];
      const fallbackExperiences = Array.isArray(parsed?.positions) ? parsed.positions : [];
      const educations = Array.isArray(parsed?.educations)
        ? parsed.educations
        : [];
      const fallbackEducations = Array.isArray(parsed?.education) ? parsed.education : [];
      const skills = Array.isArray(parsed?.skills)
        ? parsed.skills
        : [];
      const fallbackSkills = Array.isArray(parsed?.topSkills) ? parsed.topSkills : [];

      return {
        headline,
        company,
        position: parsed?.position || parsed?.jobTitle || headline,
        location,
        bio,
        website: parsed.website || '',
        twitter: parsed.twitter || '',
        github: parsed.github || '',
        experiences: experiences.length > 0 ? experiences : fallbackExperiences,
        educations: educations.length > 0 ? educations : fallbackEducations,
        skills: skills.length > 0 ? skills : fallbackSkills,
        posts: parsedPosts,
      };
    } catch {
      const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
      const headline = lines[0] || '';
      const company = lines.find((line) => / at /i.test(line))?.split(/ at /i)[1]?.trim() || '';
      const position = lines.find((line) => / at /i.test(line))?.split(/ at /i)[0]?.trim() || '';
      const postBlocks = text
        .split(/\n\s*\n/)
        .map((block) => block.replaceAll(/^(?:[•*]|-)\s*/gm, '').trim())
        .filter((block) => block.length >= 20)
        .slice(0, 20)
        .map((content) => ({ content }));

      return {
        headline,
        company,
        position,
        bio: lines.slice(1, 6).join(' '),
        posts: postBlocks,
      };
    }
  };

  const parseCsvLine = (line: string) => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      const next = line[index + 1];

      if (char === '"') {
        if (inQuotes && next === '"') {
          current += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
        continue;
      }

      current += char;
    }

    cells.push(current.trim());
    return cells;
  };

  const normalizeCsvHeader = (header: string) => header.toLowerCase().replaceAll(/[^a-z0-9]/g, '');

  const parseLinkedInCsv = (csvText: string): LinkedInPostInput[] => {
    const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = parseCsvLine(lines[0]).map((value) => normalizeCsvHeader(value));
    const rows = lines.slice(1);

    return rows
      .map((line) => {
        const values = parseCsvLine(line);
        const row = headers.reduce<Record<string, string>>((acc, key, idx) => {
          acc[key] = values[idx] || '';
          return acc;
        }, {});

        const content = row.sharecommentary || row.commentary || row.posttext || row.content || row.text || row.message || '';
        if (!content.trim()) return null;

        return {
          content: content.trim(),
          postUrl: row.url || row.sharelink || row.posturl || undefined,
          publishedAt: row.date || row.createdat || row.publishedat || undefined,
        } satisfies LinkedInPostInput;
      })
      .filter((item): item is LinkedInPostInput => Boolean(item));
  };

  const parseLinkedInExportFile = async (file: File) => {
    const raw = await file.text();
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.csv')) {
      return {
        parsed: { posts: parseLinkedInCsv(raw) },
        raw,
      };
    }

    if (fileName.endsWith('.json')) {
      return {
        parsed: parseLinkedInPayload(raw),
        raw,
      };
    }

    return {
      parsed: parseLinkedInPayload(raw),
      raw,
    };
  };

  const handleFileImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    try {
      const { parsed, raw } = await parseLinkedInExportFile(selectedFile);
      const posts = Array.isArray(parsed?.posts)
        ? parsed.posts.filter((item: LinkedInPostInput) => item?.content?.trim())
        : [];

      setImportedFileName(selectedFile.name);
      setImportedFilePosts(posts);

      if (raw.trim().length > 0) {
        setProfileText(raw);
      }

      toast({
        title: 'LinkedIn export loaded',
        description: posts.length > 0
          ? `${posts.length} posts detected in ${selectedFile.name}.`
          : `${selectedFile.name} loaded, but no post content detected.`,
      });
    } catch (error: any) {
      toast({
        title: 'File import failed',
        description: error?.message || 'Could not parse LinkedIn export file.',
        variant: 'destructive',
      });
    } finally {
      event.target.value = '';
    }
  };

  const handleImport = async () => {
    const normalizedUrl = normalizeUrl(linkedInUrl);
    const hasLinkedInUrl = normalizedUrl.length > 0;

    if (hasLinkedInUrl) {
      const isLinkedInProfile = /^https?:\/\/(www\.)?linkedin\.com\/in\//i.test(normalizedUrl);
      if (!isLinkedInProfile) {
        toast({
          title: "Invalid LinkedIn URL",
          description: "Use a public LinkedIn profile URL like https://linkedin.com/in/yourprofile",
          variant: "destructive",
        });
        return;
      }
    }

    if (connectLinkedIn && !hasLinkedInUrl) {
      toast({
        title: "LinkedIn URL required",
        description: "Enter LinkedIn URL to connect your profile, or uncheck connect option.",
        variant: "destructive",
      });
      return;
    }

    if (!profileText.trim() && importedFilePosts.length === 0) {
      toast({
        title: "LinkedIn data required",
        description: "Paste LinkedIn export JSON/text or upload a LinkedIn export file.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const parsed = parseLinkedInPayload(profileText);
      const parsedPostsFromText = Array.isArray(parsed.posts)
        ? parsed.posts.filter((item: LinkedInPostInput) => item?.content?.trim())
        : [];
      const allParsedPosts = [
        ...importedFilePosts,
        ...parsedPostsFromText,
      ].filter((item, index, array) => {
        const signature = `${item.content.trim().toLowerCase()}::${item.publishedAt || ''}`;
        return array.findIndex((candidate) => `${candidate.content.trim().toLowerCase()}::${candidate.publishedAt || ''}` === signature) === index;
      });

      if (importPosts && allParsedPosts.length === 0) {
        toast({
          title: "No LinkedIn posts found",
          description: "No posts detected in pasted/uploaded data. Upload LinkedIn export containing posts, or turn off post import.",
          variant: "destructive",
        });
        return;
      }

      const linkedInData = {
        name: hasLinkedInUrl ? buildNameFromSlug(normalizedUrl) : undefined,
        linkedin: hasLinkedInUrl ? normalizedUrl : undefined,
        connectLinkedIn,
        importPosts,
        ...parsed,
        posts: allParsedPosts,
      };

      const result = await onImport(linkedInData);
      const importedCount = Number(result?.importedCount || 0);
      const skippedCount = Number(result?.skippedCount || 0);

      const importSummary = skippedCount > 0
        ? `Imported ${importedCount} posts, skipped ${skippedCount}.`
        : `Imported ${importedCount} posts.`;

      toast({
        title: "LinkedIn connected",
        description: importPosts
          ? importSummary
          : "LinkedIn connected successfully.",
      });

      onClose();
    } catch (error: any) {
      toast({
        title: "LinkedIn import failed",
        description: error?.message || "Could not connect/import from LinkedIn.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import LinkedIn Profile</DialogTitle>
          <DialogDescription>
            Import your professional details directly from LinkedIn to complete your profile.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border p-3">
          <p className="text-sm font-medium">Automatic profile import</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Uses LinkedIn OAuth to import profile details directly.
          </p>
          <Button
            className="mt-3 w-full"
            variant="outline"
            onClick={handleAutoImportOAuth}
            disabled={isOAuthLoading}
          >
            {isOAuthLoading ? 'Connecting to LinkedIn...' : 'Import Profile via LinkedIn OAuth'}
          </Button>
        </div>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Input
              placeholder="https://linkedin.com/in/yourprofile"
              value={linkedInUrl}
              onChange={(e) => setLinkedInUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter your LinkedIn profile URL to connect your account.
            </p>
          </div>

          <div className="space-y-2">
            <Input
              type="file"
              accept=".json,.csv,.txt"
              onChange={handleFileImport}
            />
            <p className="text-xs text-muted-foreground">
              Recommended: upload LinkedIn export file (JSON/CSV/TXT) for reliable post import.
              {importedFileName ? ` Loaded: ${importedFileName}` : ''}
            </p>
          </div>

          <div className="space-y-2">
            <Textarea
              placeholder="Optional: paste LinkedIn export JSON/text (profile + posts)."
              value={profileText}
              onChange={(e) => setProfileText(e.target.value)}
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              To import old/new posts, include post content in the pasted data (JSON/text).
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={connectLinkedIn}
              onChange={(e) => setConnectLinkedIn(e.target.checked)}
            />
            <span>Connect this LinkedIn profile to my account</span>
          </label>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={importPosts}
              onChange={(e) => setImportPosts(e.target.checked)}
            />
            <span>Also import my LinkedIn posts into Posts section (optional)</span>
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleImport} disabled={isLoading}>
            {isLoading ? "Connecting..." : "Connect & Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
