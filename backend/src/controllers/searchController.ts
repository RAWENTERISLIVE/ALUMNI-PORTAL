import { Request, Response } from 'express';
import { Status } from '@prisma/client';
import prisma from '../config/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { getHiddenSystemAccountEmails } from '../config/systemAccounts';

interface AuthRequest extends Request {
  user?: {
    id?: string;
    _id?: string;
    role?: string;
  };
}

type SearchResultType = 'shortcut' | 'message' | 'user' | 'group' | 'event' | 'job' | 'post' | 'help_ticket';

interface UniversalSearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  route: string;
}

const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 12;

const parseLimit = (input: unknown) => {
  if (typeof input !== 'string' && typeof input !== 'number') {
    return DEFAULT_LIMIT;
  }

  const parsed = Number.parseInt(String(input), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_LIMIT;
  }

  return Math.min(parsed, MAX_LIMIT);
};

const normalizeText = (value: string) => value.trim().toLowerCase();

const buildShortcutResults = (query: string, isAdmin: boolean): UniversalSearchResult[] => {
  const shortcuts: Array<UniversalSearchResult & { keywords: string[]; adminOnly?: boolean }> = [
    {
      id: 'shortcut-dashboard',
      type: 'shortcut',
      title: 'Dashboard',
      subtitle: 'Open your home feed',
      route: '/dashboard',
      keywords: ['dashboard', 'home', 'feed']
    },
    {
      id: 'shortcut-directory',
      type: 'shortcut',
      title: 'Directory',
      subtitle: 'Find alumni by name, company, and location',
      route: '/directory',
      keywords: ['directory', 'alumni', 'people']
    },
    {
      id: 'shortcut-messages',
      type: 'shortcut',
      title: 'Direct Messages',
      subtitle: 'Open one-to-one chats',
      route: '/messages',
      keywords: ['dm', 'messages', 'chat']
    },
    {
      id: 'shortcut-groups',
      type: 'shortcut',
      title: 'Groups',
      subtitle: 'Browse private and public groups',
      route: '/groups',
      keywords: ['groups', 'community', 'discussion']
    },
    {
      id: 'shortcut-posts',
      type: 'shortcut',
      title: 'Posts',
      subtitle: 'Explore alumni posts and updates',
      route: '/posts',
      keywords: ['posts', 'feed', 'updates']
    },
    {
      id: 'shortcut-events',
      type: 'shortcut',
      title: 'Events',
      subtitle: 'Find and RSVP to alumni events',
      route: '/events',
      keywords: ['events', 'meetup', 'rsvp']
    },
    {
      id: 'shortcut-jobs',
      type: 'shortcut',
      title: 'Jobs',
      subtitle: 'Search opportunities and referrals',
      route: '/jobs',
      keywords: ['jobs', 'career', 'opportunities']
    },
    {
      id: 'shortcut-settings',
      type: 'shortcut',
      title: 'Settings',
      subtitle: 'Update account, privacy, and notifications',
      route: '/settings',
      keywords: ['settings', 'notification', 'privacy', 'account']
    },
    {
      id: 'shortcut-profile',
      type: 'shortcut',
      title: 'Profile',
      subtitle: 'Edit your profile details',
      route: '/profile',
      keywords: ['profile', 'edit profile', 'bio']
    },
    {
      id: 'shortcut-admin',
      type: 'shortcut',
      title: 'Admin Panel',
      subtitle: 'Manage approvals and moderation',
      route: '/admin',
      keywords: ['admin', 'moderation', 'approvals'],
      adminOnly: true
    },
    {
      id: 'shortcut-help',
      type: 'shortcut',
      title: 'Help & Support',
      subtitle: 'Ask questions, report issues, or share feedback',
      route: '/settings?tab=help',
      keywords: ['help', 'support', 'ticket', 'report', 'feedback', 'bug']
    }
  ];

  const normalizedQuery = normalizeText(query);

  return shortcuts
    .filter((shortcut) => {
      if (shortcut.adminOnly && !isAdmin) return false;
      if (!normalizedQuery) return true;

      const searchable = [shortcut.title, shortcut.subtitle || '', ...shortcut.keywords]
        .join(' ')
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    })
    .map(({ keywords: _keywords, adminOnly: _adminOnly, ...shortcut }) => shortcut)
    .slice(0, 8);
};

export const universalSearch = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const currentUserId = authReq.user?.id || authReq.user?._id;

  if (!currentUserId) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const limit = parseLimit(req.query.limit);
  const normalizedRole = String(authReq.user?.role || '').toLowerCase();
  const isAdmin = normalizedRole === 'admin' || normalizedRole === 'super_admin';
  const shortcutResults = buildShortcutResults(query, isAdmin);

  if (query.length < 2) {
    res.status(200).json({
      success: true,
      data: shortcutResults,
      sections: {
        shortcuts: shortcutResults.length,
        messages: 0,
        people: 0,
        groups: 0,
        events: 0,
        jobs: 0,
        posts: 0
      }
    });
    return;
  }

  const hiddenEmails = [...getHiddenSystemAccountEmails()];

  const [messageableUsers, users, groups, events, jobs, posts, helpTickets] = await Promise.all([
    prisma.user.findMany({
      where: {
        status: Status.ACTIVE,
        id: { not: currentUserId },
        email: { notIn: hiddenEmails },
        AND: [
          {
            OR: [
              { connections: { some: { id: currentUserId } } },
              { connectedTo: { some: { id: currentUserId } } }
            ]
          },
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
              { headline: { contains: query, mode: 'insensitive' } },
              { company: { contains: query, mode: 'insensitive' } },
              { jobTitle: { contains: query, mode: 'insensitive' } },
              { location: { contains: query, mode: 'insensitive' } }
            ]
          }
        ]
      },
      select: {
        id: true,
        name: true,
        profileImage: true,
        company: true,
        jobTitle: true
      },
      orderBy: { name: 'asc' },
      take: limit
    }),
    prisma.user.findMany({
      where: {
        status: Status.ACTIVE,
        id: { not: currentUserId },
        email: { notIn: hiddenEmails },
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { headline: { contains: query, mode: 'insensitive' } },
          { company: { contains: query, mode: 'insensitive' } },
          { jobTitle: { contains: query, mode: 'insensitive' } },
          { location: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        profileImage: true,
        company: true,
        jobTitle: true
      },
      orderBy: { name: 'asc' },
      take: limit
    }),
    prisma.group.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        description: true,
        memberCount: true
      },
      orderBy: { lastActivity: 'desc' },
      take: limit
    }),
    prisma.event.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { location: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        title: true,
        location: true,
        date: true
      },
      orderBy: { date: 'asc' },
      take: limit
    }),
    prisma.job.findMany({
      where: {
        isActive: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { company: { contains: query, mode: 'insensitive' } },
          { location: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        title: true,
        company: true,
        location: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    }),
    prisma.post.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        title: true,
        content: true,
        author: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    }),
    prisma.helpTicket.findMany({
      where: {
        AND: [
          {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { tags: { hasSome: [query] } }
            ]
          },
          {
            // User can only see their own tickets or tickets assigned to them (for admins/moderators)
            OR: [
              { createdById: currentUserId },
              { assignedTo: currentUserId }
            ]
          }
        ]
      },
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        priority: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  ]);

  const messageResults: UniversalSearchResult[] = messageableUsers.map((user) => ({
    id: `message-${user.id}`,
    type: 'message',
    title: `Message ${user.name}`,
    subtitle: [user.jobTitle, user.company].filter(Boolean).join(' • ') || 'Open direct chat',
    route: `/messages?user=${encodeURIComponent(user.id)}`
  }));

  const peopleResults: UniversalSearchResult[] = users.map((user) => ({
    id: `user-${user.id}`,
    type: 'user',
    title: user.name,
    subtitle: [user.jobTitle, user.company].filter(Boolean).join(' • ') || 'Open profile',
    route: `/directory/profile/${encodeURIComponent(user.id)}`
  }));

  const groupResults: UniversalSearchResult[] = groups.map((group) => ({
    id: `group-${group.id}`,
    type: 'group',
    title: group.name,
    subtitle: group.description || `${group.memberCount} members`,
    route: '/groups'
  }));

  const eventResults: UniversalSearchResult[] = events.map((event) => ({
    id: `event-${event.id}`,
    type: 'event',
    title: event.title,
    subtitle: [event.location, new Date(event.date).toLocaleDateString()].filter(Boolean).join(' • '),
    route: '/events'
  }));

  const jobResults: UniversalSearchResult[] = jobs.map((job) => ({
    id: `job-${job.id}`,
    type: 'job',
    title: job.title,
    subtitle: [job.company, job.location].filter(Boolean).join(' • '),
    route: '/jobs'
  }));

  const postResults: UniversalSearchResult[] = posts.map((post) => ({
    id: `post-${post.id}`,
    type: 'post',
    title: post.title || 'Alumni post',
    subtitle: post.author?.name || post.content.slice(0, 90),
    route: '/posts'
  }));

  const helpTicketResults: UniversalSearchResult[] = helpTickets.map((ticket) => ({
    id: `help-ticket-${ticket.id}`,
    type: 'help_ticket',
    title: ticket.title,
    subtitle: `${ticket.category.replace(/_/g, ' ')} • ${ticket.status}`,
    route: `/settings?tab=help&ticket=${encodeURIComponent(ticket.id)}`
  }));

  const combinedResults = [
    ...shortcutResults,
    ...messageResults,
    ...peopleResults,
    ...groupResults,
    ...eventResults,
    ...jobResults,
    ...postResults,
    ...helpTicketResults
  ];

  res.status(200).json({
    success: true,
    data: combinedResults,
    sections: {
      shortcuts: shortcutResults.length,
      messages: messageResults.length,
      people: peopleResults.length,
      groups: groupResults.length,
      events: eventResults.length,
      jobs: jobResults.length,
      posts: postResults.length,
      help_tickets: helpTicketResults.length
    }
  });
});
