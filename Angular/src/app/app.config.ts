import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { credentialsInterceptor } from '../service/credentials.interceptor';

// ===================================
// קונפיגורציית האפליקציה
// ===================================
// provideHttpClient עם credentialsInterceptor - דואג שכל קריאה ל-API
// תצרף אוטומטית את עוגיית ה-JWT (withCredentials=true).
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([credentialsInterceptor]))
  ]
};
