import mongoose, { Document } from 'mongoose';
export declare enum ConnectionRequestStatus {
    PENDING = "pending",
    ACCEPTED = "accepted",
    REJECTED = "rejected"
}
export interface IConnectionRequest extends Document {
    _id: string;
    sender: mongoose.Types.ObjectId;
    receiver: mongoose.Types.ObjectId;
    status: ConnectionRequestStatus;
    message?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const ConnectionRequest: mongoose.Model<IConnectionRequest, {}, {}, {}, mongoose.Document<unknown, {}, IConnectionRequest, {}> & IConnectionRequest & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
export default ConnectionRequest;
//# sourceMappingURL=ConnectionRequest.d.ts.map