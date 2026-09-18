import mongoose, { Schema, Document, Model } from 'mongoose';

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUOTE_SENT' | 'CONFIRMED' | 'COMPLETED' | 'LOST';

export interface ILeadNote {
  note: string;
  author?: string;
  createdAt: Date;
}

export interface ILead extends Document {
  name: string;
  phone: string;
  email?: string;
  service: string;
  locality?: string;
  propertyType?: string;
  message?: string;
  source: string;
  status: LeadStatus;
  notes: ILeadNote[];
  createdAt: Date;
  updatedAt: Date;
}

const LeadNoteSchema = new Schema<ILeadNote>({
  note: { type: String, required: true },
  author: { type: String, default: 'Staff' },
  createdAt: { type: Date, default: Date.now },
});

const LeadSchema = new Schema<ILead>(
  {
    name: { type: String, required: [true, 'Customer name is required'], trim: true },
    phone: { type: String, required: [true, 'Phone number is required'], trim: true },
    email: { type: String, trim: true, lowercase: true },
    service: { type: String, default: 'General Inquiry', trim: true },
    locality: { type: String, default: 'Pune', trim: true },
    propertyType: { type: String, trim: true },
    message: { type: String, trim: true },
    source: { type: String, default: 'quote_modal', trim: true },
    status: {
      type: String,
      enum: ['NEW', 'CONTACTED', 'QUOTE_SENT', 'CONFIRMED', 'COMPLETED', 'LOST'],
      default: 'NEW',
    },
    notes: [LeadNoteSchema],
  },
  {
    timestamps: true,
  }
);

// Indexes for fast searching and filtering in CMS
LeadSchema.index({ createdAt: -1 });
LeadSchema.index({ phone: 1 });
LeadSchema.index({ status: 1 });
LeadSchema.index({ service: 1 });
LeadSchema.index({ locality: 1 });

const Lead: Model<ILead> = mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);

export default Lead;
