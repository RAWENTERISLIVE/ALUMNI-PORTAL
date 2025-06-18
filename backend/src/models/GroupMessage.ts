import mongoose, { Document, Schema } from 'mongoose';

export interface IGroupMessage extends Document {
  group: mongoose.Schema.Types.ObjectId;
  author: mongoose.Schema.Types.ObjectId;
  content: string;
  messageType: 'text' | 'image' | 'file';
  attachments?: string[];
  replyTo?: mongoose.Schema.Types.ObjectId;
  reactions: {
    emoji: string;
    users: mongoose.Schema.Types.ObjectId[];
  }[];
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
}

const GroupMessageSchema: Schema = new Schema({
  group: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  messageType: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
  attachments: [{ type: String }],
  replyTo: { type: Schema.Types.ObjectId, ref: 'GroupMessage' },
  reactions: [{
    emoji: { type: String, required: true },
    users: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  }],
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IGroupMessage>('GroupMessage', GroupMessageSchema);
