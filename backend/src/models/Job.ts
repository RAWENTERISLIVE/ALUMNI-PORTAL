import mongoose, { Document, Schema } from 'mongoose';

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

const jobSchema = new Schema<IJob>({
  title: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true
  },
  company: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true
  },
  location: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true
  },
  type: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance'],
    required: true
  },
  salaryRange: {
    min: {
      type: Number,
      min: 0
    },
    max: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD',
      maxlength: 3
    }
  },
  description: {
    type: String,
    required: true,
    maxlength: 3000,
    trim: true
  },
  requirements: [{
    type: String,
    maxlength: 200,
    trim: true
  }],
  benefits: [{
    type: String,
    maxlength: 200,
    trim: true
  }],
  postedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  postedByName: {
    type: String,
    required: true
  },
  applicationUrl: {
    type: String,
    validate: {
      validator: function(url: string) {
        return !url || /^https?:\/\//.test(url);
      },
      message: 'Application URL must be a valid URL'
    }
  },
  contactEmail: {
    type: String,
    validate: {
      validator: function(email: string) {
        return !email || /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
      },
      message: 'Please enter a valid contact email address'
    }
  },
  isAlumniReferral: {
    type: Boolean,
    default: true
  },
  applicationDeadline: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  applicationCount: {
    type: Number,
    default: 0,
    min: 0
  },
  savedBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  tags: [{
    type: String,
    maxlength: 50,
    trim: true
  }]
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

// Indexes for better performance
jobSchema.index({ postedBy: 1 });
jobSchema.index({ type: 1 });
jobSchema.index({ location: 1 });
jobSchema.index({ isActive: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ applicationDeadline: 1 });
jobSchema.index({ tags: 1 });
jobSchema.index({ company: 1 });

const Job = mongoose.model<IJob>('Job', jobSchema);

export default Job;
