import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-language-switcher',
  templateUrl: './language-switcher.component.html', // Link to the external HTML file
  styleUrls: ['./language-switcher.component.scss'], // Link to the external styles file (optional)
})
export class LanguageSwitcherComponent {
  constructor(private translate: TranslateService) {}

  changeLanguage(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const language = selectElement.value;
    this.translate.use(language); // Change the language
  }
}