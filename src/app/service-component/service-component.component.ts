import { CommonModule, NgOptimizedImage, isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, ViewChild, Inject, PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-service-component',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, RouterLink],
  templateUrl: './service-component.component.html',
  styleUrl: './service-component.component.css'
})
export class ServiceComponentComponent {
  toggle(service: any) {
  this.arr.forEach(s => {
    if (s !== service) s.expanded = false;
  });
  service.expanded = !service.expanded;
}
  arr: any[] = [
  {
    title: "Deep Cleaning Services",
    slug: 'deep-cleaning',
    badge: '🔥 Most Booked in Pune',
    description: "Our deep cleaning services go beyond regular cleaning to deliver a thorough, top-to-bottom transformation of your space. We meticulously clean hard-to-reach areas, remove stubborn stains, grease, and accumulated dust, and sanitize high-touch surfaces such as switches, handles, and countertops. Using advanced equipment and eco-friendly chemicals, we eliminate harmful bacteria, allergens, and odors, ensuring a hygienic, fresh, and healthier living or working environment.",
    imageUrl: "/assets/images/deep-clean.webp",
    expanded: false
  },
  {
    title: "Facade Cleaning Services",
    slug: 'facade-cleaning',
    description: "Our facade cleaning services are designed to restore and maintain the external beauty of your building. We remove dirt, pollution, algae, and stains from surfaces including glass, metal, and stone. Using advanced techniques such as high-pressure jet cleaning and rope-access methods, our trained professionals ensure safe, efficient, and damage-free cleaning. This not only enhances the building’s appearance but also increases its lifespan and value.",
    imageUrl: "/assets/images/facade-clean.webp",
    expanded: false
  },
  {
    title: "Floor Polishing Services",
    slug: 'floor-polishing',
    badge: '⭐ 5-Star Rated',
    description: "We provide expert floor polishing services to bring back the original shine and durability of your flooring. Whether it's marble, granite, vitrified tiles, or wooden floors, we use high-grade polishing compounds and modern machines to remove scratches, stains, and dullness. Our process enhances surface smoothness, adds a glossy finish, and protects your floors from future wear and tear.",
    imageUrl: "/assets/images/floor-clean.webp",
    expanded: false
  },
  {
    title: "Tank Cleaning Services",
    slug: 'water-tank-cleaning',
    description: "Our professional tank cleaning services ensure safe and hygienic water storage by removing sludge, dirt, and harmful contaminants. We follow a multi-step process including draining, scrubbing, vacuum cleaning, and disinfection using safe and approved chemicals. This prevents bacterial growth and ensures clean, safe water for everyday use.",
    imageUrl: "/assets/images/tank-clean.webp",
    expanded: false
  },
  {
    title: "Office Cleaning Services",
    slug: 'office-cleaning',
    badge: '🏢 Top B2B Pick',
    description: "We offer comprehensive office cleaning services to maintain a clean, organized, and productive workspace. Our services include dusting, vacuuming, floor cleaning, sanitizing workstations, and maintaining common areas such as meeting rooms and restrooms. A clean office boosts employee productivity, promotes health, and leaves a lasting impression on clients and visitors.",
    imageUrl: "/assets/images/office-clean.webp",
    expanded: false
  },
  {
    title: "Post Construction Cleaning Services",
    slug: 'post-construction-cleaning',
    description: "Our post-construction cleaning services prepare your property for immediate use after construction or renovation. We remove debris, fine dust, paint stains, adhesive residues, and construction waste from all surfaces. Our team ensures detailed cleaning of floors, walls, windows, and fixtures, leaving your space spotless, safe, and ready to occupy.",
    imageUrl: "/assets/images/post-construction.webp",
    expanded: false
  },
  {
    title: "Pest Control Services",
    slug: 'pest-control',
    description: "Our pest control services provide effective solutions to eliminate and prevent infestations of termites, cockroaches, rodents, and other pests. We use safe, eco-friendly, and government-approved chemicals to ensure the safety of your family and employees. Regular pest control helps protect property, maintain hygiene, and create a healthy environment.",
    imageUrl: "/assets/images/pest-control.webp",
    expanded: false
  },
  {
    title: "Home & Office Sanitization Services",
    slug: 'sanitization',
    description: "We provide advanced sanitization services for homes and offices to eliminate germs, viruses, and bacteria. Using hospital-grade disinfectants and fogging machines, we ensure deep sanitization of all surfaces, including high-contact areas. This service is ideal for maintaining hygiene during health-sensitive situations and ensuring a safe environment.",
    imageUrl: "/assets/images/home-sanitization.webp",
    expanded: false
  },
  {
    title: "Carpet Cleaning Services",
    slug: 'carpet-cleaning',
    description: "Our carpet cleaning services effectively remove deep-seated dirt, dust, stains, and allergens from your carpets. We use steam cleaning and advanced extraction techniques to restore freshness, improve indoor air quality, and extend the life of your carpets. Your carpets will look cleaner, smell fresher, and feel softer.",
    imageUrl: "/assets/images/carppet-clean.webp",
    expanded: false
  },
  {
    title: "Chair Shampooing / Cleaning Services",
    slug: 'chair-shampooing',
    description: "We offer specialized chair cleaning and shampooing services for office and home furniture. Our process removes stains, dust, and bacteria while preserving fabric quality. Using safe cleaning solutions and advanced tools, we ensure deep cleaning, quick drying, and a fresh, hygienic seating experience.",
    imageUrl: "/assets/images/chair-sampooing.webp",
    expanded: false
  },
  {
    title: "Sofa Shampooing / Cleaning Services",
    slug: 'sofa-cleaning',
    badge: '🛋️ Customer Favorite',
    description: "Our sofa cleaning services restore the beauty and hygiene of your furniture by removing dirt, stains, allergens, and odors. We use fabric-safe and leather-friendly cleaning methods to ensure deep cleaning without damage. This improves comfort, appearance, and the lifespan of your sofas.",
    imageUrl: "/assets/images/Sofacleaning.webp",
    expanded: false
  },
  {
    title: "Gardening Services",
    slug: 'gardening',
    description: "Our gardening services help you create and maintain beautiful outdoor spaces. From lawn care and plant maintenance to landscaping and seasonal planting, we ensure your garden remains healthy, vibrant, and well-maintained. We focus on enhancing aesthetics while promoting sustainable plant growth.",
    imageUrl: "/assets/images/garden-clean.webp",
    expanded: false
  }
];
    @ViewChild('servicesContainer') servicesContainer!: ElementRef;

    constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

    ngAfterViewInit() {
      if (isPlatformBrowser(this.platformId)) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                entry.target.classList.add('show');
              }
            });
          },
          { threshold: 0.1 }
        );

        const serviceCards = this.servicesContainer?.nativeElement.querySelectorAll('.service-card');
        serviceCards?.forEach((card: Element) => observer.observe(card));
      }
    }

}
