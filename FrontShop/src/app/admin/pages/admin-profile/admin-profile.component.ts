import { Component , OnInit} from '@angular/core';
import { AdminService } from '../../../services/admin.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { Location } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ChangeDetectorRef,
  ViewEncapsulation
} from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

interface AdminProfileUpdate {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  adresse?: string;
  dateNaissance?: Date | string;
  oldPassword?: string;
  newPassword?: string;
}
@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatInputModule, MatFormFieldModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule, MatTooltipModule, ReactiveFormsModule,TranslateModule],
  templateUrl: './admin-profile.component.html',
  styleUrl: './admin-profile.component.scss',
  encapsulation: ViewEncapsulation.None

})
export class AdminProfileComponent implements OnInit {
  profileForm: FormGroup;
  isEditing = false;
  adminData: any;
  isLoading = true;
  admin: any;
  isChangingPassword = false;
passwordForm!: FormGroup;

showPasswordFields = false; // au lieu de undefined

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private router: Router,
    private formBuilder: FormBuilder,
    private location: Location,
    private translate: TranslateService
  ) {
    this.profileForm = this.fb.group({
       lastName: ['', Validators.required],      // Nom
      firstName: ['', Validators.required],     // Prénom
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^[0-9]{10}$/)]],
      birthDate: [''], 
      address: [''],
      oldPassword: [''],
      newPassword: ['', [Validators.minLength(6)]],
      confirmPassword: ['']
    }, { validator: this.passwordMatchValidator });
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }
getControl(controlName: string): AbstractControl {
  const control = this.profileForm.get(controlName);
  if (!control) {
    throw new Error(`Le contrôle ${controlName} n'existe pas`);
  }
  return control;
}
// Dans votre composant
getValidationMessage(control: AbstractControl, controlName: string): string {
  if (!control.errors) return '';
  
  const errors = control.errors as ValidationErrors;
  
  switch (controlName) {
    case 'firstName':
    case 'lastName':
      if (errors['required']) {
        return 'Ce champ est obligatoire';
      }
      break;
      
    case 'email':
      if (errors['required']) {
        return 'Email obligatoire';
      }
      if (errors['email']) {
        return 'Format email invalide';
      }
      break;
      
    case 'phone':
      if (errors['pattern']) {
        return '10 chiffres requis';
      }
      break;
      
    default:
      return '';
  }
  
  return '';
}
ngOnInit() {
  this.profileForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    birthDate: [''],
    address: [''],
    oldPassword: [''],
    newPassword: ['', [Validators.minLength(6)]],
    confirmPassword: ['']
  }, { validator: this.passwordMatchValidator });

  this.loadAdminData();
}

  

loadAdminData(): void {
  this.adminData = this.adminService.getAdminData();
  if (!this.adminData) {
    this.router.navigate(['/admin/login-admin']);
    return;
  }

  // Normaliser les données reçues
  const normalizedData = {
    firstName: this.adminData.firstName || this.adminData.prenom || '',
    lastName: this.adminData.lastName || this.adminData.nom || '',
    email: this.adminData.email,
    phone: this.adminData.phone || this.adminData.telephone || '',
    address: this.adminData.address || this.adminData.adresse || '',
    birthDate: this.adminData.birthDate || this.adminData.dateNaissance || '',
    createdAt: this.adminData.createdAt
  };

  this.adminData = normalizedData;

  this.profileForm.patchValue({
    firstName: this.adminData.firstName,
    lastName: this.adminData.lastName,
    email: this.adminData.email,
    phone: this.adminData.phone,
    address: this.adminData.address,
    birthDate: this.adminData.birthDate
  });

  this.isLoading = false;
}

 toggleEdit(): void {
  this.isEditing = !this.isEditing;
  this.showPasswordFields = false;

  // Retire les validateurs si on quitte l'édition
  ['oldPassword', 'newPassword', 'confirmPassword'].forEach(field => {
    this.profileForm.get(field)?.clearValidators();
    this.profileForm.get(field)?.updateValueAndValidity();
  });

  if (!this.isEditing) {
    this.loadAdminData();
  }
}


onSubmit(): void {
  if (this.profileForm.invalid) {
    this.profileForm.markAllAsTouched();
    return;
  }

  this.isLoading = true;
  
  const formData = this.profileForm.value;
  const updateData: AdminProfileUpdate = {
    nom: formData.lastName,
    prenom: formData.firstName,
    email: formData.email,
    telephone: formData.phone,
    adresse: formData.address,
    dateNaissance: formData.birthDate
  };

  if (this.showPasswordFields) {
    updateData.oldPassword = formData.oldPassword;
    updateData.newPassword = formData.newPassword;
  }

  this.adminService.updateAdminProfile(updateData).subscribe({
    next: (response: any) => {
      this.isLoading = false;
      
      // Mettre à jour les données locales avec la réponse
      this.adminData = {
        firstName: response.admin.prenom,
        lastName: response.admin.nom,
        email: response.admin.email,
        phone: response.admin.telephone,
        address: response.admin.adresse,
        birthDate: response.admin.dateNaissance,
        createdAt: this.adminData.createdAt // Conserver l'ancienne valeur si non incluse dans la réponse
      };

      // Mettre à jour le formulaire avec les nouvelles valeurs
      this.profileForm.patchValue({
        firstName: this.adminData.firstName,
        lastName: this.adminData.lastName,
        email: this.adminData.email,
        phone: this.adminData.phone,
        address: this.adminData.address,
        birthDate: this.adminData.birthDate
      });

      this.isEditing = false;
      this.showPasswordFields = false;
    },
    error: (error: any) => {
      console.error('Erreur mise à jour:', error);
      this.isLoading = false;
    }
  });
}
  changePassword(): void {
  this.isEditing = true;
  this.isChangingPassword = true;
  
  // Réinitialisez les champs de mot de passe
  this.profileForm.patchValue({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Faites défiler jusqu'au formulaire si nécessaire
  setTimeout(() => {
    const formElement = document.querySelector('.edit-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  }, 100);
}
togglePasswordChange() {
  this.isEditing = true;
  this.showPasswordFields = true;

  // Appliquer les validateurs requis aux champs de mot de passe
  this.profileForm.get('oldPassword')?.setValidators(Validators.required);
  this.profileForm.get('newPassword')?.setValidators([Validators.required, Validators.minLength(6)]);
  this.profileForm.get('confirmPassword')?.setValidators(Validators.required);

  this.profileForm.get('oldPassword')?.updateValueAndValidity();
  this.profileForm.get('newPassword')?.updateValueAndValidity();
  this.profileForm.get('confirmPassword')?.updateValueAndValidity();
}





cancelPasswordChange() {
  this.isChangingPassword = false;
  this.passwordForm.reset();
}

submitPasswordChange() {
  if (this.passwordForm.valid) {
    const { oldPassword, newPassword } = this.passwordForm.value;
    // Appel backend ici
  }
}

passwordMatchValidator(formGroup: FormGroup) {
  const newPassword = formGroup.get('newPassword')?.value;
  const confirmPassword = formGroup.get('confirmPassword')?.value;
  return newPassword === confirmPassword ? null : { mismatch: true };
}
goBack(): void {
  this.router.navigate(['/admin']);
}
}
