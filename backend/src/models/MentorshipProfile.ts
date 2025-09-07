import mongoose, { Document, Schema } from 'mongoose';

export interface IMentorshipProfile extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  isMentor: boolean;
  isSeekingMentor: boolean;
  
  // Mentor profile fields
  expertise: string[];
  experience: string;
  industry: string;
  company?: string;
  position?: string;
  yearsOfExperience: number;
  bio: string;
  availability: 'high' | 'medium' | 'low';
  preferredMenteeLevel: ('student' | 'new_graduate' | 'early_career' | 'mid_career')[];
  maxMentees: number;
  currentMentees: number;
  
  // Mentee profile fields
  careerGoals?: string[];
  currentLevel: 'student' | 'new_graduate' | 'early_career' | 'mid_career';
  interestedFields: string[];
  mentorshipGoals: string;
  preferredMentorExperience: string;
  
  // Common fields
  communicationPreferences: ('video_call' | 'phone_call' | 'text_messages' | 'email' | 'in_person')[];
  timezone: string;
  linkedInUrl?: string;
  portfolioUrl?: string;
  
  isActive: boolean;
  rating: number;
  totalRatings: number;
  successfulMatches: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const mentorshipProfileSchema = new Schema<IMentorshipProfile>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  isMentor: {
    type: Boolean,
    default: false
  },
  isSeekingMentor: {
    type: Boolean,
    default: false
  },
  
  // Mentor fields
  expertise: [{
    type: String,
    maxlength: 50,
    trim: true
  }],
  experience: {
    type: String,
    maxlength: 2000,
    trim: true
  },
  industry: {
    type: String,
    maxlength: 100,
    trim: true
  },
  company: {
    type: String,
    maxlength: 100,
    trim: true
  },
  position: {
    type: String,
    maxlength: 100,
    trim: true
  },
  yearsOfExperience: {
    type: Number,
    min: 0,
    max: 50,
    default: 0
  },
  bio: {
    type: String,
    maxlength: 1000,
    trim: true,
    default: ''
  },
  availability: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  preferredMenteeLevel: [{
    type: String,
    enum: ['student', 'new_graduate', 'early_career', 'mid_career']
  }],
  maxMentees: {
    type: Number,
    min: 1,
    max: 20,
    default: 3
  },
  currentMentees: {
    type: Number,
    min: 0,
    default: 0
  },
  
  // Mentee fields
  careerGoals: [{
    type: String,
    maxlength: 100,
    trim: true
  }],
  currentLevel: {
    type: String,
    enum: ['student', 'new_graduate', 'early_career', 'mid_career']
  },
  interestedFields: [{
    type: String,
    maxlength: 50,
    trim: true
  }],
  mentorshipGoals: {
    type: String,
    maxlength: 1000,
    trim: true,
    default: ''
  },
  preferredMentorExperience: {
    type: String,
    maxlength: 500,
    trim: true,
    default: ''
  },
  
  // Common fields
  communicationPreferences: [{
    type: String,
    enum: ['video_call', 'phone_call', 'text_messages', 'email', 'in_person']
  }],
  timezone: {
    type: String,
    default: 'UTC'
  },
  linkedInUrl: {
    type: String,
    validate: {
      validator: function(url: string) {
        return !url || /^https?:\/\/(www\.)?linkedin\.com\//.test(url);
      },
      message: 'LinkedIn URL must be a valid LinkedIn profile URL'
    }
  },
  portfolioUrl: {
    type: String,
    validate: {
      validator: function(url: string) {
        return !url || /^https?:\/\//.test(url);
      },
      message: 'Portfolio URL must be a valid URL'
    }
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalRatings: {
    type: Number,
    min: 0,
    default: 0
  },
  successfulMatches: {
    type: Number,
    min: 0,
    default: 0
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

// Indexes for better performance
// Note: userId already has unique index from schema definition
mentorshipProfileSchema.index({ isMentor: 1, isActive: 1 });
mentorshipProfileSchema.index({ isSeekingMentor: 1, isActive: 1 });
mentorshipProfileSchema.index({ expertise: 1 });
mentorshipProfileSchema.index({ industry: 1 });
mentorshipProfileSchema.index({ currentLevel: 1 });
mentorshipProfileSchema.index({ interestedFields: 1 });
mentorshipProfileSchema.index({ rating: -1 });

const MentorshipProfile = mongoose.model<IMentorshipProfile>('MentorshipProfile', mentorshipProfileSchema);

export default MentorshipProfile;
