import mongoose, { Document } from 'mongoose';
export interface IJob extends Document {
    _id: string;
    title: string;
    company: string;
    location: string;
    type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance';
    salaryRange?: {
        min: number;
        max: number;
        currency: string;
    };
    description: string;
    requirements: string[];
    benefits?: string[];
    postedBy: mongoose.Types.ObjectId;
    postedByName: string;
    applicationUrl?: string;
    contactEmail?: string;
    isAlumniReferral: boolean;
    applicationDeadline?: Date;
    isActive: boolean;
    applicationCount: number;
    savedBy: mongoose.Types.ObjectId[];
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}
declare const Job: mongoose.Model<IJob, {}, {}, {}, mongoose.Document<unknown, {}, IJob, {}> & IJob & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
export default Job;
//# sourceMappingURL=Job.d.ts.map