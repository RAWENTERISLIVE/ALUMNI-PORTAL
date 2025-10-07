import mongoose, { Document } from 'mongoose';
export interface IComment extends Document {
    content: string;
    author: mongoose.Types.ObjectId;
    post: mongoose.Types.ObjectId;
    parentComment?: mongoose.Types.ObjectId;
    likes: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}
declare const Comment: mongoose.Model<IComment, {}, {}, {}, mongoose.Document<unknown, {}, IComment, {}> & IComment & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default Comment;
//# sourceMappingURL=Comment.d.ts.map