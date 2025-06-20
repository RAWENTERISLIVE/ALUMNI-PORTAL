import { Document, Schema, model, Types } from 'mongoose';

export enum GroupPrivacy {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

export interface IGroup extends Document {
  name: string;
  description: string;
  creator: Types.ObjectId;
  members: Types.ObjectId[];
  privacy: GroupPrivacy;
  memberCount: number;
  category?: string;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema: Schema = new Schema<IGroup>({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  privacy: {
    type: String,
    enum: Object.values(GroupPrivacy),
    default: GroupPrivacy.PUBLIC,
  },
  category: {
    type: String,
    default: 'professional',
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
});

// Virtual field to get member count dynamically
GroupSchema.virtual('totalMembers').get(function() {
  return this.members ? (this.members as Types.ObjectId[]).length : 0;
});

// Ensure virtuals are included in JSON
GroupSchema.set('toJSON', {
  virtuals: true
});

GroupSchema.set('toObject', {
  virtuals: true
});

// Update lastActivity when members array changes
GroupSchema.pre('save', function(this: IGroup, next) {
  this.lastActivity = new Date();
  
  // Make sure creator is always a member
  if (this.creator && !this.members.includes(this.creator)) {
    this.members.push(this.creator);
  }
  
  next();
});

export default model<IGroup>('Group', GroupSchema);
