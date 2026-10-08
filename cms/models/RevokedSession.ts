import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRevokedSession extends Document {
  sessionId: string;
  adminUsername: string;
  revokedAt: Date;
  expiresAt: Date;
}

const RevokedSessionSchema = new Schema<IRevokedSession>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    adminUsername: { type: String, required: true },
    revokedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // Auto-deleted by MongoDB TTL after expiry
  },
  { timestamps: false }
);

const RevokedSession: Model<IRevokedSession> =
  mongoose.models.RevokedSession || mongoose.model<IRevokedSession>('RevokedSession', RevokedSessionSchema);

export default RevokedSession;
