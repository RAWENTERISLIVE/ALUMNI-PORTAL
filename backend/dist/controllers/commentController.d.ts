import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: string;
        _id: string;
        role: string;
    };
}
export declare const createComment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getPostComments: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getCommentReplies: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const likeComment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const unlikeComment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteComment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=commentController.d.ts.map