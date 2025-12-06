import { bootstrapApplication } from '@angular/platform-browser';
import '@angular/localize/init';

import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';

import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';

import { HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './app/interceptors/auth.interceptor';

import { MatSnackBarModule } from '@angular/material/snack-bar';

// Factory function for ngx-translate Http loader
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

// Bootstrap Angular standalone app
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideAnimations(),

    // Provide HttpClient with interceptors support
    provideHttpClient(withInterceptorsFromDi()),

    // Register HTTP interceptor (AuthInterceptor)
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },

    // Import ngx-translate and Angular Material SnackBar modules
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'en',
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient],
        },
      }),
      MatSnackBarModule
    ),
  ],
})
  .then(() => console.log('✅ App bootstrapped successfully!'))
  .catch((err) => console.error('❌ Error during bootstrap:', err));
