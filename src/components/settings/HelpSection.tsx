import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import apiService from "@/services/apiService";
import { useAuth } from "@/contexts/AuthContext";
import {
  HelpCircle,
  MessageSquare,
  AlertTriangle,
  Lightbulb,
  User,
  Clock,
  Upload,
  X,
  FileText,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const CATEGORIES = [
  { value: "question", label: "General Question", icon: HelpCircle },
  { value: "bug_report", label: "Bug Report", icon: AlertTriangle },
  { value: "feedback", label: "Feedback", icon: Lightbulb },
  { value: "report", label: "Report a User", icon: User },
];

const PRIORITIES = [
  { value: "low", label: "Low", color: "bg-gray-100 text-gray-800" },
  { value: "normal", label: "Normal", color: "bg-blue-100 text-blue-800" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-800" },
  { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-800" },
];

const STATUSES = [
  { value: "open", label: "Open", color: "bg-blue-100 text-blue-800" },
  { value: "in_progress", label: "In Progress", color: "bg-yellow-100 text-yellow-800" },
  { value: "resolved", label: "Resolved", color: "bg-green-100 text-green-800" },
  { value: "closed", label: "Closed", color: "bg-gray-100 text-gray-800" },
];

interface HelpTicket {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  replies?: Array<any>;
  attachments?: Array<any>;
}

interface NewTicketForm {
  title: string;
  description: string;
  category: string;
  priority: string;
  reportedUserId?: string;
  tags: string[];
  attachments: File[];
}

export default function HelpSection() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState<HelpTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<HelpTicket | null>(null);
  const [view, setView] = useState<"list" | "detail" | "create">("list");
  const [filterStatus, setFilterStatus] = useState("all");
  const [newTicket, setNewTicket] = useState<NewTicketForm>({
    title: "",
    description: "",
    category: "question",
    priority: "normal",
    tags: [],
    attachments: [],
  });
  const [replyContent, setReplyContent] = useState("");
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Load tickets
  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMyHelpTickets(1, 100, filterStatus !== 'all' ? filterStatus : undefined);
      if (response.success && response.data?.tickets) {
        setTickets(response.data.tickets);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load help tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [filterStatus]);

  // Submit new ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTicket.title.trim() || !newTicket.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and description are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiService.createHelpTicket(newTicket);

      if (response.success) {
        toast({
          title: "Success",
          description: "Help ticket created successfully. Our team will review it soon.",
        });
        setNewTicket({
          title: "",
          description: "",
          category: "question",
          priority: "normal",
          tags: [],
          attachments: [],
        });
        setView("list");
        await loadTickets();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create help ticket",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Add reply to ticket
  const handleAddReply = async (ticketId: string) => {
    if (!replyContent.trim()) {
      toast({
        title: "Error",
        description: "Reply content is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiService.addHelpTicketReply(ticketId, replyContent);

      if (response.success) {
        toast({
          title: "Success",
          description: "Reply added successfully",
        });
        setReplyContent("");
        await loadTickets();
        if (selectedTicket?.id === ticketId) {
          const updatedTicket = tickets.find((t) => t.id === ticketId);
          if (updatedTicket) setSelectedTicket(updatedTicket);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add reply",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle file upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 5MB limit`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });
    setNewTicket({
      ...newTicket,
      attachments: [...newTicket.attachments, ...validFiles],
    });
  };

  // Remove attachment
  const handleRemoveAttachment = (index: number) => {
    setNewTicket({
      ...newTicket,
      attachments: newTicket.attachments.filter((_, i) => i !== index),
    });
  };

  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES.find((c) => c.value === category);
    return cat?.icon || HelpCircle;
  };

  const getPriorityBadge = (priority: string) => {
    const prio = PRIORITIES.find((p) => p.value === priority);
    return prio ? { label: prio.label, color: prio.color } : null;
  };

  const getStatusBadge = (status: string) => {
    const stat = STATUSES.find((s) => s.value === status);
    return stat ? { label: stat.label, color: stat.color } : null;
  };

  // Ticket list view
  if (view === "list") {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-xl font-semibold">Help & Support</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Ask questions, report issues, or share feedback
            </p>
          </div>
          <Button
            onClick={() => setView("create")}
            className="gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Create Ticket
          </Button>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {["all", ...STATUSES.map((s) => s.value)].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(status)}
              className="capitalize"
            >
              {status === "all" ? "All" : status.replace("_", " ")}
            </Button>
          ))}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : tickets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No help tickets yet</p>
              <Button onClick={() => setView("create")}>Create Your First Ticket</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => {
              const CategoryIcon = getCategoryIcon(ticket.category);
              const priorityBadge = getPriorityBadge(ticket.priority);
              const statusBadge = getStatusBadge(ticket.status);

              return (
                <Card
                  key={ticket.id}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setView("detail");
                  }}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      <div className="rounded-lg bg-muted p-2 flex-shrink-0">
                        <CategoryIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold truncate">{ticket.title}</h4>
                          {statusBadge && (
                            <Badge className={`${statusBadge.color} text-xs`}>
                              {statusBadge.label}
                            </Badge>
                          )}
                          {priorityBadge && (
                            <Badge className={`${priorityBadge.color} text-xs`}>
                              {priorityBadge.label}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {ticket.description}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </span>
                          {ticket.replies && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {ticket.replies.length} replies
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Detail view
  if (view === "detail" && selectedTicket) {
    const priorityBadge = getPriorityBadge(selectedTicket.priority);
    const statusBadge = getStatusBadge(selectedTicket.status);

    return (
      <div className="space-y-6">
        <Button
          variant="outline"
          onClick={() => {
            setView("list");
            setSelectedTicket(null);
          }}
        >
          ← Back to Tickets
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{selectedTicket.title}</CardTitle>
                <CardDescription>
                  {selectedTicket.category.replace("_", " ")} •{" "}
                  {new Date(selectedTicket.createdAt).toLocaleDateString()}
                </CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                {statusBadge && (
                  <Badge className={`${statusBadge.color}`}>
                    {statusBadge.label}
                  </Badge>
                )}
                {priorityBadge && (
                  <Badge className={`${priorityBadge.color}`}>
                    {priorityBadge.label}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Description */}
            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-sm whitespace-pre-wrap">{selectedTicket.description}</p>
            </div>

            {/* Attachments */}
            {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Attachments</h4>
                <div className="space-y-2">
                  {selectedTicket.attachments.map((attachment: any) => (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-2 p-2 bg-muted rounded"
                    >
                      <FileText className="h-4 w-4" />
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex-1 truncate"
                      >
                        {attachment.originalName}
                      </a>
                      <span className="text-xs text-muted-foreground">
                        {(attachment.size / 1024).toFixed(2)} KB
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Replies */}
            {selectedTicket.replies && selectedTicket.replies.length > 0 && (
              <div>
                <h4 className="font-semibold mb-4">Replies ({selectedTicket.replies.length})</h4>
                <div className="space-y-4">
                  {selectedTicket.replies.map((reply: any) => (
                    <div key={reply.id} className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-sm">{reply.user.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(reply.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Reply */}
            <div className="border-t pt-6">
              <h4 className="font-semibold mb-4">Add Reply</h4>
              <div className="space-y-4">
                <Textarea
                  placeholder="Type your reply here..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={4}
                />
                <Button
                  onClick={() => handleAddReply(selectedTicket.id)}
                  disabled={submitting || !replyContent.trim()}
                  className="gap-2"
                >
                  {submitting ? <LoadingSpinner size="sm" /> : <MessageSquare className="h-4 w-4" />}
                  Send Reply
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Create ticket view
  if (view === "create") {
    return (
      <div className="space-y-6">
        <Button
          variant="outline"
          onClick={() => {
            setView("list");
            setNewTicket({
              title: "",
              description: "",
              category: "question",
              priority: "normal",
              tags: [],
              attachments: [],
            });
          }}
        >
          ← Back to Tickets
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Create New Help Ticket</CardTitle>
            <CardDescription>
              Help us understand your issue or feedback so we can assist you better
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTicket} className="space-y-6">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <Select value={newTicket.category} onValueChange={(value) =>
                  setNewTicket({ ...newTicket, category: value })
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          {<cat.icon className="h-4 w-4" />}
                          {cat.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <Input
                  placeholder="Brief title of your issue or question..."
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">Description *</label>
                <Textarea
                  placeholder="Provide detailed information about your issue, question, or feedback..."
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  rows={6}
                  required
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium mb-2">Priority</label>
                <Select value={newTicket.priority} onValueChange={(value) =>
                  setNewTicket({ ...newTicket, priority: value })
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Attachments */}
              <div>
                <label className="block text-sm font-medium mb-2">Attachments (Optional)</label>
                <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center hover:bg-muted/50 transition">
                  <input
                    type="file"
                    id="file-input"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  <label htmlFor="file-input" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm">Click to upload files (max 5MB each)</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supported: Images, PDF, DOC, DOCX
                    </p>
                  </label>
                </div>

                {/* Selected files */}
                {newTicket.attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {newTicket.attachments.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-muted rounded"
                      >
                        <span className="text-sm truncate">
                          {file.name} ({(file.size / 1024).toFixed(2)} KB)
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAttachment(idx)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={submitting || !newTicket.title.trim() || !newTicket.description.trim()}
                  className="gap-2"
                >
                  {submitting ? <LoadingSpinner size="sm" /> : <MessageSquare className="h-4 w-4" />}
                  Create Ticket
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setView("list");
                    setNewTicket({
                      title: "",
                      description: "",
                      category: "question",
                      priority: "normal",
                      tags: [],
                      attachments: [],
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
