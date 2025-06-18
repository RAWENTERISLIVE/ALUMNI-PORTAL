import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}
export declare const createPost: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getAllPosts: (req: Request, res: Response) => Promise<void>;
export declare const getPostById: (req: Request, res: Response) => Promise<void>;
export declare const updatePost: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deletePost: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const likePost: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const toggleFeaturePost: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getFeaturedPosts: (req: Request, res: Response) => Promise<void>;
export declare const getSchoolUpdates: (req: Request, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=postController.d.ts.map