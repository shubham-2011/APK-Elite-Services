import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { QuoteModalService } from '../shared/quote-modal.service';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css']
})
export class NavBarComponent {
  menuOpen = false;

  constructor(private quoteModalService: QuoteModalService) {}

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  openQuoteModal() {
    this.closeMenu();
    this.quoteModalService.open();
  }
}
