import { Component } from '@angular/core';
import { trigger, state, style, transition, animate, query, stagger, animateChild } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; // Import du Router
import { SellerService } from '../services/seller.service';
import { CategoryService } from '../services/category.service';
@Component({
  selector: 'app-signup-se',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './signup-se.component.html',
  styleUrls: ['./signup-se.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('500ms', style({ opacity: 1 }))
      ])
    ]),
    trigger('fadeInTitle', [
      transition(':enter', [
        style({ transform: 'translateY(-50px)', opacity: 0 }),
        animate('700ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('formContainer', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('fadeInItem', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms', style({ opacity: 1 }))
      ])
    ]),
    trigger('fadeInSuccess', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('500ms', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class SignupSeComponent {
  sellerData: any;
categories: any[] = [];
  selectedCategory: string = '';
  constructor(private router: Router, private sellerService: SellerService,    private categoryService: CategoryService // Ajoute le service ici
) {
    // Récupérer les données du state de navigation
    const navigation = this.router.getCurrentNavigation();
    this.sellerData = navigation?.extras.state?.['sellerData'];
    
    if (!this.sellerData) {
      this.router.navigate(['/login']); // Rediriger si pas de données
    }
     this.categoryService.getCategories().subscribe(cats => {
      this.categories = cats;
    });
  
  }
  pdfFile: File | null = null;
  storePhoto: File | null = null;
  // Vous pouvez ajouter ici vos propriétés et méthodes, par exemple :
  businessName: string = '';
  description: string = '';
  fileName: string = '';
  fileError: boolean = false;
  storePhotoName: string = '';
  formSubmitted: boolean = false;

  selectedPhoto: string | null = null;  // Variable pour stocker l'URL de l'image sélectionnée

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.fileName = file.name;
      this.pdfFile = file; // Stocker le fichier
      this.fileError = false;
    }
  }
  
  onStorePhotoChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.storePhoto = file; // Stocker le fichier
      this.selectedPhoto = URL.createObjectURL(file); // Pour l'aperçu
      console.log("Photo sélectionnée : ", file);
    }
  }
  
  triggerStorePhotoInput(): void {
    const fileInput = document.getElementById('store-photo') as HTMLInputElement;
    fileInput.click();  // Cette ligne ouvre le sélecteur de fichiers
  }
  
  
  triggerFileInput(input: HTMLInputElement): void {
    input.click();
  }
  
  
  

  // Fonction de soumission du formulaire
  onBusinessSubmit(): void {
    // Vérification des champs requis
   if (!this.businessName || !this.selectedCategory || !this.description || !this.pdfFile || !this.storePhoto) {
  alert('Please complete all fields and upload required documents.');
  return;
}
  
    // Créer un FormData pour envoyer les fichiers
    const formData = new FormData();
    
    // Ajouter les données du premier formulaire
    for (const key in this.sellerData) {
      formData.append(key, this.sellerData[key]);
    }
  
    // Ajouter les données de la boutique
    formData.append('businessName', this.businessName);
  formData.append('category', this.selectedCategory); // <-- ici
  const selectedCat = this.categories.find(cat => cat._id === this.selectedCategory);
formData.append('productType', selectedCat ? selectedCat.name : '');
    formData.append('description', this.description);
    
    // Ajouter les fichiers
    formData.append('documentation', this.pdfFile);
    formData.append('storePhoto', this.storePhoto);
  
    // Appel au service SellerService
    this.sellerService.signupSeller(formData).subscribe({
      next: (response) => {
        console.log('Inscription réussie', response);
        this.formSubmitted = true;
        
        setTimeout(() => {
          this.router.navigate(['/dashboard/seller-dashboard']);
        }, 2000);
      },
      error: (error) => {
        console.error('Erreur lors de l\'inscription', error);
        alert('Erreur lors de l\'inscription. Veuillez réessayer.');
      }
    });
  }
}
