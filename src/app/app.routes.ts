import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ServicesOverviewComponent } from './services-overview/services-overview.component';
import { ServicePageComponent } from './service-page/service-page.component';
import { AboutPageComponent } from './about-page/about-page.component';
import { ContactPageComponent } from './contact-page/contact-page.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { DiwaliCleaningComponent } from './diwali-cleaning/diwali-cleaning.component';
import { LocalityPageComponent } from './locality-page/locality-page.component';
import { CmsRedirectComponent } from './cms-redirect/cms-redirect.component';
import { NotFoundComponent } from './not-found/not-found.component';

// Titles and meta tags are owned by each component via SeoService,
// so routes deliberately carry no `title` (the router would override
// the component's title after navigation).
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'about', component: AboutPageComponent },
  { path: 'contact', component: ContactPageComponent },
  { path: 'privacy-policy', component: PrivacyPolicyComponent },
  { path: 'cms', component: CmsRedirectComponent },
  { path: 'diwali-deep-cleaning-pune', component: DiwaliCleaningComponent },
  { path: 'services', component: ServicesOverviewComponent },
  { path: 'services/deep-cleaning-baner', component: LocalityPageComponent },
  { path: 'services/deep-cleaning-wakad', component: LocalityPageComponent },
  { path: 'services/deep-cleaning-kharadi', component: LocalityPageComponent },
  { path: 'services/deep-cleaning-hinjewadi', component: LocalityPageComponent },
  { path: 'services/sofa-cleaning-pune', component: ServicePageComponent },
  { path: 'services/office-cleaning-pune', component: ServicePageComponent },
  { path: 'services/post-construction-cleaning-pune', component: ServicePageComponent },
  { path: 'services/:slug', component: ServicePageComponent },
  { path: '**', component: NotFoundComponent }
];
