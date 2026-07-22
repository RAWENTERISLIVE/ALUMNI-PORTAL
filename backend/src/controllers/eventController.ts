/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response } from "express";
import prisma from "../config/prisma";
import { AuthRequest } from "../middleware/auth";

const includeEventRelations = {
  organizer: {
    select: {
      id: true,
      name: true,
      email: true,
      profileImage: true,
      role: true,
    },
  },
  attendees: {
    select: { id: true, name: true, profileImage: true, role: true },
  },
};

const isAdminRole = (role?: string) => {
  const normalized = (role || "").toLowerCase();
  return normalized === "admin" || normalized === "super_admin";
};

export const getEvents = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      status = "upcoming",
      isSchoolEvent,
      search,
      startDate,
      endDate,
    } = req.query;

    const pageNum = Number.parseInt(page as string, 10) || 1;
    const limitNum = Number.parseInt(limit as string, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (category) where.category = String(category);
    if (status) where.status = String(status);
    if (isSchoolEvent !== undefined)
      where.isSchoolEvent = isSchoolEvent === "true";

    if (search) {
      const searchValue = String(search);
      where.OR = [
        { title: { contains: searchValue, mode: "insensitive" } },
        { description: { contains: searchValue, mode: "insensitive" } },
        { location: { contains: searchValue, mode: "insensitive" } },
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
        orderBy: { date: "asc" },
        skip,
        take: limitNum,
      }),
      prisma.event.count({ where }),
    ]);

    res.json({
      success: true,
      data: events,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ success: false, message: "Failed to fetch events" });
  }
};

export const getUpcomingEvents = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const limit = Number.parseInt(req.query.limit as string, 10) || 5;

    const events = await prisma.event.findMany({
      where: {
        status: "upcoming",
        date: { gte: new Date() },
      },
      include: includeEventRelations,
      orderBy: { date: "asc" },
      take: limit,
    });

    res.json({ success: true, data: events });
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch upcoming events" });
  }
};

export const getEvent = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const eventId = String(req.params.eventId || "");

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: includeEventRelations,
    });

    if (!event) {
      res.status(404).json({ success: false, message: "Event not found" });
      return;
    }

    res.json({ success: true, data: event });
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ success: false, message: "Failed to fetch event" });
  }
};

export const createEvent = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
      return;
    }

    // Input validation for required fields
    const title =
      typeof req.body.title === "string" ? req.body.title.trim() : "";
    const description =
      typeof req.body.description === "string"
        ? req.body.description.trim()
        : "";
    const time = typeof req.body.time === "string" ? req.body.time.trim() : "";
    const location =
      typeof req.body.location === "string" ? req.body.location.trim() : "";

    if (!title || !description || !req.body.date || !time || !location) {
      res
        .status(400)
        .json({ success: false, message: "Missing required event fields" });
      return;
    }

    const eventDate = new Date(req.body.date);
    if (Number.isNaN(eventDate.getTime())) {
      res
        .status(400)
        .json({ success: false, message: "Invalid start date format" });
      return;
    }

    let eventEndDate: Date | null = null;
    if (req.body.endDate) {
      eventEndDate = new Date(req.body.endDate);
      if (Number.isNaN(eventEndDate.getTime())) {
        res
          .status(400)
          .json({ success: false, message: "Invalid end date format" });
        return;
      }
    }

    let maxAttendeesVal: number | null = null;
    if (
      req.body.maxAttendees !== undefined &&
      req.body.maxAttendees !== null &&
      req.body.maxAttendees !== ""
    ) {
      const parsed = Number.parseInt(String(req.body.maxAttendees), 10);
      if (Number.isNaN(parsed) || parsed < 0) {
        res
          .status(400)
          .json({ success: false, message: "Invalid maxAttendees value" });
        return;
      }
      maxAttendeesVal = parsed;
    }

    const isVirtualVal =
      typeof req.body.isVirtual === "boolean" ? req.body.isVirtual : false;
    const meetingLinkVal =
      typeof req.body.meetingLink === "string"
        ? req.body.meetingLink.trim()
        : null;
    const categoryVal =
      typeof req.body.category === "string"
        ? req.body.category.trim()
        : "other";
    const imageUrlVal =
      typeof req.body.imageUrl === "string" ? req.body.imageUrl.trim() : null;
    const isSchoolEventVal =
      typeof req.body.isSchoolEvent === "boolean"
        ? req.body.isSchoolEvent
        : false;

    let tagsVal: string[] = [];
    if (Array.isArray(req.body.tags)) {
      tagsVal = req.body.tags
        .filter((t: any): t is string => typeof t === "string")
        .map((t: string) => t.trim());
    }

    const created = await prisma.event.create({
      data: {
        title,
        description,
        date: eventDate,
        endDate: eventEndDate,
        time,
        location,
        maxAttendees: maxAttendeesVal,
        isVirtual: isVirtualVal,
        meetingLink: meetingLinkVal,
        category: categoryVal,
        imageUrl: imageUrlVal,
        isSchoolEvent: isSchoolEventVal,
        tags: tagsVal,
        organizerId: userId,
        status: "upcoming",
        attendees: { connect: [] },
      },
      include: includeEventRelations,
    });

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: created,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ success: false, message: "Failed to create event" });
  }
};

export const updateEvent = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const eventId = String(req.params.eventId || "");
    const userId = req.user?.id;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      res.status(404).json({ success: false, message: "Event not found" });
      return;
    }

    if (event.organizerId !== userId && !isAdminRole(req.user?.role)) {
      res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to update this event",
        });
      return;
    }

    const updateData: any = {};

    if (req.body.title !== undefined) {
      const title =
        typeof req.body.title === "string" ? req.body.title.trim() : "";
      if (!title) {
        res
          .status(400)
          .json({ success: false, message: "Title cannot be empty" });
        return;
      }
      updateData.title = title;
    }

    if (req.body.description !== undefined) {
      const description =
        typeof req.body.description === "string"
          ? req.body.description.trim()
          : "";
      if (!description) {
        res
          .status(400)
          .json({ success: false, message: "Description cannot be empty" });
        return;
      }
      updateData.description = description;
    }

    if (req.body.date !== undefined) {
      const eventDate = new Date(req.body.date);
      if (Number.isNaN(eventDate.getTime())) {
        res
          .status(400)
          .json({ success: false, message: "Invalid start date format" });
        return;
      }
      updateData.date = eventDate;
    }

    if (req.body.endDate !== undefined) {
      if (req.body.endDate === null || req.body.endDate === "") {
        updateData.endDate = null;
      } else {
        const eventEndDate = new Date(req.body.endDate);
        if (Number.isNaN(eventEndDate.getTime())) {
          res
            .status(400)
            .json({ success: false, message: "Invalid end date format" });
          return;
        }
        updateData.endDate = eventEndDate;
      }
    }

    if (req.body.time !== undefined) {
      const time =
        typeof req.body.time === "string" ? req.body.time.trim() : "";
      if (!time) {
        res
          .status(400)
          .json({ success: false, message: "Time cannot be empty" });
        return;
      }
      updateData.time = time;
    }

    if (req.body.location !== undefined) {
      const location =
        typeof req.body.location === "string" ? req.body.location.trim() : "";
      if (!location) {
        res
          .status(400)
          .json({ success: false, message: "Location cannot be empty" });
        return;
      }
      updateData.location = location;
    }

    if (req.body.maxAttendees !== undefined) {
      if (req.body.maxAttendees === null || req.body.maxAttendees === "") {
        updateData.maxAttendees = null;
      } else {
        const parsed = Number.parseInt(String(req.body.maxAttendees), 10);
        if (Number.isNaN(parsed) || parsed < 0) {
          res
            .status(400)
            .json({ success: false, message: "Invalid maxAttendees value" });
          return;
        }
        updateData.maxAttendees = parsed;
      }
    }

    if (req.body.isVirtual !== undefined) {
      updateData.isVirtual = !!req.body.isVirtual;
    }

    if (req.body.meetingLink !== undefined) {
      updateData.meetingLink =
        typeof req.body.meetingLink === "string"
          ? req.body.meetingLink.trim()
          : null;
    }

    if (req.body.category !== undefined) {
      updateData.category =
        typeof req.body.category === "string"
          ? req.body.category.trim()
          : "other";
    }

    if (req.body.imageUrl !== undefined) {
      updateData.imageUrl =
        typeof req.body.imageUrl === "string" ? req.body.imageUrl.trim() : null;
    }

    if (req.body.isSchoolEvent !== undefined) {
      updateData.isSchoolEvent = !!req.body.isSchoolEvent;
    }

    if (req.body.tags !== undefined) {
      if (Array.isArray(req.body.tags)) {
        updateData.tags = req.body.tags
          .filter((t: any): t is string => typeof t === "string")
          .map((t: string) => t.trim());
      } else {
        res
          .status(400)
          .json({ success: false, message: "Tags must be an array" });
        return;
      }
    }

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: includeEventRelations,
    });

    res.json({
      success: true,
      message: "Event updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ success: false, message: "Failed to update event" });
  }
};

export const deleteEvent = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const eventId = String(req.params.eventId || "");
    const userId = req.user?.id;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      res.status(404).json({ success: false, message: "Event not found" });
      return;
    }

    if (event.organizerId !== userId && !isAdminRole(req.user?.role)) {
      res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to delete this event",
        });
      return;
    }

    await prisma.event.delete({ where: { id: eventId } });

    res.json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ success: false, message: "Failed to delete event" });
  }
};

export const rsvpEvent = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const eventId = String(req.params.eventId || "");
    const userId = req.user?.id;

    if (!userId) {
      res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
      return;
    }

    const event = (await prisma.event.findUnique({
      where: { id: eventId },
      include: { attendees: { select: { id: true } } },
    })) as any;

    if (!event) {
      res.status(404).json({ success: false, message: "Event not found" });
      return;
    }

    if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
      res.status(400).json({ success: false, message: "Event is full" });
      return;
    }

    if (event.attendees.some((attendee: any) => attendee.id === userId)) {
      res
        .status(400)
        .json({
          success: false,
          message: "You have already RSVP'd to this event",
        });
      return;
    }

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: { attendees: { connect: { id: userId } } },
      include: includeEventRelations,
    });

    res.json({ success: true, message: "RSVP successful", data: updated });
  } catch (error) {
    console.error("Error RSVP to event:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to RSVP to event" });
  }
};

export const cancelRsvp = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const eventId = String(req.params.eventId || "");
    const userId = req.user?.id;

    if (!userId) {
      res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
      return;
    }

    const event = (await prisma.event.findUnique({
      where: { id: eventId },
      include: { attendees: { select: { id: true } } },
    })) as any;

    if (!event) {
      res.status(404).json({ success: false, message: "Event not found" });
      return;
    }

    if (!event.attendees.some((attendee: any) => attendee.id === userId)) {
      res
        .status(400)
        .json({ success: false, message: "You have not RSVP'd to this event" });
      return;
    }

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: { attendees: { disconnect: { id: userId } } },
      include: includeEventRelations,
    });

    res.json({
      success: true,
      message: "RSVP cancelled successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error cancelling RSVP:", error);
    res.status(500).json({ success: false, message: "Failed to cancel RSVP" });
  }
};

export const getEventAttendees = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const eventId = String(req.params.eventId || "");
    const userId = req.user?.id;

    if (!eventId) {
      res.status(400).json({ success: false, message: "Event ID is required" });
      return;
    }

    if (!userId) {
      res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
      return;
    }

    const event = (await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        attendees: {
          select: {
            id: true,
            name: true,
            email: true,
            contactPhone: true,
            contactEmail: true,
            admissionNumber: true,
          },
        },
      },
    })) as any;

    if (!event) {
      res.status(404).json({ success: false, message: "Event not found" });
      return;
    }

    if (event.organizerId !== userId && !isAdminRole(req.user?.role)) {
      res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to view attendees for this event",
        });
      return;
    }

    const attendees = event.attendees.map((attendee: any) => ({
      id: attendee.id,
      name: attendee.name,
      email: attendee.contactEmail || attendee.email,
      phone: attendee.contactPhone,
      admissionNumber: attendee.admissionNumber,
    }));

    res.json({ success: true, data: attendees });
  } catch (error) {
    console.error("Error fetching event attendees:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch event attendees" });
  }
};

export const getUserEvents = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
      return;
    }

    const events = await prisma.event.findMany({
      where: { attendees: { some: { id: userId } } },
      include: includeEventRelations,
      orderBy: { date: "asc" },
    });

    res.json({ success: true, data: events });
  } catch (error) {
    console.error("Error fetching user events:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch user events" });
  }
};
