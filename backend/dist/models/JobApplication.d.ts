import mongoose, { Document, Types } from 'mongoose';
export interface IJobApplication extends Document {
    _id: string;
    job: Types.ObjectId;
    applicant: Types.ObjectId;
    coverLetter: string;
    resumeUrl?: string;
    status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'accepted';
    appliedAt: Date;
    reviewedAt?: Date;
    reviewedBy?: Types.ObjectId;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const JobApplication: mongoose.Model<IJobApplication, {}, {}, {}, mongoose.Document<unknown, {}, IJobApplication, {}> & IJobApplication & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
export default JobApplication;
//# sourceMappingURL=JobApplication.d.ts.map