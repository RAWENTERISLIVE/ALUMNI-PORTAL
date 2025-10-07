import mongoose, { Document } from 'mongoose';
export interface IReport extends Document {
    _id: string;
    type: 'user' | 'post' | 'comment' | 'group' | 'job' | 'other';
    description: string;
    reason: string;
    reportedBy: mongoose.Types.ObjectId;
    reportedUser?: mongoose.Types.ObjectId;
    reportedPost?: mongoose.Types.ObjectId;
    reportedComment?: mongoose.Types.ObjectId;
    reportedGroup?: mongoose.Types.ObjectId;
    reportedJob?: mongoose.Types.ObjectId;
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
    adminNotes?: string;
    reviewedBy?: mongoose.Types.ObjectId;
    reviewedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const Report: mongoose.Model<IReport, {}, {}, {}, mongoose.Document<unknown, {}, IReport, {}> & IReport & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
export default Report;
//# sourceMappingURL=Report.d.ts.map