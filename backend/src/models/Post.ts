import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
  _id: string;
  title?: string;
  content: string;
  author: mongoose.Types.ObjectId;
  category?: string;
  imageUrl?: string;
  isFeatured: boolean;
  isSchoolUpdate: boolean;
  likes: mongoose.Types.ObjectId[];
  comments: mongoose.Types.ObjectId[];
  visibility: 'public' | 'alumni_only' | 'private';
  tags: string[];
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
  imageUrl: {
    type: String,
    validate: {
      validator: function(url: string) {
        return !url || url === '' || /^https?:\/\//.test(url);
      },
      message: 'Image URL must be a valid URL'
    }
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isSchoolUpdate: {
    type: Boolean,
    default: false
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  visibility: {
    type: String,
    enum: ['public', 'alumni_only', 'private'],
    default: 'alumni_only'
  },
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
postSchema.index({ author: 1 });
postSchema.index({ category: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ isFeatured: 1 });
postSchema.index({ isSchoolUpdate: 1 });
postSchema.index({ tags: 1 });
postSchema.index({ visibility: 1 });

const Post = mongoose.model<IPost>('Post', postSchema);

export default Post;
