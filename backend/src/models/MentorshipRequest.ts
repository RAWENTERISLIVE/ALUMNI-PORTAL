import mongoose, { Document, Schema, Types } from 'mongoose';

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

const mentorshipRequestSchema = new Schema<IMentorshipRequest>({
  mentorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  menteeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected', 'cancelled'], 
    default: 'pending' 
  },
  message: { type: String, maxlength: 500 },
  topics: [{ type: String, required: true }],
  preferredSchedule: { type: String },
  respondedAt: { type: Date }
}, {
  timestamps: true
});

// Ensure a user can't send multiple pending requests to the same mentor
mentorshipRequestSchema.index({ mentorId: 1, menteeId: 1, status: 1 });

const MentorshipRequest = mongoose.model<IMentorshipRequest>('MentorshipRequest', mentorshipRequestSchema);

export default MentorshipRequest;
