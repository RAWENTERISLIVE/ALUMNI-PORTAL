import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
  _id: string;
  title?: string;
  content: string;
  author: mongoose.Types.ObjectId;
  category: string;
  isFeatured: boolean;
  isSchoolUpdate: boolean;
  reactions: {
    userId: mongoose.Types.ObjectId;
    type: 'like' | 'love' | 'celebrate' | 'support' | 'insightful' | 'funny';
  }[];
  bookmarks: mongoose.Types.ObjectId[];
  comments: mongoose.Types.ObjectId[];
  commentCount: number;
  shareCount: number;
  visibility: 'public' | 'connections_only';
  tags: string[];
  externalLinks: string[];
  mentions?: mongoose.Types.ObjectId[];
  // Fields for shared posts
  sharedPost?: mongoose.Types.ObjectId;
  shareType?: 'quote' | 'simple';
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>({
  title: {
    type: String,
    maxlength: 200,
    trim: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000,
    trim: true
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['general', 'career', 'networking', 'events', 'achievements', 'announcements'],
    default: 'general'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isSchoolUpdate: {
    type: Boolean,
    default: false
  },
  // Shared post fields
  sharedPost: {
    type: Schema.Types.ObjectId,
    ref: 'Post'
  },
  shareType: {
    type: String,
    enum: ['quote', 'simple']
  },
  reactions: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['like', 'love', 'celebrate', 'support', 'insightful', 'funny'],
      default: 'like'
    }
  }],
  bookmarks: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  commentCount: {
    type: Number,
    default: 0
  },
  shareCount: {
    type: Number,
    default: 0
  },
  visibility: {
    type: String,
    enum: ['public', 'alumni_only', 'faculty_only', 'connections_only'],
    default: 'public'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  externalLinks: [{
    type: String,
    validate: {
      validator: function(url: string) {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      },
      message: 'External link must be a valid URL'
    }
  }],
  mentions: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ category: 1, createdAt: -1 });
postSchema.index({ visibility: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ isFeatured: 1, createdAt: -1 });
postSchema.index({ isSchoolUpdate: 1, createdAt: -1 });

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return this.reactions ? this.reactions.filter(r => r.type === 'like').length : 0;
});

// Virtual for bookmark count
postSchema.virtual('bookmarkCount').get(function() {
  return this.bookmarks ? this.bookmarks.length : 0;
});

// Export the model, checking if it already exists to avoid overwrite errors
export default mongoose.models.Post || mongoose.model<IPost>('Post', postSchema);
