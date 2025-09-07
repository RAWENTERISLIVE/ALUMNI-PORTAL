import mongoose, { Document } from 'mongoose';
export interface IFile extends Document {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    path: string;
    url: string;
    uploadedBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
declare const File: mongoose.Model<IFile, {}, {}, {}, mongoose.Document<unknown, {}, IFile, {}> & IFile & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default File;
//# sourceMappingURL=File.d.ts.map