import mongoose, { Document, Schema, Types } from 'mongoose';

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

const jobApplicationSchema = new Schema<IJobApplication>({
  job: {
    type: Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  applicant: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coverLetter: {
    type: String,
    required: true,
    maxlength: 2000,
    trim: true
  },
  resumeUrl: {
    type: String,
    validate: {
      validator: function(url: string) {
        return !url || /^https?:\/\//.test(url) || url.startsWith('/uploads/');
      },
      message: 'Resume URL must be a valid URL or file path'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'shortlisted', 'rejected', 'accepted'],
    default: 'pending'
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    maxlength: 1000,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(_doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Prevent duplicate applications
jobApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

// Indexes for better performance
jobApplicationSchema.index({ applicant: 1 });
jobApplicationSchema.index({ job: 1 });
jobApplicationSchema.index({ status: 1 });
jobApplicationSchema.index({ appliedAt: -1 });

const JobApplication = mongoose.model<IJobApplication>('JobApplication', jobApplicationSchema);

export default JobApplication;
