import { Component } from '@angular/core';
//import { ThemeService } from '../services/dark-mode.service'; // Adjust the path as needed
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from "../footer/footer.component";

@Component({
  selector: 'app-layout',
  standalone:true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent {
 
}