import mongoose, { Document, Schema } from 'mongoose';

export enum ConnectionRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
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

const connectionRequestSchema = new Schema<IConnectionRequest>({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: Object.values(ConnectionRequestStatus),
    default: ConnectionRequestStatus.PENDING
  },
  message: {
    type: String,
    maxlength: 500,
    trim: true
  }
}, { timestamps: true });

// Compound index to prevent duplicate requests
connectionRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });

// Index for efficient querying
connectionRequestSchema.index({ receiver: 1, status: 1 });
connectionRequestSchema.index({ sender: 1, status: 1 });

const ConnectionRequest = mongoose.model<IConnectionRequest>('ConnectionRequest', connectionRequestSchema);

export default ConnectionRequest;
