import mongoose, { Document, Schema } from 'mongoose';

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

const reportSchema = new Schema<IReport>({
  type: {
    type: String,
    enum: ['user', 'post', 'comment', 'group', 'job', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  reason: {
    type: String,
    required: true,
    enum: [
      'spam',
      'harassment',
      'inappropriate_content',
      'misinformation',
      'copyright_violation',
      'fake_profile',
      'violence',
      'hate_speech',
      'other'
    ]
  },
  reportedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedUser: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  reportedPost: {
    type: Schema.Types.ObjectId,
    ref: 'Post'
  },
  reportedComment: {
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  },
  reportedGroup: {
    type: Schema.Types.ObjectId,
    ref: 'Group'
  },
  reportedJob: {
    type: Schema.Types.ObjectId,
    ref: 'Job'
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    maxlength: 500
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better performance
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reportedBy: 1 });
reportSchema.index({ type: 1 });

const Report = mongoose.model<IReport>('Report', reportSchema);
export default Report;
