export interface ServiceItem {
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  imageUrl: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  /** Display string shown on service card/page e.g. "Starting from ₹2,799" */
  startingPrice: string;
  /** Pre-filled WhatsApp message for this service */
  whatsappMessage: string;
}

export const SERVICE_CATALOG: ServiceItem[] = [
  {
    slug: 'deep-cleaning',
    title: 'Deep Cleaning Services',
    shortDescription: 'Thorough cleaning for homes, offices, and post-renovation spaces.',
    description: 'Our deep cleaning services go beyond regular cleaning to deliver a thorough, top-to-bottom transformation of your space. We meticulously clean hard-to-reach areas, remove stubborn stains, grease, and accumulated dust, and sanitize high-touch surfaces such as switches, handles, and countertops. Using advanced equipment and eco-friendly chemicals, we eliminate harmful bacteria, allergens, and odors, ensuring a hygienic, fresh, and healthier living or working environment.',
    imageUrl: '/assets/images/deep-clean.webp',
    metaTitle: 'Deep Cleaning Services in Pune | APK Elite Services',
    metaDescription: 'Professional deep cleaning services in Pune for homes, offices, and commercial spaces with trusted eco-friendly methods.',
    keywords: 'deep cleaning Pune, home deep cleaning Pune, office deep cleaning Pune',
    startingPrice: 'Starting from ₹2,799',
    whatsappMessage: 'Hi%2C%20I%20need%20a%20Deep%20Cleaning%20quote%20for%20my%20home%20in%20Pune.%20Please%20share%20availability%20and%20pricing.+%5BRef%3A+Web%2Fdeep-cleaning%5D'
  },
  {
    slug: 'facade-cleaning',
    title: 'Facade Cleaning Services',
    shortDescription: 'Restore building exteriors with safe and effective facade cleaning.',
    description: 'Our facade cleaning services are designed to restore and maintain the external beauty of your building. We remove dirt, pollution, algae, and stains from surfaces including glass, metal, and stone. Using advanced techniques such as high-pressure jet cleaning and rope-access methods, our trained professionals ensure safe, efficient, and damage-free cleaning. This not only enhances the building\'s appearance but also increases its lifespan and value.',
    imageUrl: '/assets/images/facade-clean.webp',
    metaTitle: 'Facade Cleaning Services in Pune | APK Elite Services',
    metaDescription: 'Professional facade cleaning for homes and commercial buildings in Pune, using safe and efficient methods.',
    keywords: 'facade cleaning Pune, building exterior cleaning Pune',
    startingPrice: 'Get a free quote',
    whatsappMessage: 'Hi%2C%20I%20need%20a%20Facade%20Cleaning%20quote%20for%20my%20building%20in%20Pune.%20Please%20share%20availability%20and%20pricing.+%5BRef%3A+Web%2Ffacade-cleaning%5D'
  },
  {
    slug: 'floor-polishing',
    title: 'Floor Polishing Services',
    shortDescription: 'Bring back the shine and durability of marble, granite, and tiles.',
    description: 'We provide expert floor polishing services to bring back the original shine and durability of your flooring. Whether it is marble, granite, vitrified tiles, or wooden floors, we use high-grade polishing compounds and modern machines to remove scratches, stains, and dullness. Our process enhances surface smoothness, adds a glossy finish, and protects your floors from future wear and tear.',
    imageUrl: '/assets/images/floor-clean.webp',
    metaTitle: 'Floor Polishing Services Pune | APK Elite Services',
    metaDescription: 'Revive marble, granite, tile, and wooden floors with expert polishing services in Pune.',
    keywords: 'floor polishing Pune, marble polishing Pune, granite polishing Pune',
    startingPrice: 'Starting from ₹1,999',
    whatsappMessage: 'Hi%2C%20I%20need%20a%20Floor%20Polishing%20quote%20for%20my%20property%20in%20Pune.%20Please%20share%20availability%20and%20pricing.+%5BRef%3A+Web%2Ffloor-polishing%5D'
  },
  {
    slug: 'water-tank-cleaning',
    title: 'Tank Cleaning Services',
    shortDescription: 'Safe and hygienic tank cleaning with certified cleaning methods.',
    description: 'Our professional tank cleaning services ensure safe and hygienic water storage by removing sludge, dirt, and harmful contaminants. We follow a multi-step process including draining, scrubbing, vacuum cleaning, and disinfection using safe and approved chemicals. This prevents bacterial growth and ensures clean, safe water for everyday use.',
    imageUrl: '/assets/images/tank-clean.webp',
    metaTitle: 'Water Tank Cleaning Services Pune | APK Elite Services',
    metaDescription: 'Hygienic water tank cleaning services in Pune for homes and commercial properties.',
    keywords: 'water tank cleaning Pune, tank cleaning services Pune, overhead tank cleaning',
    startingPrice: 'Starting from ₹2,499',
    whatsappMessage: 'Hi%2C%20I%20need%20a%20Water%20Tank%20Cleaning%20quote%20in%20Pune.%20Please%20share%20availability%20and%20pricing.+%5BRef%3A+Web%2Fwater-tank-cleaning%5D'
  },
  {
    slug: 'office-cleaning',
    title: 'Office Cleaning Services',
    shortDescription: 'Reliable office and commercial cleaning solutions for productive spaces.',
    description: 'We offer comprehensive office cleaning services to maintain a clean, organized, and productive workspace. Our services include dusting, vacuuming, floor cleaning, sanitizing workstations, and maintaining common areas such as meeting rooms and restrooms. A clean office boosts employee productivity, promotes health, and leaves a lasting impression on clients and visitors.',
    imageUrl: '/assets/images/office-clean.webp',
    metaTitle: 'Office Cleaning Services in Pune | APK Elite Services',
    metaDescription: 'Trusted office cleaning services in Pune for corporate spaces, coworking spaces, and commercial facilities.',
    keywords: 'office cleaning Pune, commercial cleaning Pune, janitorial services Pune',
    startingPrice: 'Starting from ₹3,999/month',
    whatsappMessage: 'Hi%2C%20I%20need%20an%20Office%20Cleaning%20quote%20for%20my%20workplace%20in%20Pune.%20Please%20share%20availability%20and%20pricing.+%5BRef%3A+Web%2Foffice-cleaning%5D'
  },
  {
    slug: 'post-construction-cleaning',
    title: 'Post Construction Cleaning Services',
    shortDescription: 'Leave your newly renovated space spotless and move-in ready.',
    description: 'Our post-construction cleaning services prepare your property for immediate use after construction or renovation. We remove debris, fine dust, paint stains, adhesive residues, and construction waste from all surfaces. Our team ensures detailed cleaning of floors, walls, windows, and fixtures, leaving your space spotless, safe, and ready to occupy.',
    imageUrl: '/assets/images/post-construction.webp',
    metaTitle: 'Post Construction Cleaning Pune | APK Elite Services',
    metaDescription: 'Post construction cleaning services in Pune for homes, offices, and renovated projects.',
    keywords: 'post construction cleaning Pune, renovation cleaning Pune',
    startingPrice: 'Starting from ₹4,999',
    whatsappMessage: 'Hi%2C%20I%20need%20a%20Post-Construction%20Cleaning%20quote%20for%20my%20property%20in%20Pune.%20Please%20share%20availability%20and%20pricing.+%5BRef%3A+Web%2Fpost-construction-cleaning%5D'
  },
  {
    slug: 'pest-control',
    title: 'Pest Control Services',
    shortDescription: 'Safe pest management for homes, offices, and commercial spaces.',
    description: 'Our pest control services provide effective solutions to eliminate and prevent infestations of termites, cockroaches, rodents, and other pests. We use safe, eco-friendly, and government-approved chemicals to ensure the safety of your family and employees. Regular pest control helps protect property, maintain hygiene, and create a healthy environment.',
    imageUrl: '/assets/images/pest-control.webp',
    metaTitle: 'Pest Control Services Pune | APK Elite Services',
    metaDescription: 'Professional pest control services in Pune for homes and businesses with safe treatments.',
    keywords: 'pest control Pune, cockroach control Pune, termite control Pune',
    startingPrice: 'Starting from ₹899',
    whatsappMessage: 'Hi%2C%20I%20need%20a%20Pest%20Control%20quote%20for%20my%20home%20in%20Pune.%20Please%20share%20availability%20and%20pricing.+%5BRef%3A+Web%2Fpest-control%5D'
  },
  {
    slug: 'sanitization',
    title: 'Home & Office Sanitization Services',
    shortDescription: 'Advanced sanitization that protects people and spaces.',
    description: 'We provide advanced sanitization services for homes and offices to eliminate germs, viruses, and bacteria. Using hospital-grade disinfectants and fogging machines, we ensure deep sanitization of all surfaces, including high-contact areas. This service is ideal for maintaining hygiene during health-sensitive situations and ensuring a safe environment.',
    imageUrl: '/assets/images/home-sanitization.webp',
    metaTitle: 'Sanitization Services Pune | APK Elite Services',
    metaDescription: 'Reliable sanitization services in Pune for homes, clinics, and office spaces.',
    keywords: 'sanitization Pune, disinfecting services Pune, virus sanitization Pune',
    startingPrice: 'Starting from ₹1,499',
    whatsappMessage: 'Hi%2C%20I%20need%20a%20Sanitization%20quote%20for%20my%20home%20in%20Pune.%20Please%20share%20availability%20and%20pricing.+%5BRef%3A+Web%2Fsanitization%5D'
  },
  {
    slug: 'carpet-cleaning',
    title: 'Carpet Cleaning Services',
    shortDescription: 'Refresh carpets and improve indoor air quality with deep carpet cleaning.',
    description: 'Our carpet cleaning services effectively remove deep-seated dirt, dust, stains, and allergens from your carpets. We use steam cleaning and advanced extraction techniques to restore freshness, improve indoor air quality, and extend the life of your carpets. Your carpets will look cleaner, smell fresher, and feel softer.',
    imageUrl: '/assets/images/carppet-clean.webp',
    metaTitle: 'Carpet Cleaning Services Pune | APK Elite Services',
    metaDescription: 'Professional carpet cleaning in Pune for homes and offices using deep-cleaning extraction methods.',
    keywords: 'carpet cleaning Pune, sofa shampooing Pune, upholstery cleaning Pune',
    startingPrice: 'Starting from ₹499',
    whatsappMessage: 'Hi%2C%20I%20need%20a%20Carpet%20Cleaning%20quote%20in%20Pune.%20Please%20share%20availability%20and%20pricing.+%5BRef%3A+Web%2Fcarpet-cleaning%5D'
  },
  {
    slug: 'chair-shampooing',
    title: 'Chair Shampooing / Cleaning Services',
    shortDescription: 'Clean and refresh office chairs and upholstered furniture.',
    description: 'We offer specialized chair cleaning and shampooing services for office and home furniture. Our process removes stains, dust, and bacteria while preserving fabric quality. Using safe cleaning solutions and advanced tools, we ensure deep cleaning, quick drying, and a fresh, hygienic seating experience.',
    imageUrl: '/assets/images/chair-sampooing.webp',
    metaTitle: 'Chair Shampooing Services Pune | APK Elite Services',
    metaDescription: 'Chair shampooing and upholstery cleaning services in Pune for homes and business spaces.',
    keywords: 'chair cleaning Pune, chair shampooing Pune, upholstery cleaning Pune',
    startingPrice: 'Starting from ₹199/chair',
    whatsappMessage: 'Hi%2C%20I%20need%20a%20Chair%20Cleaning%20quote%20in%20Pune.%20Please%20share%20availability%20and%20pricing.+%5BRef%3A+Web%2Fchair-shampooing%5D'
  },
  {
    slug: 'sofa-cleaning',
    title: 'Sofa Shampooing / Cleaning Services',
    shortDescription: 'Restore your sofas with fabric-safe and effective deep cleaning.',
    description: 'Our sofa cleaning services restore the beauty and hygiene of your furniture by removing dirt, stains, allergens, and odors. We use fabric-safe and leather-friendly cleaning methods to ensure deep cleaning without damage. This improves comfort, appearance, and the lifespan of your sofas.',
    imageUrl: '/assets/images/Sofacleaning.webp',
    metaTitle: 'Sofa Cleaning Services Pune | APK Elite Services',
    metaDescription: 'Sofa shampooing and upholstery cleaning in Pune with safe, professional care for fabric and leather.',
    keywords: 'sofa cleaning Pune, sofa shampooing Pune, upholstery cleaning Pune',
    startingPrice: 'Starting from ₹199/seat',
    whatsappMessage: 'Hi%2C%20I%20need%20a%20Sofa%20Cleaning%20quote%20in%20Pune.%20Please%20share%20availability%20and%20pricing.+%5BRef%3A+Web%2Fsofa-cleaning%5D'
  },
  {
    slug: 'gardening',
    title: 'Gardening Services',
    shortDescription: 'Keep your outdoor spaces attractive and well maintained.',
    description: 'Our gardening services help you create and maintain beautiful outdoor spaces. From lawn care and plant maintenance to landscaping and seasonal planting, we ensure your garden remains healthy, vibrant, and well-maintained. We focus on enhancing aesthetics while promoting sustainable plant growth.',
    imageUrl: '/assets/images/garden-clean.webp',
    metaTitle: 'Gardening Services Pune | APK Elite Services',
    metaDescription: 'Professional gardening and landscaping services in Pune to keep your outdoor spaces beautiful.',
    keywords: 'gardening Pune, landscaping Pune, garden maintenance Pune',
    startingPrice: 'Starting from ₹1,499/visit',
    whatsappMessage: 'Hi%2C%20I%20need%20a%20Gardening%20Services%20quote%20in%20Pune.%20Please%20share%20availability%20and%20pricing.+%5BRef%3A+Web%2Fgardening%5D'
  }
];

export function getServiceBySlug(slug: string | null): ServiceItem | undefined {
  if (!slug) return undefined;
  const target = slug.endsWith('-pune') ? slug.replace(/-pune$/, '') : slug;
  return SERVICE_CATALOG.find((service) => service.slug === target || service.slug === slug);
}
