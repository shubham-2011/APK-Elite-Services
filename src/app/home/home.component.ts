import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../seo.service';
import { ServiceComponentComponent } from '../service-component/service-component.component';
import { AddWhyChooseComponent } from '../add-why-choose/add-why-choose.component';
import { AddMissionComponent } from '../add-mission/add-mission.component';
import { AboutSectionsComponent } from '../about-sections/about-sections.component';
import { JobShowcaseComponent } from '../job-showcase/job-showcase.component';
import { TestimonialsComponent } from '../shared/testimonials.component';
import { BeforeAfterComponent } from '../shared/before-after.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ServiceComponentComponent,
    AddWhyChooseComponent,
    AddMissionComponent,
    AboutSectionsComponent,
    JobShowcaseComponent,
    TestimonialsComponent,
    BeforeAfterComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  constructor(private seo: SeoService) {}

  ngOnInit(): void {
    this.seo.generateTags({
      title: 'APK Elite Services | Professional Cleaning Services in Pune',
      description: 'Trusted cleaning and facility management services in Pune by APK Elite Services. Book deep cleaning, tank cleaning, office cleaning and more.',
      path: '/'
    });
  }
}
