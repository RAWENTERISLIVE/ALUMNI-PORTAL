"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserEvents = exports.cancelRsvp = exports.rsvpEvent = exports.deleteEvent = exports.updateEvent = exports.createEvent = exports.getEvent = exports.getUpcomingEvents = exports.getEvents = void 0;
const Event_1 = __importDefault(require("../models/Event"));
const mongoose_1 = require("mongoose");
const getEvents = async (req, res) => {
    try {
        const { page = 1, limit = 10, category, status = 'upcoming', isSchoolEvent, search, startDate, endDate } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const query = {};
        if (category)
            query.category = category;
        if (status)
            query.status = status;
        if (isSchoolEvent !== undefined)
            query.isSchoolEvent = isSchoolEvent === 'true';
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } }
            ];
        }
        if (startDate || endDate) {
            query.date = {};
            if (startDate)
                query.date.$gte = new Date(startDate);
            if (endDate)
                query.date.$lte = new Date(endDate);
        }
        const events = await Event_1.default.find(query)
            .populate('organizer', 'name email profileImage role')
            .populate('attendees', 'name profileImage')
            .sort({ date: 1 })
            .skip(skip)
            .limit(limitNum);
        const total = await Event_1.default.countDocuments(query);
        const pages = Math.ceil(total / limitNum);
        res.json({
            success: true,
            data: events,
            pagination: { page: pageNum, limit: limitNum, total, pages }
        });
    }
    catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch events'
        });
    }
};
exports.getEvents = getEvents;
const getUpcomingEvents = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const events = await Event_1.default.find({
            status: 'upcoming',
            date: { $gte: new Date() }
        })
            .populate('organizer', 'name email profileImage role')
            .populate('attendees', 'name profileImage')
            .sort({ date: 1 })
            .limit(limit);
        res.json({
            success: true,
            data: events
        });
    }
    catch (error) {
        console.error('Error fetching upcoming events:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch upcoming events'
        });
    }
};
exports.getUpcomingEvents = getUpcomingEvents;
const getEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const event = await Event_1.default.findById(eventId)
            .populate('organizer', 'name email profileImage role classYear')
            .populate('attendees', 'name profileImage role classYear');
        if (!event) {
            res.status(404).json({
                success: false,
                message: 'Event not found'
            });
            return;
        }
        res.json({
            success: true,
            data: event
        });
    }
    catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch event'
        });
    }
};
exports.getEvent = getEvent;
const createEvent = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }
        const eventData = {
            ...req.body,
            organizer: userId
        };
        const event = new Event_1.default(eventData);
        await event.save();
        const populatedEvent = await Event_1.default.findById(event._id)
            .populate('organizer', 'name email profileImage role');
        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            data: populatedEvent
        });
    }
    catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create event'
        });
    }
};
exports.createEvent = createEvent;
const updateEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.user?.id;
        const event = await Event_1.default.findById(eventId);
        if (!event) {
            res.status(404).json({
                success: false,
                message: 'Event not found'
            });
            return;
        }
        if (event.organizer.toString() !== userId && req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
            res.status(403).json({
                success: false,
                message: 'Not authorized to update this event'
            });
            return;
        }
        const updatedEvent = await Event_1.default.findByIdAndUpdate(eventId, { ...req.body }, { new: true, runValidators: true }).populate('organizer', 'name email profileImage role');
        res.json({
            success: true,
            message: 'Event updated successfully',
            data: updatedEvent
        });
    }
    catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update event'
        });
    }
};
exports.updateEvent = updateEvent;
const deleteEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.user?.id;
        const event = await Event_1.default.findById(eventId);
        if (!event) {
            res.status(404).json({
                success: false,
                message: 'Event not found'
            });
            return;
        }
        if (event.organizer.toString() !== userId && req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
            res.status(403).json({
                success: false,
                message: 'Not authorized to delete this event'
            });
            return;
        }
        await Event_1.default.findByIdAndDelete(eventId);
        res.json({
            success: true,
            message: 'Event deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete event'
        });
    }
};
exports.deleteEvent = deleteEvent;
const rsvpEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }
        const event = await Event_1.default.findById(eventId);
        if (!event) {
            res.status(404).json({
                success: false,
                message: 'Event not found'
            });
            return;
        }
        if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
            res.status(400).json({
                success: false,
                message: 'Event is full'
            });
            return;
        }
        if (event.attendees.includes(new mongoose_1.Types.ObjectId(userId))) {
            res.status(400).json({
                success: false,
                message: 'You have already RSVP\'d to this event'
            });
            return;
        }
        event.attendees.push(new mongoose_1.Types.ObjectId(userId));
        await event.save();
        const updatedEvent = await Event_1.default.findById(eventId)
            .populate('organizer', 'name email profileImage role')
            .populate('attendees', 'name profileImage');
        res.json({
            success: true,
            message: 'RSVP successful',
            data: updatedEvent
        });
    }
    catch (error) {
        console.error('Error RSVP to event:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to RSVP to event'
        });
    }
};
exports.rsvpEvent = rsvpEvent;
const cancelRsvp = async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }
        const event = await Event_1.default.findById(eventId);
        if (!event) {
            res.status(404).json({
                success: false,
                message: 'Event not found'
            });
            return;
        }
        if (!event.attendees.includes(new mongoose_1.Types.ObjectId(userId))) {
            res.status(400).json({
                success: false,
                message: 'You have not RSVP\'d to this event'
            });
            return;
        }
        event.attendees = event.attendees.filter(attendee => attendee.toString() !== userId);
        await event.save();
        const updatedEvent = await Event_1.default.findById(eventId)
            .populate('organizer', 'name email profileImage role')
            .populate('attendees', 'name profileImage');
        res.json({
            success: true,
            message: 'RSVP cancelled successfully',
            data: updatedEvent
        });
    }
    catch (error) {
        console.error('Error cancelling RSVP:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel RSVP'
        });
    }
};
exports.cancelRsvp = cancelRsvp;
const getUserEvents = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }
        const events = await Event_1.default.find({
            attendees: userId
        })
            .populate('organizer', 'name email profileImage role')
            .sort({ date: 1 });
        res.json({
            success: true,
            data: events
        });
    }
    catch (error) {
        console.error('Error fetching user events:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user events'
        });
    }
};
exports.getUserEvents = getUserEvents;
//# sourceMappingURL=eventController.js.map