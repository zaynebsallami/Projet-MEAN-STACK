import { Component } from '@angular/core';
import {
  ChangeDetectorRef,
  ViewEncapsulation
} from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-dashbord',
  standalone: true,
  imports: [],
  templateUrl: './dashbord.component.html',
  styleUrl: './dashbord.component.scss',
    encapsulation: ViewEncapsulation.None

})
export class DashbordComponent {
  stats = [
    { title: "Ventes Totales", value: "€24,532", change: "+12%", trend: "up" },
    { title: "Nouveaux Clients", value: "145", change: "+28%", trend: "up" },
    { title: "Commandes", value: "356", change: "+17%", trend: "up" },
    { title: "Taux de Conversion", value: "3.2%", change: "-0.4%", trend: "down" }
  ];
constructor(private translate: TranslateService){
  this.translate.setDefaultLang('en');
    this.translate.use('en');
}
}
