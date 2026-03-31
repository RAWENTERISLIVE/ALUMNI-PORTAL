import { Request, Response } from 'express';
import { Prisma, Role } from '@prisma/client';
import prisma from '../config/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { createNotification } from '../utils/notifications';

interface AuthRequest extends Request {
  user?: any;
}

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

const parsePositiveInt = (value: unknown, fallback: number) => {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return fallback;
  }

  const parsed = Number.parseInt(`${value}`, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parsePagination = (pageInput: unknown, limitInput: unknown, fallbackLimit = DEFAULT_PAGE_SIZE) => {
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
      createdAt: 'desc' as const,
    },
  },
  tags: true,
  resolution: true,
  resolvedAt: true,
  createdAt: true,
  updatedAt: true,
};

// Create a new help ticket
export const createHelpTicket = asyncHandler(async (req: AuthRequest, res: Response) => {
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
    const ticket = await prisma.helpTicket.create({
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

    // Send notification to support team
    const admins = await prisma.user.findMany({
      where: {
        role: {
          in: [Role.ADMIN, Role.SUPER_ADMIN, Role.MODERATOR],
        },
      },
      select: { id: true },
    });

    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'help_ticket_created',
        title: `New Help Ticket: ${title}`,
        message: `${req.user.name} created a new ${category} ticket`,
        relatedId: ticket.id,
        relatedType: 'help_ticket',
      });
    }

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating help ticket:', error);
    res.status(500).json({ error: 'Failed to create help ticket' });
  }
});

// Get all help tickets (with pagination and filtering)
export const getAllHelpTickets = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Only admins can view all tickets
  if (![Role.ADMIN, Role.SUPER_ADMIN, Role.MODERATOR].includes(req.user.role)) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const { page, limit, skip } = parsePagination(req.query.page, req.query.limit);
  const { status, category, priority } = req.query;

  const where: Prisma.HelpTicketWhereInput = {};
  if (status) where.status = status as string;
  if (category) where.category = category as string;
  if (priority) where.priority = priority as string;

  try {
    const [tickets, total] = await Promise.all([
      prisma.helpTicket.findMany({
        where,
        select: ticketSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.helpTicket.count({ where }),
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
  } catch (error) {
    console.error('Error fetching help tickets:', error);
    res.status(500).json({ error: 'Failed to fetch help tickets' });
  }
});

// Get my help tickets
export const getMyHelpTickets = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { page, limit, skip } = parsePagination(req.query.page, req.query.limit);
  const { status } = req.query;

  const where: Prisma.HelpTicketWhereInput = {
    createdById: req.user.id,
  };

  if (status) where.status = status as string;

  try {
    const [tickets, total] = await Promise.all([
      prisma.helpTicket.findMany({
        where,
        select: ticketSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.helpTicket.count({ where }),
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
  } catch (error) {
    console.error('Error fetching my help tickets:', error);
    res.status(500).json({ error: 'Failed to fetch help tickets' });
  }
});

// Get a single help ticket
export const getHelpTicket = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { id } = req.params;

  try {
    const ticket = await prisma.helpTicket.findUnique({
      where: { id },
      select: ticketSelect,
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Help ticket not found' });
    }

    // Check if user can view this ticket
    const isCreator = ticket.createdById === req.user.id;
    const isAdmin = [Role.ADMIN, Role.SUPER_ADMIN, Role.MODERATOR].includes(req.user.role);
    const isAssignee = ticket.assignedTo === req.user.id;

    if (!isCreator && !isAdmin && !isAssignee) {
      return res.status(403).json({ error: 'Not authorized to view this ticket' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Error fetching help ticket:', error);
    res.status(500).json({ error: 'Failed to fetch help ticket' });
  }
});

// Update help ticket
export const updateHelpTicket = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { id } = req.params;
  const { status, priority, assignedTo, resolution, tags } = req.body;

  try {
    const ticket = await prisma.helpTicket.findUnique({
      where: { id },
      select: { createdById: true, category: true },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Help ticket not found' });
    }

    // Only admins and creator can update
    const isCreator = ticket.createdById === req.user.id;
    const isAdmin = [Role.ADMIN, Role.SUPER_ADMIN, Role.MODERATOR].includes(req.user.role);

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to update this ticket' });
    }

    const updateData: Prisma.HelpTicketUpdateInput = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (resolution) {
      updateData.resolution = resolution;
      updateData.resolvedAt = new Date();
      updateData.status = 'resolved';
    }
    if (tags) updateData.tags = tags;

    const updatedTicket = await prisma.helpTicket.update({
      where: { id },
      data: updateData,
      select: ticketSelect,
    });

    // Notify assignee
    if (updateData.assignedTo && updatedTicket.assignedTo) {
      await createNotification({
        userId: updatedTicket.assignedTo,
        type: 'help_ticket_assigned',
        title: `Help Ticket Assigned: ${updatedTicket.title}`,
        message: `You have been assigned to a new help ticket`,
        relatedId: id,
        relatedType: 'help_ticket',
      });
    }

    res.json(updatedTicket);
  } catch (error) {
    console.error('Error updating help ticket:', error);
    res.status(500).json({ error: 'Failed to update help ticket' });
  }
});

// Add reply to help ticket
export const addReplyToTicket = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { id } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  try {
    const ticket = await prisma.helpTicket.findUnique({
      where: { id },
      select: { createdById: true, assignedTo: true },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Help ticket not found' });
    }

    const reply = await prisma.helpTicketReply.create({
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

    // Notify creator
    if (ticket.createdById !== req.user.id) {
      await createNotification({
        userId: ticket.createdById,
        type: 'help_ticket_reply',
        title: 'New Reply to Your Help Ticket',
        message: `${req.user.name} replied to your help ticket`,
        relatedId: id,
        relatedType: 'help_ticket',
      });
    }

    // Notify assignee
    if (ticket.assignedTo && ticket.assignedTo !== req.user.id) {
      await createNotification({
        userId: ticket.assignedTo,
        type: 'help_ticket_reply',
        title: 'New Reply to Help Ticket',
        message: `${req.user.name} replied to a help ticket you are assigned to`,
        relatedId: id,
        relatedType: 'help_ticket',
      });
    }

    res.status(201).json(reply);
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ error: 'Failed to add reply' });
  }
});

// Delete help ticket
export const deleteHelpTicket = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { id } = req.params;

  try {
    const ticket = await prisma.helpTicket.findUnique({
      where: { id },
      select: { createdById: true },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Help ticket not found' });
    }

    // Only creator and admins can delete
    const isCreator = ticket.createdById === req.user.id;
    const isAdmin = [Role.ADMIN, Role.SUPER_ADMIN].includes(req.user.role);

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to delete this ticket' });
    }

    await prisma.helpTicket.delete({
      where: { id },
    });

    res.json({ message: 'Help ticket deleted successfully' });
  } catch (error) {
    console.error('Error deleting help ticket:', error);
    res.status(500).json({ error: 'Failed to delete help ticket' });
  }
});

// Search help tickets
export const searchHelpTickets = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { query, category, status } = req.query;
  const { page, limit, skip } = parsePagination(req.query.page, req.query.limit);

  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    const where: Prisma.HelpTicketWhereInput = {
      OR: [
        { title: { contains: query as string, mode: 'insensitive' } },
        { description: { contains: query as string, mode: 'insensitive' } },
        { tags: { hasSome: [query as string] } },
      ],
      AND: [
        // Only users can see their own, admins can see all
        [Role.ADMIN, Role.SUPER_ADMIN, Role.MODERATOR].includes(req.user.role)
          ? {}
          : { createdById: req.user.id },
      ],
    };

    if (category) where.category = category as string;
    if (status) where.status = status as string;

    const [tickets, total] = await Promise.all([
      prisma.helpTicket.findMany({
        where,
        select: ticketSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.helpTicket.count({ where }),
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
  } catch (error) {
    console.error('Error searching help tickets:', error);
    res.status(500).json({ error: 'Failed to search help tickets' });
  }
});
