"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.universalSearch = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../config/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
const systemAccounts_1 = require("../config/systemAccounts");
const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 12;
const parseLimit = (input) => {
    if (typeof input !== 'string' && typeof input !== 'number') {
        return DEFAULT_LIMIT;
    }
    const parsed = Number.parseInt(String(input), 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return DEFAULT_LIMIT;
    }
    return Math.min(parsed, MAX_LIMIT);
};
const normalizeText = (value) => value.trim().toLowerCase();
const buildShortcutResults = (query, isAdmin) => {
    const shortcuts = [
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
        }
    ];
    const normalizedQuery = normalizeText(query);
    return shortcuts
        .filter((shortcut) => {
        if (shortcut.adminOnly && !isAdmin)
            return false;
        if (!normalizedQuery)
            return true;
        const searchable = [shortcut.title, shortcut.subtitle || '', ...shortcut.keywords]
            .join(' ')
            .toLowerCase();
        return searchable.includes(normalizedQuery);
    })
        .map(({ keywords: _keywords, adminOnly: _adminOnly, ...shortcut }) => shortcut)
        .slice(0, 8);
};
exports.universalSearch = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const authReq = req;
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
    const hiddenEmails = [...(0, systemAccounts_1.getHiddenSystemAccountEmails)()];
    const [messageableUsers, users, groups, events, jobs, posts] = await Promise.all([
        prisma_1.default.user.findMany({
            where: {
                status: client_1.Status.ACTIVE,
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
        prisma_1.default.user.findMany({
            where: {
                status: client_1.Status.ACTIVE,
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
        prisma_1.default.group.findMany({
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
        prisma_1.default.event.findMany({
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
        prisma_1.default.job.findMany({
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
        prisma_1.default.post.findMany({
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
        })
    ]);
    const messageResults = messageableUsers.map((user) => ({
        id: `message-${user.id}`,
        type: 'message',
        title: `Message ${user.name}`,
        subtitle: [user.jobTitle, user.company].filter(Boolean).join(' • ') || 'Open direct chat',
        route: `/messages?user=${encodeURIComponent(user.id)}`
    }));
    const peopleResults = users.map((user) => ({
        id: `user-${user.id}`,
        type: 'user',
        title: user.name,
        subtitle: [user.jobTitle, user.company].filter(Boolean).join(' • ') || 'Open profile',
        route: `/directory/profile/${encodeURIComponent(user.id)}`
    }));
    const groupResults = groups.map((group) => ({
        id: `group-${group.id}`,
        type: 'group',
        title: group.name,
        subtitle: group.description || `${group.memberCount} members`,
        route: '/groups'
    }));
    const eventResults = events.map((event) => ({
        id: `event-${event.id}`,
        type: 'event',
        title: event.title,
        subtitle: [event.location, new Date(event.date).toLocaleDateString()].filter(Boolean).join(' • '),
        route: '/events'
    }));
    const jobResults = jobs.map((job) => ({
        id: `job-${job.id}`,
        type: 'job',
        title: job.title,
        subtitle: [job.company, job.location].filter(Boolean).join(' • '),
        route: '/jobs'
    }));
    const postResults = posts.map((post) => ({
        id: `post-${post.id}`,
        type: 'post',
        title: post.title || 'Alumni post',
        subtitle: post.author?.name || post.content.slice(0, 90),
        route: '/posts'
    }));
    const combinedResults = [
        ...shortcutResults,
        ...messageResults,
        ...peopleResults,
        ...groupResults,
        ...eventResults,
        ...jobResults,
        ...postResults
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
            posts: postResults.length
        }
    });
});
//# sourceMappingURL=searchController.js.map