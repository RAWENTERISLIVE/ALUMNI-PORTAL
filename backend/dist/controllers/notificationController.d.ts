import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: string;
    };
}
export declare const getNotifications: (req: AuthRequest, res: Response) => Promise<void>;
export declare const markNotificationSeen: (req: AuthRequest, res: Response) => Promise<void>;
export declare const markAllNotificationsSeen: (req: AuthRequest, res: Response) => Promise<void>;
export declare const dismissNotification: (req: AuthRequest, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=notificationController.d.ts.map