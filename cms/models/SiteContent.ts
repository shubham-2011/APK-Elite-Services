import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IServiceConfig {
  slug: string;
  title: string;
  startingPrice: string;
  shortDescription: string;
  isActive: boolean;
}

export interface IFAQItem {
  question: string;
  answer: string;
}

export interface ISiteContent extends Document {
  companyName: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  businessHours: string;
  promoBanner: {
    enabled: boolean;
    text: string;
    discountPercent: number;
  };
  formConfig: {
    modalTitle: string;
    modalSubtitle: string;
    localities: string[];
    services: string[];
  };
  services: IServiceConfig[];
  faqs: IFAQItem[];
  updatedAt: Date;
}

const ServiceConfigSchema = new Schema<IServiceConfig>({
  slug: { type: String, required: true },
  title: { type: String, required: true },
  startingPrice: { type: String, required: true },
  shortDescription: { type: String, required: true },
  isActive: { type: Boolean, default: true },
});

const FAQItemSchema = new Schema<IFAQItem>({
  question: { type: String, required: true },
  answer: { type: String, required: true },
});

const SiteContentSchema = new Schema<ISiteContent>(
  {
    companyName: { type: String, default: 'APK Elite Services' },
    phone: { type: String, default: '+91 88301 67863' },
    whatsapp: { type: String, default: '918830167863' },
    email: { type: String, default: 'info@apkeliteservices.in' },
    address: { type: String, default: 'Pune, Maharashtra 411032' },
    businessHours: { type: String, default: 'Monday - Sunday: 9:00 AM - 8:00 PM' },
    promoBanner: {
      enabled: { type: Boolean, default: true },
      text: { type: String, default: 'Festival Offer: Get Flat 15% OFF on Home Deep Cleaning!' },
      discountPercent: { type: Number, default: 15 },
    },
    formConfig: {
      modalTitle: { type: String, default: 'Request a Free Service Quote' },
      modalSubtitle: { type: String, default: 'Fill out your details below to send a quote request directly to our team.' },
      localities: {
        type: [String],
        default: [
          'Baner',
          'Wakad',
          'Hinjewadi',
          'Kharadi',
          'Viman Nagar',
          'Kothrud',
          'Aundh',
          'Hadapsar',
          'Bavdhan',
          'Pimple Saudagar',
          'Pimpri-Chinchwad',
          'Magarpatta',
          'Other Area'
        ],
      },
      services: {
        type: [String],
        default: [
          'Deep Cleaning',
          'Sofa Cleaning',
          'Office Cleaning',
          'Post Construction Cleaning',
          'Water Tank Cleaning',
          'Pest Control',
          'Floor Polishing',
          'Facade Cleaning',
          'Carpet Cleaning',
          'Sanitization'
        ],
      },
    },
    services: [ServiceConfigSchema],
    faqs: [FAQItemSchema],
  },
  { timestamps: true }
);

const SiteContent: Model<ISiteContent> =
  mongoose.models.SiteContent || mongoose.model<ISiteContent>('SiteContent', SiteContentSchema);

export default SiteContent;
