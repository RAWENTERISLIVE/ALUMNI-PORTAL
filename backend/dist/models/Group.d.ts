import { Document, Types } from 'mongoose';
export declare enum GroupPrivacy {
    PUBLIC = "public",
    PRIVATE = "private"
}
export interface IGroup extends Document {
    name: string;
    description: string;
    creator: Types.ObjectId;
    members: Types.ObjectId[];
    admins: Types.ObjectId[];
    pendingRequests: Types.ObjectId[];
    privacy: GroupPrivacy;
    memberCount: number;
    category?: string;
    tags: string[];
    avatar?: string;
    coverImage?: string;
    rules?: string;
    isActive: boolean;
    lastActivity: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: import("mongoose").Model<IGroup, {}, {}, {}, Document<unknown, {}, IGroup, {}> & IGroup & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Group.d.ts.map