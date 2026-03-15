import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getEvents: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getUpcomingEvents: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getEvent: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createEvent: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateEvent: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteEvent: (req: AuthRequest, res: Response) => Promise<void>;
export declare const rsvpEvent: (req: AuthRequest, res: Response) => Promise<void>;
export declare const cancelRsvp: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getEventAttendees: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getUserEvents: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=eventController.d.ts.map