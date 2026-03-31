"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchHelpTickets = exports.deleteHelpTicket = exports.addReplyToTicket = exports.updateHelpTicket = exports.getHelpTicket = exports.getMyHelpTickets = exports.getAllHelpTickets = exports.createHelpTicket = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../config/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
const notifications_1 = require("../utils/notifications");
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;
const parsePositiveInt = (value, fallback) => {
    if (typeof value !== 'string' && typeof value !== 'number') {
        return fallback;
    }
    const parsed = Number.parseInt(`${value}`, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
const parsePagination = (pageInput, limitInput, fallbackLimit = DEFAULT_PAGE_SIZE) => {
    const page = parsePositiveInt(pageInput, 1);
    const limit = Math.min(parsePositiveInt(limitInput, fallbackLimit), MAX_PAGE_SIZE);
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};
const ticketSelect = {
    id: true,
    title: true,
    description: true,
    category: true,
    status: true,
    priority: true,
    createdById: true,
    createdBy: {
        select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
        },
    },
    assignedTo: true,
    assignedToUser: {
        select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
        },
    },
    reportedUserId: true,
    reportedUser: {
        select: {
            id: true,
            name: true,
            email: true,
        },
    },
    attachments: {
        select: {
            id: true,
            filename: true,
            originalName: true,
            mimetype: true,
            size: true,
            url: true,
            createdAt: true,
        },
    },
    replies: {
        select: {
            id: true,
            content: true,
            userId: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profileImage: true,
                },
            },
            attachments: true,
            createdAt: true,
            updatedAt: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    },
    tags: true,
    resolution: true,
    resolvedAt: true,
    createdAt: true,
    updatedAt: true,
};
exports.createHelpTicket = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user?.id) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const { title, description, category, reportedUserId, priority = 'normal', tags = [] } = req.body;
    if (!title || !description || !category) {
        return res.status(400).json({ error: 'Title, description, and category are required' });
    }
    const validCategories = ['question', 'report', 'feedback', 'bug_report'];
    if (!validCategories.includes(category)) {
        return res.status(400).json({ error: 'Invalid category' });
    }
    try {
        const ticket = await prisma_1.default.helpTicket.create({
            data: {
                title,
                description,
                category,
                priority,
                tags,
                createdById: req.user.id,
                reportedUserId: reportedUserId || null,
            },
            select: ticketSelect,
        });
        const admins = await prisma_1.default.user.findMany({
            where: {
                role: {
                    in: [client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN, client_1.Role.MODERATOR],
                },
            },
            select: { id: true },
        });
        for (const admin of admins) {
            await (0, notifications_1.createNotification)({
                userId: admin.id,
                type: 'help_ticket_created',
                title: `New Help Ticket: ${title}`,
                message: `${req.user.name} created a new ${category} ticket`,
                relatedId: ticket.id,
                relatedType: 'help_ticket',
            });
        }
        res.status(201).json(ticket);
    }
    catch (error) {
        console.error('Error creating help ticket:', error);
        res.status(500).json({ error: 'Failed to create help ticket' });
    }
});
exports.getAllHelpTickets = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user?.id) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    if (![client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN, client_1.Role.MODERATOR].includes(req.user.role)) {
        return res.status(403).json({ error: 'Not authorized' });
    }
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit);
    const { status, category, priority } = req.query;
    const where = {};
    if (status)
        where.status = status;
    if (category)
        where.category = category;
    if (priority)
        where.priority = priority;
    try {
        const [tickets, total] = await Promise.all([
            prisma_1.default.helpTicket.findMany({
                where,
                select: ticketSelect,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma_1.default.helpTicket.count({ where }),
        ]);
        res.json({
            tickets,
            paginate: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        console.error('Error fetching help tickets:', error);
        res.status(500).json({ error: 'Failed to fetch help tickets' });
    }
});
exports.getMyHelpTickets = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user?.id) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit);
    const { status } = req.query;
    const where = {
        createdById: req.user.id,
    };
    if (status)
        where.status = status;
    try {
        const [tickets, total] = await Promise.all([
            prisma_1.default.helpTicket.findMany({
                where,
                select: ticketSelect,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma_1.default.helpTicket.count({ where }),
        ]);
        res.json({
            tickets,
            paginate: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        console.error('Error fetching my help tickets:', error);
        res.status(500).json({ error: 'Failed to fetch help tickets' });
    }
});
exports.getHelpTicket = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user?.id) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const { id } = req.params;
    try {
        const ticket = await prisma_1.default.helpTicket.findUnique({
            where: { id },
            select: ticketSelect,
        });
        if (!ticket) {
            return res.status(404).json({ error: 'Help ticket not found' });
        }
        const isCreator = ticket.createdById === req.user.id;
        const isAdmin = [client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN, client_1.Role.MODERATOR].includes(req.user.role);
        const isAssignee = ticket.assignedTo === req.user.id;
        if (!isCreator && !isAdmin && !isAssignee) {
            return res.status(403).json({ error: 'Not authorized to view this ticket' });
        }
        res.json(ticket);
    }
    catch (error) {
        console.error('Error fetching help ticket:', error);
        res.status(500).json({ error: 'Failed to fetch help ticket' });
    }
});
exports.updateHelpTicket = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user?.id) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const { id } = req.params;
    const { status, priority, assignedTo, resolution, tags } = req.body;
    try {
        const ticket = await prisma_1.default.helpTicket.findUnique({
            where: { id },
            select: { createdById: true, category: true },
        });
        if (!ticket) {
            return res.status(404).json({ error: 'Help ticket not found' });
        }
        const isCreator = ticket.createdById === req.user.id;
        const isAdmin = [client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN, client_1.Role.MODERATOR].includes(req.user.role);
        if (!isCreator && !isAdmin) {
            return res.status(403).json({ error: 'Not authorized to update this ticket' });
        }
        const updateData = {};
        if (status)
            updateData.status = status;
        if (priority)
            updateData.priority = priority;
        if (assignedTo !== undefined)
            updateData.assignedTo = assignedTo;
        if (resolution) {
            updateData.resolution = resolution;
            updateData.resolvedAt = new Date();
            updateData.status = 'resolved';
        }
        if (tags)
            updateData.tags = tags;
        const updatedTicket = await prisma_1.default.helpTicket.update({
            where: { id },
            data: updateData,
            select: ticketSelect,
        });
        if (updateData.assignedTo && updatedTicket.assignedTo) {
            await (0, notifications_1.createNotification)({
                userId: updatedTicket.assignedTo,
                type: 'help_ticket_assigned',
                title: `Help Ticket Assigned: ${updatedTicket.title}`,
                message: `You have been assigned to a new help ticket`,
                relatedId: id,
                relatedType: 'help_ticket',
            });
        }
        res.json(updatedTicket);
    }
    catch (error) {
        console.error('Error updating help ticket:', error);
        res.status(500).json({ error: 'Failed to update help ticket' });
    }
});
exports.addReplyToTicket = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user?.id) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const { id } = req.params;
    const { content } = req.body;
    if (!content) {
        return res.status(400).json({ error: 'Content is required' });
    }
    try {
        const ticket = await prisma_1.default.helpTicket.findUnique({
            where: { id },
            select: { createdById: true, assignedTo: true },
        });
        if (!ticket) {
            return res.status(404).json({ error: 'Help ticket not found' });
        }
        const reply = await prisma_1.default.helpTicketReply.create({
            data: {
                content,
                ticketId: id,
                userId: req.user.id,
            },
            select: {
                id: true,
                content: true,
                userId: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profileImage: true,
                    },
                },
                createdAt: true,
                attachments: true,
            },
        });
        if (ticket.createdById !== req.user.id) {
            await (0, notifications_1.createNotification)({
                userId: ticket.createdById,
                type: 'help_ticket_reply',
                title: 'New Reply to Your Help Ticket',
                message: `${req.user.name} replied to your help ticket`,
                relatedId: id,
                relatedType: 'help_ticket',
            });
        }
        if (ticket.assignedTo && ticket.assignedTo !== req.user.id) {
            await (0, notifications_1.createNotification)({
                userId: ticket.assignedTo,
                type: 'help_ticket_reply',
                title: 'New Reply to Help Ticket',
                message: `${req.user.name} replied to a help ticket you are assigned to`,
                relatedId: id,
                relatedType: 'help_ticket',
            });
        }
        res.status(201).json(reply);
    }
    catch (error) {
        console.error('Error adding reply:', error);
        res.status(500).json({ error: 'Failed to add reply' });
    }
});
exports.deleteHelpTicket = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user?.id) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const { id } = req.params;
    try {
        const ticket = await prisma_1.default.helpTicket.findUnique({
            where: { id },
            select: { createdById: true },
        });
        if (!ticket) {
            return res.status(404).json({ error: 'Help ticket not found' });
        }
        const isCreator = ticket.createdById === req.user.id;
        const isAdmin = [client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN].includes(req.user.role);
        if (!isCreator && !isAdmin) {
            return res.status(403).json({ error: 'Not authorized to delete this ticket' });
        }
        await prisma_1.default.helpTicket.delete({
            where: { id },
        });
        res.json({ message: 'Help ticket deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting help ticket:', error);
        res.status(500).json({ error: 'Failed to delete help ticket' });
    }
});
exports.searchHelpTickets = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user?.id) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const { query, category, status } = req.query;
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit);
    if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
    }
    try {
        const where = {
            OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { tags: { hasSome: [query] } },
            ],
            AND: [
                [client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN, client_1.Role.MODERATOR].includes(req.user.role)
                    ? {}
                    : { createdById: req.user.id },
            ],
        };
        if (category)
            where.category = category;
        if (status)
            where.status = status;
        const [tickets, total] = await Promise.all([
            prisma_1.default.helpTicket.findMany({
                where,
                select: ticketSelect,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma_1.default.helpTicket.count({ where }),
        ]);
        res.json({
            tickets,
            paginate: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        console.error('Error searching help tickets:', error);
        res.status(500).json({ error: 'Failed to search help tickets' });
    }
});
//# sourceMappingURL=helpTicketController.js.map