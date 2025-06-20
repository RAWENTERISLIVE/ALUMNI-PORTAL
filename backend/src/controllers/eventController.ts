import { Response } from 'express';
import Event from '../models/Event';
import { AuthRequest } from '../middleware/auth';

// Get all events with pagination and filtering
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

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = {};
    
    if (category) query.category = category;
    if (status) query.status = status;
    if (isSchoolEvent !== undefined) query.isSchoolEvent = isSchoolEvent === 'true';
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    const events = await Event.find(query)
      .populate('organizer', 'name email profileImage role')
      .populate('attendees', 'name profileImage')
      .sort({ date: 1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Event.countDocuments(query);
    const pages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: events,
      pagination: { page: pageNum, limit: limitNum, total, pages }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events'
    });
  }
};

// Get upcoming events for dashboard
export const getUpcomingEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    
    const events = await Event.find({
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
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming events'
    });
  }
};

// Get single event
export const getEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId)
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
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event'
    });
  }
};

// Create new event
export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const event = new Event(eventData);
    await event.save();

    const populatedEvent = await Event.findById(event._id)
      .populate('organizer', 'name email profileImage role');

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: populatedEvent
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event'
    });
  }
};

// Update event
export const updateEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id;

    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found'
      });
      return;
    }

    // Check if user is organizer or admin
    if (event.organizer.toString() !== userId && req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      res.status(403).json({
        success: false,
        message: 'Not authorized to update this event'
      });
      return;
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      { ...req.body },
      { new: true, runValidators: true }
    ).populate('organizer', 'name email profileImage role');

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: updatedEvent
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event'
    });
  }
};

// Delete event
export const deleteEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id;

    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found'
      });
      return;
    }

    // Check if user is organizer or admin
    if (event.organizer.toString() !== userId && req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      res.status(403).json({
        success: false,
        message: 'Not authorized to delete this event'
      });
      return;
    }

    await Event.findByIdAndDelete(eventId);

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event'
    });
  }
};

// RSVP to event
export const rsvpEvent = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found'
      });
      return;
    }

    // Check if event is full
    if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
      res.status(400).json({
        success: false,
        message: 'Event is full'
      });
      return;
    }

    // Check if user already RSVP'd
    if (event.attendees.includes(userId as any)) {
      res.status(400).json({
        success: false,
        message: 'You have already RSVP\'d to this event'
      });
      return;
    }

    event.attendees.push(userId as any);
    await event.save();

    const updatedEvent = await Event.findById(eventId)
      .populate('organizer', 'name email profileImage role')
      .populate('attendees', 'name profileImage');

    res.json({
      success: true,
      message: 'RSVP successful',
      data: updatedEvent
    });
  } catch (error) {
    console.error('Error RSVP to event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to RSVP to event'
    });
  }
};

// Cancel RSVP
export const cancelRsvp = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found'
      });
      return;
    }

    // Check if user has RSVP'd
    if (!event.attendees.includes(userId as any)) {
      res.status(400).json({
        success: false,
        message: 'You have not RSVP\'d to this event'
      });
      return;
    }

    event.attendees = event.attendees.filter(attendee => attendee.toString() !== userId);
    await event.save();

    const updatedEvent = await Event.findById(eventId)
      .populate('organizer', 'name email profileImage role')
      .populate('attendees', 'name profileImage');

    res.json({
      success: true,
      message: 'RSVP cancelled successfully',
      data: updatedEvent
    });
  } catch (error) {
    console.error('Error cancelling RSVP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel RSVP'
    });
  }
};

// Get user's RSVP'd events
export const getUserEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const events = await Event.find({
      attendees: userId
    })
      .populate('organizer', 'name email profileImage role')
      .sort({ date: 1 });

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Error fetching user events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user events'
    });
  }
};
