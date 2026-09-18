export interface SiteContentData {
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
  services: Array<{
    slug: string;
    title: string;
    startingPrice: string;
    shortDescription: string;
    isActive: boolean;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  updatedAt: string;
}

export const DEFAULT_SITE_CONTENT: SiteContentData = {
  companyName: 'APK Elite Services',
  phone: '+91 88301 67863',
  whatsapp: '918830167863',
  email: 'info@apkeliteservices.in',
  address: 'Pune, Maharashtra 411032',
  businessHours: 'Monday - Sunday: 9:00 AM - 8:00 PM',
  promoBanner: {
    enabled: true,
    text: 'Festival Offer: Get Flat 15% OFF on Home Deep Cleaning in Pune!',
    discountPercent: 15,
  },
  formConfig: {
    modalTitle: 'Request a Free Service Quote',
    modalSubtitle: 'Fill out your details below to receive an instant estimate on WhatsApp and Email.',
    localities: [
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
      'Koregaon Park',
      'Other Area',
    ],
    services: [
      'Deep Cleaning',
      'Sofa Cleaning',
      'Office Cleaning',
      'Post Construction Cleaning',
      'Water Tank Cleaning',
      'Pest Control',
      'Floor Polishing',
      'Facade Cleaning',
      'Carpet Cleaning',
      'Sanitization',
    ],
  },
  services: [
    {
      slug: 'deep-cleaning',
      title: 'Deep Cleaning Services',
      startingPrice: 'Starting from ₹2,799',
      shortDescription: 'Thorough cleaning for homes, offices, and post-renovation spaces with eco-friendly agents.',
      isActive: true,
    },
    {
      slug: 'sofa-cleaning',
      title: 'Sofa Cleaning Services',
      startingPrice: 'Starting from ₹999',
      shortDescription: 'Professional fabric and leather sofa extraction shampooing to remove stains and allergens.',
      isActive: true,
    },
    {
      slug: 'office-cleaning',
      title: 'Office Cleaning Services',
      startingPrice: 'Starting from ₹4,999',
      shortDescription: 'Commercial janitorial contracts and deep cleaning for IT parks, clinics, and offices.',
      isActive: true,
    },
    {
      slug: 'pest-control',
      title: 'Pest Control Services',
      startingPrice: 'Starting from ₹899',
      shortDescription: 'Odorless herbal gel pest control targeting cockroaches, termites, and bed bugs.',
      isActive: true,
    },
    {
      slug: 'water-tank-cleaning',
      title: 'Water Tank Cleaning',
      startingPrice: 'Starting from ₹799',
      shortDescription: '6-stage mechanized water tank and sump sanitization with UV treatment.',
      isActive: true,
    },
    {
      slug: 'floor-polishing',
      title: 'Floor Polishing Services',
      startingPrice: 'Starting from ₹1,999',
      shortDescription: 'Diamond pad polishing for marble, granite, and vitrified tiles.',
      isActive: true,
    },
  ],
  faqs: [
    {
      question: 'What is included in full home deep cleaning?',
      answer: 'Deep cleaning covers complete kitchen degreasing, bathroom scrubbing & descaling, balcony washing, floor scrubbing, door/window track vacuuming, and fan/switchboard wipe-down.',
    },
    {
      question: 'Which areas in Pune do you provide cleaning services?',
      answer: 'We cover all areas in Pune and PCMC including Baner, Wakad, Hinjewadi, Kharadi, Viman Nagar, Kothrud, Hadapsar, and Aundh.',
    },
    {
      question: 'Do you bring your own machines and chemicals?',
      answer: 'Yes, our 100% in-house team arrives equipped with industrial vacuum cleaners, single-disc scrubbers, and certified eco-friendly chemicals.',
    },
  ],
  updatedAt: new Date().toISOString(),
};
