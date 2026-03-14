"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserEvents = exports.cancelRsvp = exports.rsvpEvent = exports.deleteEvent = exports.updateEvent = exports.createEvent = exports.getEvent = exports.getUpcomingEvents = exports.getEvents = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const includeEventRelations = {
    organizer: { select: { id: true, name: true, email: true, profileImage: true, role: true } },
    attendees: { select: { id: true, name: true, profileImage: true, role: true } }
};
const isAdminRole = (role) => {
    const normalized = (role || '').toLowerCase();
    return normalized === 'admin' || normalized === 'super_admin';
};
const getEvents = async (req, res) => {
    try {
        const { page = 1, limit = 10, category, status = 'upcoming', isSchoolEvent, search, startDate, endDate } = req.query;
        const pageNum = Number.parseInt(page, 10) || 1;
        const limitNum = Number.parseInt(limit, 10) || 10;
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (category)
            where.category = String(category);
        if (status)
            where.status = String(status);
        if (isSchoolEvent !== undefined)
            where.isSchoolEvent = isSchoolEvent === 'true';
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
            if (startDate)
                where.date.gte = new Date(String(startDate));
            if (endDate)
                where.date.lte = new Date(String(endDate));
        }
        const [events, total] = await Promise.all([
            prisma_1.default.event.findMany({
                where,
                include: includeEventRelations,
                orderBy: { date: 'asc' },
                skip,
                take: limitNum
            }),
            prisma_1.default.event.count({ where })
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
    }
    catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch events' });
    }
};
exports.getEvents = getEvents;
const getUpcomingEvents = async (req, res) => {
    try {
        const limit = Number.parseInt(req.query.limit, 10) || 5;
        const events = await prisma_1.default.event.findMany({
            where: {
                status: 'upcoming',
                date: { gte: new Date() }
            },
            include: includeEventRelations,
            orderBy: { date: 'asc' },
            take: limit
        });
        res.json({ success: true, data: events });
    }
    catch (error) {
        console.error('Error fetching upcoming events:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch upcoming events' });
    }
};
exports.getUpcomingEvents = getUpcomingEvents;
const getEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const event = await prisma_1.default.event.findUnique({
            where: { id: eventId },
            include: includeEventRelations
        });
        if (!event) {
            res.status(404).json({ success: false, message: 'Event not found' });
            return;
        }
        res.json({ success: true, data: event });
    }
    catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch event' });
    }
};
exports.getEvent = getEvent;
const createEvent = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'User not authenticated' });
            return;
        }
        const created = await prisma_1.default.event.create({
            data: {
                ...req.body,
                organizerId: userId,
                attendees: { connect: [] }
            },
            include: includeEventRelations
        });
        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            data: created
        });
    }
    catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ success: false, message: 'Failed to create event' });
    }
};
exports.createEvent = createEvent;
const updateEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.user?.id;
        const event = await prisma_1.default.event.findUnique({ where: { id: eventId } });
        if (!event) {
            res.status(404).json({ success: false, message: 'Event not found' });
            return;
        }
        if (event.organizerId !== userId && !isAdminRole(req.user?.role)) {
            res.status(403).json({ success: false, message: 'Not authorized to update this event' });
            return;
        }
        const updated = await prisma_1.default.event.update({
            where: { id: eventId },
            data: req.body,
            include: includeEventRelations
        });
        res.json({ success: true, message: 'Event updated successfully', data: updated });
    }
    catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ success: false, message: 'Failed to update event' });
    }
};
exports.updateEvent = updateEvent;
const deleteEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.user?.id;
        const event = await prisma_1.default.event.findUnique({ where: { id: eventId } });
        if (!event) {
            res.status(404).json({ success: false, message: 'Event not found' });
            return;
        }
        if (event.organizerId !== userId && !isAdminRole(req.user?.role)) {
            res.status(403).json({ success: false, message: 'Not authorized to delete this event' });
            return;
        }
        await prisma_1.default.event.delete({ where: { id: eventId } });
        res.json({ success: true, message: 'Event deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ success: false, message: 'Failed to delete event' });
    }
};
exports.deleteEvent = deleteEvent;
const rsvpEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'User not authenticated' });
            return;
        }
        const event = await prisma_1.default.event.findUnique({
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
        const updated = await prisma_1.default.event.update({
            where: { id: eventId },
            data: { attendees: { connect: { id: userId } } },
            include: includeEventRelations
        });
        res.json({ success: true, message: 'RSVP successful', data: updated });
    }
    catch (error) {
        console.error('Error RSVP to event:', error);
        res.status(500).json({ success: false, message: 'Failed to RSVP to event' });
    }
};
exports.rsvpEvent = rsvpEvent;
const cancelRsvp = async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'User not authenticated' });
            return;
        }
        const event = await prisma_1.default.event.findUnique({
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
        const updated = await prisma_1.default.event.update({
            where: { id: eventId },
            data: { attendees: { disconnect: { id: userId } } },
            include: includeEventRelations
        });
        res.json({ success: true, message: 'RSVP cancelled successfully', data: updated });
    }
    catch (error) {
        console.error('Error cancelling RSVP:', error);
        res.status(500).json({ success: false, message: 'Failed to cancel RSVP' });
    }
};
exports.cancelRsvp = cancelRsvp;
const getUserEvents = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'User not authenticated' });
            return;
        }
        const events = await prisma_1.default.event.findMany({
            where: { attendees: { some: { id: userId } } },
            include: includeEventRelations,
            orderBy: { date: 'asc' }
        });
        res.json({ success: true, data: events });
    }
    catch (error) {
        console.error('Error fetching user events:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch user events' });
    }
};
exports.getUserEvents = getUserEvents;
//# sourceMappingURL=eventController.js.map