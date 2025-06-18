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
}, {
  timestamps: true,
});

// Update memberCount when members array changes
GroupSchema.pre('save', function(this: IGroup, next) {
  this.memberCount = this.members.length;
  this.lastActivity = new Date();
  
  // Make sure creator is always a member
  if (this.creator && !this.members.includes(this.creator)) {
    this.members.push(this.creator);
  }
  
  next();
});

export default model<IGroup>('Group', GroupSchema);
