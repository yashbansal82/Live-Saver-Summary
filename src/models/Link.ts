import mongoose from 'mongoose';

export interface ILink extends mongoose.Document {
  url: string;
  title: string;
  favicon: string;
  summary: string;
  userId: mongoose.Types.ObjectId;
  tags: string[];
  order: number;
}

const linkSchema = new mongoose.Schema({
  url: {
    type: String,
    required: [true, 'URL is required'],
    trim: true,
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  favicon: {
    type: String,
    trim: true,
  },
  summary: {
    type: String,
    trim: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  order: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Link || mongoose.model<ILink>('Link', linkSchema); 