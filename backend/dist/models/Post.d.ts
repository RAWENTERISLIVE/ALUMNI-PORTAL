import mongoose, { Document } from 'mongoose';
export interface IPost extends Document {
    _id: string;
    title?: string;
    content: string;
    author: mongoose.Types.ObjectId;
    category?: string;
    imageUrl?: string;
    isFeatured: boolean;
    isSchoolUpdate: boolean;
    likes: mongoose.Types.ObjectId[];
    comments: mongoose.Types.ObjectId[];
    visibility: 'public' | 'alumni_only' | 'private';
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}
declare const Post: mongoose.Model<IPost, {}, {}, {}, mongoose.Document<unknown, {}, IPost, {}> & IPost & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
export default Post;
//# sourceMappingURL=Post.d.ts.map