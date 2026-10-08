import { z } from 'zod';

/**
 * Zod schema for updating Site Content.
 * Strictly disallows arbitrary unknown properties.
 */
export const SiteContentSchema = z.object({
  companyName: z.string().min(1).max(100),
  phone: z.string().min(5).max(30),
  whatsapp: z.string().min(5).max(30),
  email: z.string().email().max(100),
  address: z.string().max(250).optional().default('Pune, Maharashtra'),
  businessHours: z.string().max(100).optional().default('Mon - Sun: 8:00 AM - 9:00 PM'),
  promoBanner: z.object({
    enabled: z.boolean(),
    text: z.string().max(200),
    discountPercent: z.number().min(0).max(100),
  }),
  formConfig: z.object({
    modalTitle: z.string().max(150),
    modalSubtitle: z.string().max(250),
    localities: z.array(z.string().max(50)).max(50),
    services: z.array(z.string().max(80)).max(50),
    propertyTypes: z.array(z.string().max(50)).max(20).optional(),
  }),
  services: z.array(
    z.object({
      slug: z.string().max(80),
      title: z.string().max(100),
      startingPrice: z.string().max(50),
      shortDescription: z.string().max(300),
      isActive: z.boolean(),
    })
  ).max(50).optional(),
  faqs: z.array(
    z.object({
      question: z.string().max(200),
      answer: z.string().max(1000),
    })
  ).max(50).optional(),
  pricing: z.array(
    z.object({
      service: z.string().max(100),
      startingPrice: z.number().min(0).max(1000000),
      unit: z.string().max(50),
      active: z.boolean(),
    })
  ).max(50).optional(),
  showcase: z.object({
    heading: z.string().max(150),
    subheading: z.string().max(300),
    projects: z.array(
      z.object({
        title: z.string().max(150),
        location: z.string().max(100),
        category: z.string().max(100),
        imageUrl: z.string().max(500),
        description: z.string().max(500),
      })
    ).max(20),
  }).optional(),
  updatedAt: z.string().optional(),
}).strict(); // strictly rejects any unexpected/malicious keys

/**
 * Zod schema for Lead search & query params
 */
export const LeadQuerySchema = z.object({
  search: z.string().max(100).optional().default(''),
  status: z.enum(['ALL', 'NEW', 'CONTACTED', 'QUOTE_SENT', 'CONFIRMED', 'COMPLETED', 'LOST']).optional().default('ALL'),
  service: z.string().max(80).optional().default(''),
  locality: z.string().max(80).optional().default(''),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

/**
 * Zod schema for updating a Lead (PATCH)
 */
export const LeadUpdateSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'QUOTE_SENT', 'CONFIRMED', 'COMPLETED', 'LOST']).optional(),
  locality: z.string().max(100).optional(),
  service: z.string().max(100).optional(),
  propertyType: z.string().max(100).optional(),
  note: z.string().max(1000).optional(),
  author: z.string().max(50).optional(),
}).strict();
