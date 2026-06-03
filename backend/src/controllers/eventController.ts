import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';

const includeEventRelations = {
  organizer: { select: { id: true, name: true, email: true, profileImage: true, role: true } },
  attendees: { select: { id: true, name: true, profileImage: true, role: true } }
};

const isAdminRole = (role?: string) => {
  const normalized = (role || '').toLowerCase();
  return normalized === 'admin' || normalized === 'super_admin';
};

export const getEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      status = 'upcoming',
      isSchoolEvent,
      search,
      startDate,
      endDate
    } = req.query;

    const pageNum = Number.parseInt(page as string, 10) || 1;
    const limitNum = Number.parseInt(limit as string, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (category) where.category = String(category);
    if (status) where.status = String(status);
    if (isSchoolEvent !== undefined) where.isSchoolEvent = isSchoolEvent === 'true';

    if (search) {
      const searchValue = String(search);
      where.OR = [
        { title: { contains: searchValue, mode: 'insensitive' } },
        { description: { contains: searchValue, mode: 'insensitive' } },
        { location: { contains: searchValue, mode: 'insensitive' } }
      ];
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(String(startDate));
      if (endDate) where.date.lte = new Date(String(endDate));
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: includeEventRelations,
        orderBy: { date: 'asc' },
        skip,
        take: limitNum
      }),
      prisma.event.count({ where })
    ]);

    res.json({
      success: true,
      data: events,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch events' });
  }
};

export const getUpcomingEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = Number.parseInt(req.query.limit as string, 10) || 5;

    const events = await prisma.event.findMany({
      where: {
        status: 'upcoming',
        date: { gte: new Date() }
      },
      include: includeEventRelations,
      orderBy: { date: 'asc' },
      take: limit
    });

    res.json({ success: true, data: events });
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch upcoming events' });
  }
};

export const getEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: includeEventRelations
    });

    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    res.json({ success: true, data: event });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch event' });
  }
};

export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const {
      title, description, date, endDate, time, location,
      maxAttendees, isVirtual, meetingLink, category,
      imageUrl, isSchoolEvent, tags
    } = req.body;

    const created = await prisma.event.create({
      data: {
        title,
        description,
        date: date ? new Date(date) : undefined,
        endDate: endDate ? new Date(endDate) : null,
        time,
        location,
        maxAttendees: maxAttendees ? Number.parseInt(maxAttendees, 10) : null,
        isVirtual: Boolean(isVirtual),
        meetingLink,
        category,
        imageUrl,
        isSchoolEvent: Boolean(isSchoolEvent),
        tags: Array.isArray(tags) ? tags : [],
        organizerId: userId,
        attendees: { connect: [] }
      } as any,
      include: includeEventRelations
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: created
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ success: false, message: 'Failed to create event' });
  }
};

export const updateEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    if (event.organizerId !== userId && !isAdminRole(req.user?.role)) {
      res.status(403).json({ success: false, message: 'Not authorized to update this event' });
      return;
    }

    const {
      title, description, date, endDate, time, location,
      maxAttendees, isVirtual, meetingLink, category,
      imageUrl, isSchoolEvent, tags, status
    } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) updateData.date = new Date(date);
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (time !== undefined) updateData.time = time;
    if (location !== undefined) updateData.location = location;
    if (maxAttendees !== undefined) updateData.maxAttendees = maxAttendees ? Number.parseInt(maxAttendees, 10) : null;
    if (isVirtual !== undefined) updateData.isVirtual = Boolean(isVirtual);
    if (meetingLink !== undefined) updateData.meetingLink = meetingLink;
    if (category !== undefined) updateData.category = category;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (isSchoolEvent !== undefined) updateData.isSchoolEvent = Boolean(isSchoolEvent);
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];
    if (status !== undefined) updateData.status = status;

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: includeEventRelations
    });

    res.json({ success: true, message: 'Event updated successfully', data: updated });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ success: false, message: 'Failed to update event' });
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    if (event.organizerId !== userId && !isAdminRole(req.user?.role)) {
      res.status(403).json({ success: false, message: 'Not authorized to delete this event' });
      return;
    }

    await prisma.event.delete({ where: { id: eventId } });

    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ success: false, message: 'Failed to delete event' });
  }
};

export const rsvpEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { attendees: { select: { id: true } } }
    });

    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
      res.status(400).json({ success: false, message: 'Event is full' });
      return;
    }

    if (event.attendees.some((attendee) => attendee.id === userId)) {
      res.status(400).json({ success: false, message: 'You have already RSVP\'d to this event' });
      return;
    }

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: { attendees: { connect: { id: userId } } },
      include: includeEventRelations
    });

    res.json({ success: true, message: 'RSVP successful', data: updated });
  } catch (error) {
    console.error('Error RSVP to event:', error);
    res.status(500).json({ success: false, message: 'Failed to RSVP to event' });
  }
};

export const cancelRsvp = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { attendees: { select: { id: true } } }
    });

    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    if (!event.attendees.some((attendee) => attendee.id === userId)) {
      res.status(400).json({ success: false, message: 'You have not RSVP\'d to this event' });
      return;
    }

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: { attendees: { disconnect: { id: userId } } },
      include: includeEventRelations
    });

    res.json({ success: true, message: 'RSVP cancelled successfully', data: updated });
  } catch (error) {
    console.error('Error cancelling RSVP:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel RSVP' });
  }
};

export const getEventAttendees = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id;

    if (!eventId) {
      res.status(400).json({ success: false, message: 'Event ID is required' });
      return;
    }

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        attendees: {
          select: {
            id: true,
            name: true,
            email: true,
            contactPhone: true,
            contactEmail: true,
            admissionNumber: true
          }
        }
      }
    });

    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    if (event.organizerId !== userId && !isAdminRole(req.user?.role)) {
      res.status(403).json({ success: false, message: 'Not authorized to view attendees for this event' });
      return;
    }

    const attendees = event.attendees.map((attendee) => ({
      id: attendee.id,
      name: attendee.name,
      email: attendee.contactEmail || attendee.email,
      phone: attendee.contactPhone,
      admissionNumber: attendee.admissionNumber
    }));

    res.json({ success: true, data: attendees });
  } catch (error) {
    console.error('Error fetching event attendees:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch event attendees' });
  }
};

export const getUserEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const events = await prisma.event.findMany({
      where: { attendees: { some: { id: userId } } },
      include: includeEventRelations,
      orderBy: { date: 'asc' }
    });

    res.json({ success: true, data: events });
  } catch (error) {
    console.error('Error fetching user events:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user events' });
  }
};
