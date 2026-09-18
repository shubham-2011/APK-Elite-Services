import mongoose, { Schema, Document, Model } from 'mongoose';

export type DeviceType = 'mobile' | 'desktop' | 'tablet';

export interface IFootmark extends Document {
  visitorId: string;
  sessionId: string;
  path: string;
  pageTitle: string;
  referrer: string;
  device: DeviceType;
  browser: string;
  os?: string;
  city: string;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FootmarkSchema = new Schema<IFootmark>(
  {
    visitorId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    path: { type: String, required: true, default: '/', trim: true },
    pageTitle: { type: String, default: 'APK Elite Services', trim: true },
    referrer: { type: String, default: 'Direct', trim: true },
    device: {
      type: String,
      enum: ['mobile', 'desktop', 'tablet'],
      default: 'mobile',
    },
    browser: { type: String, default: 'Chrome', trim: true },
    os: { type: String, default: 'Android', trim: true },
    city: { type: String, default: 'Pune', trim: true },
    ip: { type: String, default: 'anonymous' },
    userAgent: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

// High performance indexes for traffic analysis and footmark queries
FootmarkSchema.index({ createdAt: -1 });
FootmarkSchema.index({ path: 1 });
FootmarkSchema.index({ visitorId: 1, createdAt: -1 });
FootmarkSchema.index({ device: 1 });
FootmarkSchema.index({ referrer: 1 });

const Footmark: Model<IFootmark> = mongoose.models.Footmark || mongoose.model<IFootmark>('Footmark', FootmarkSchema);

export default Footmark;
