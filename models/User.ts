import mongoose, { Schema, models, model } from 'mongoose';

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String },
    role: { type: String, enum: ['admin', 'editor', 'client'], default: 'client' },
    company: String,
    phone: String,
    avatar: String,
  },
  { timestamps: true }
);

export type IUser = mongoose.InferSchemaType<typeof UserSchema> & { _id: string };
export const User = models.User || model('User', UserSchema);
