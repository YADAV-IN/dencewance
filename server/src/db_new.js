import mongoose from 'mongoose';

// User Account / Profile Scheme
export const UserProfileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  handle: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  avatar_url: { type: String, default: '' },
  bio: { type: String, default: '' },
  followers_count: { type: Number, default: 0 },
  following_count: { type: Number, default: 0 },
  is_verified: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

// Independent Comments Scheme for Reels
export const ReelCommentSchema = new mongoose.Schema({
  reel_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Reel', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'UserProfile', required: true }, /* The user who commented */
  author_name: { type: String, required: true },
  author_handle: { type: String, required: true },
  author_avatar: { type: String, default: '' },
  text: { type: String, required: true, trim: true },
  likes_count: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Saved / Bookmarked Reels List
export const SavedReelSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'UserProfile', required: true },
  reel_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Reel', required: true },
  saved_at: { type: Date, default: Date.now }
});

ReelCommentSchema.index({ reel_id: 1, created_at: -1 });
SavedReelSchema.index({ user_id: 1, reel_id: 1 }, { unique: true });
