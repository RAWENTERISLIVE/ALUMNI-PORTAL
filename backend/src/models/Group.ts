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
  admins: Types.ObjectId[];
  pendingRequests: Types.ObjectId[];
  privacy: GroupPrivacy;
  memberCount: number;
  category?: string;
  tags: string[];
  avatar?: string;
  coverImage?: string;
  rules?: string;
  isActive: boolean;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Method signatures
  addMember(userId: Types.ObjectId): Promise<IGroup>;
  removeMember(userId: Types.ObjectId): Promise<IGroup>;
  addAdmin(userId: Types.ObjectId): Promise<IGroup>;
  isAdmin(userId: Types.ObjectId): boolean;
  isMember(userId: Types.ObjectId): boolean;
}

const GroupSchema: Schema = new Schema<IGroup>({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
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
  admins: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  pendingRequests: [{
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
    enum: ['professional', 'academic', 'social', 'tech', 'career', 'batch', 'alumni', 'networking', 'hobby'],
    default: 'professional',
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  avatar: {
    type: String,
    default: null
  },
  coverImage: {
    type: String,
    default: null
  },
  rules: {
    type: String,
    maxlength: [2000, 'Rules cannot be more than 2000 characters']
  },
  isActive: {
    type: Boolean,
    default: true
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
  
  // Make sure creator is always a member and admin
  if (this.creator && !this.members.includes(this.creator)) {
    this.members.push(this.creator);
  }
  
  if (this.creator && !this.admins.includes(this.creator)) {
    this.admins.push(this.creator);
  }
  
  next();
});

// Add methods for group management
GroupSchema.methods.addMember = function(userId: Types.ObjectId) {
  if (!this.members.includes(userId)) {
    this.members.push(userId);
    // Remove from pending requests if exists
    this.pendingRequests = this.pendingRequests.filter(
      (id: Types.ObjectId) => !id.equals(userId)
    );
    this.lastActivity = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

GroupSchema.methods.removeMember = function(userId: Types.ObjectId) {
  this.members = this.members.filter((id: Types.ObjectId) => !id.equals(userId));
  this.admins = this.admins.filter((id: Types.ObjectId) => !id.equals(userId));
  this.lastActivity = new Date();
  return this.save();
};

GroupSchema.methods.addAdmin = function(userId: Types.ObjectId) {
  if (this.members.includes(userId) && !this.admins.includes(userId)) {
    this.admins.push(userId);
    return this.save();
  }
  throw new Error('User must be a member to become admin');
};

GroupSchema.methods.isAdmin = function(userId: Types.ObjectId) {
  return this.admins.some((id: Types.ObjectId) => id.equals(userId));
};

GroupSchema.methods.isMember = function(userId: Types.ObjectId) {
  return this.members.some((id: Types.ObjectId) => id.equals(userId));
};

export default model<IGroup>('Group', GroupSchema);
