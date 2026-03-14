import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: string;
    };
}
export declare const getMentors: (_req: Request, res: Response) => Promise<void>;
export declare const becomeMentor: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getMentorshipProfile: (req: AuthRequest, res: Response) => Promise<void>;
export declare const requestMentorship: (req: AuthRequest, res: Response) => Promise<void>;
export declare const respondToRequest: (req: AuthRequest, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=mentorshipController.d.ts.map