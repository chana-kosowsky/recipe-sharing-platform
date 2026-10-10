/**
 * guards-admin.guard.ts
 * ======================
 * Guard שמונע ניווט לדפים שמיועדים רק למנהל.
 *
 * קודם: קרא ל-localStorage והאמין לתפקיד שכתוב שם (אפשר לזייף!).
 * עכשיו: שואל את AuthService מה תפקיד המשתמש - הזהות באה מעוגיית JWT
 * חתומה ולכן לא ניתנת לזיוף.
 *
 * הערה חשובה על תזמון: כשמשתמש מרענן דף /admin, AuthService עדיין באמצע
 * הקריאה ל-/me. אנחנו מחכים ל-isReady$ לפני שמחליטים, אחרת נדחה אותו לסחורה.
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs/operators';
import { AuthService } from '../service/auth.service';

export const guardsAdminGuard: CanActivateFn = (_route, _state) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  return auth.isReady$.pipe(
    // לחכות עד שבדיקת /me הראשונית מסתיימת
    filter(ready => ready),
    take(1),
    map(() => {
      const user = auth.currentUserValue;

      // אין משתמש מחובר → שלח להתחברות
      if (!user) {
        router.navigate(['/login']);
        return false;
      }

      // משתמש שאינו Admin → חסום עם הודעה
      if (user.role !== 'Admin') {
        alert('⛔ אין לך הרשאה לצפות בדף זה!');
        router.navigate(['/']);
        return false;
      }

      // ✅ מנהל - אפשר להיכנס
      return true;
    })
  );
};
