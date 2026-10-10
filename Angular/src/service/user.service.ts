/**
 * user.service.ts
 * ================
 * סרוויס לקריאות API שקשורות לנתוני משתמשים (פרופיל, מתכונים, ניהול).
 * שימו לב: התחברות / רישום / יציאה / "מי המשתמש המחובר" - לא כאן! זה ב-AuthService.
 *
 * כל הקריאות שמצריכות אימות שולחות את עוגיית ה-JWT אוטומטית
 * דרך credentialsInterceptor שהוגדר ב-app.config.ts.
 * לכן אין צורך לקרוא ל-localStorage או לשלוח admin_user_id בגוף הבקשה.
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../interfaces/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  // ===================================
  // קריאות ציבוריות (לא מצריכות התחברות)
  // ===================================

  // רשימת כל המשתמשים
  getall(): Observable<Array<User>> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  // פרטי משתמש (פרופיל)
  getUserProfile(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/user/${userId}`);
  }

  // המתכונים של משתמש
  getUserRecipes(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/user/${userId}/recipes`);
  }

  // ===================================
  // קריאות שמצריכות התחברות
  // ===================================
  // הזהות מגיעה מהעוגייה - אין צורך לשלוח user_id בגוף הבקשה.

  requestUploadPermission(): Observable<any> {
    return this.http.post(`${this.apiUrl}/user/request-upload-permission`, {});
  }

  // ===================================
  // קריאות מנהל (Admin בלבד)
  // ===================================
  // הבק-אנד אוכף שזה Admin דרך @admin_required - הפרונט לא צריך לשלוח admin_user_id.

  // רשימת בקשות הממתינות לאישור (שינוי: עכשיו GET, לא POST)
  getPendingUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/pending-users`);
  }

  approveUser(userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/approve-user/${userId}`, {});
  }

  rejectUser(userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/reject-user/${userId}`, {});
  }
}
