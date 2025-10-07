import mongoose, { Document } from 'mongoose';
export interface IPost extends Document {
    _id: string;
    title?: string;
    content: string;
    author: mongoose.Types.ObjectId;
    category: string;
    isFeatured: boolean;
    isSchoolUpdate: boolean;
    reactions: {
        userId: mongoose.Types.ObjectId;
        type: 'like' | 'love' | 'celebrate' | 'support' | 'insightful' | 'funny';
    }[];
    bookmarks: mongoose.Types.ObjectId[];
    comments: mongoose.Types.ObjectId[];
    commentCount: number;
    shareCount: number;
    visibility: 'public' | 'connections_only';
    tags: string[];
    externalLinks: string[];
    mentions?: mongoose.Types.ObjectId[];
    sharedPost?: mongoose.Types.ObjectId;
    shareType?: 'quote' | 'simple';
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any> | mongoose.Model<IPost, {}, {}, {}, mongoose.Document<unknown, {}, IPost, {}> & IPost & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Post.d.ts.map