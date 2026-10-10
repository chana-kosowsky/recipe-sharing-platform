/**
 * credentials.interceptor.ts
 * ==========================
 * Interceptor שמוסיף withCredentials=true לכל בקשת HTTP.
 * זה מה שגורם לדפדפן לשלוח את עוגיית ה-JWT אל הבק-אנד אוטומטית.
 * בלי זה - הדפדפן לא ישלח עוגיות בבקשות חוצות-מקורות וכל בקשה תקבל 401.
 */

import { HttpInterceptorFn } from '@angular/common/http';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  // משכפל את הבקשה ומסמן withCredentials כדי שהעוגייה תישלח
  const cloned = req.clone({ withCredentials: true });
  return next(cloned);
};
