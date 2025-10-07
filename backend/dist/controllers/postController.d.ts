import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const createPost: (req: AuthRequest, res: Response) => Promise<any>;
export declare const getAllPosts: (req: Request, res: Response) => Promise<any>;
export declare const getPostById: (req: Request, res: Response) => Promise<any>;
export declare const updatePost: (req: AuthRequest, res: Response) => Promise<any>;
export declare const deletePost: (req: AuthRequest, res: Response) => Promise<any>;
export declare const likePost: (req: AuthRequest, res: Response) => Promise<any>;
export declare const bookmarkPost: (req: AuthRequest, res: Response) => Promise<any>;
export declare const sharePost: (req: AuthRequest, res: Response) => Promise<any>;
export declare const getFeedPosts: (req: AuthRequest, res: Response) => Promise<any>;
export declare const getBookmarkedPosts: (req: AuthRequest, res: Response) => Promise<any>;
export declare const getFeaturedPosts: (req: Request, res: Response) => Promise<any>;
export declare const getSchoolUpdates: (req: Request, res: Response) => Promise<any>;
export declare const toggleFeaturePost: (req: AuthRequest, res: Response) => Promise<any>;
//# sourceMappingURL=postController.d.ts.map