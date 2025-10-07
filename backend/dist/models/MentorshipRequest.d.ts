import mongoose, { Document, Types } from 'mongoose';
export interface IMentorshipRequest extends Document {
    _id: Types.ObjectId;
    mentorId: Types.ObjectId;
    menteeId: Types.ObjectId;
    status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
    message?: string;
    topics: string[];
    preferredSchedule?: string;
    createdAt: Date;
    updatedAt: Date;
    respondedAt?: Date;
}
declare const MentorshipRequest: mongoose.Model<IMentorshipRequest, {}, {}, {}, mongoose.Document<unknown, {}, IMentorshipRequest, {}> & IMentorshipRequest & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default MentorshipRequest;
//# sourceMappingURL=MentorshipRequest.d.ts.map