import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [TranslateModule, CommonModule], // Import necessary modules
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {
  footerSections: { title: string; links: string[] }[] = []; // Initialize footer sections

  constructor(private translate: TranslateService) {
    this.translate.setDefaultLang('en'); // Set default language
    this.translate.use('en'); // Use default language
  }

  ngOnInit(): void {
    // Initialize footer sections with translation keys
    this.footerSections = [
      {
        title: 'COMPANY',
        links: ['ABOUT_US', 'CAREERS', 'CONTACT_US'],
      },
      {
        title: 'SUPPORT',
        links: ['FAQ', 'HELP_CENTER', 'PRIVACY_POLICY'],
      },
      {
        title: 'LEGAL',
        links: ['TERMS_OF_SERVICE', 'REFUND_POLICY'],
      },
    ];
  }
}