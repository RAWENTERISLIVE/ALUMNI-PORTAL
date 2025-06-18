import mongoose, { Document } from 'mongoose';
export interface IGroupMessage extends Document {
    group: mongoose.Schema.Types.ObjectId;
    author: mongoose.Schema.Types.ObjectId;
    content: string;
    messageType: 'text' | 'image' | 'file';
    attachments?: string[];
    replyTo?: mongoose.Schema.Types.ObjectId;
    reactions: {
        emoji: string;
        users: mongoose.Schema.Types.ObjectId[];
    }[];
    isEdited: boolean;
    editedAt?: Date;
    createdAt: Date;
}
declare const _default: mongoose.Model<IGroupMessage, {}, {}, {}, mongoose.Document<unknown, {}, IGroupMessage, {}> & IGroupMessage & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=GroupMessage.d.ts.map