/**
 * auth.service.ts
 * ================
 * הסרוויס המרכזי לאימות משתמשים. הוא:
 * 1. מחזיק את "מי המשתמש המחובר" כ-BehaviorSubject (Observable שאפשר להאזין לו).
 * 2. בעת הטעינה הראשונית - שואל את הבק-אנד דרך /me האם העוגייה תקפה.
 * 3. מספק login / register / logout שמטפלים גם בקריאת השרת וגם בעדכון הסטייט הפנימי.
 *
 * רעיון מרכזי: רכיבים (Components) לא קוראים יותר ל-localStorage.
 * הם נרשמים ל-currentUser$ ומקבלים עדכונים אוטומטית.
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { User } from '../interfaces/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:5000/api';

  // ===================================
  // ה-State המרכזי
  // ===================================
  // BehaviorSubject - כמו Observable רגיל אבל זוכר את הערך האחרון.
  // מי שנרשם אליו מקבל מיד את הערך הנוכחי, ואז כל עדכון עתידי.
  // null = אין משתמש מחובר. אובייקט User = מחובר.
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  // ===================================
  // האם בדיקת ה-/me הראשונית הסתיימה?
  // ===================================
  // נחוץ כדי שגארדים (CanActivate) ידעו לחכות לסיום הקריאה לפני שיחליטו אם לאפשר ניווט.
  // בלי זה - ריענון דף בדף מוגן יחזיר false עוד לפני שהשרת ענה אם יש משתמש.
  private isReadySubject = new BehaviorSubject<boolean>(false);
  public isReady$: Observable<boolean> = this.isReadySubject.asObservable();

  constructor(private http: HttpClient) {
    // בטעינה ראשונית של האפליקציה - בודקים אם יש עוגייה תקפה ברקע.
    // אם יש - מעדכנים את ה-state. אם לא - שותקים (זה מקרה שגרתי של מבקר חדש).
    this.fetchMe().subscribe();
  }

  // ===================================
  // קבלת המשתמש המחובר מהשרת
  // ===================================
  // משמש גם בטעינה ראשונית וגם כשרוצים לרענן את פרטי המשתמש.
  // אם השרת מחזיר 401 - אין עוגייה / היא לא תקפה - מנקים את ה-state בלי לזרוק שגיאה.
  // בכל מקרה (הצלחה או 401) - מסמנים isReady=true כדי שהגארדים יוכלו להמשיך.
  fetchMe(): Observable<User | null> {
    return this.http.get<{ user: User }>(`${this.apiUrl}/me`).pipe(
      map(response => response.user),
      tap(user => {
        this.currentUserSubject.next(user);
        this.isReadySubject.next(true);
      }),
      catchError(() => {
        this.currentUserSubject.next(null);
        this.isReadySubject.next(true);
        return of(null);
      })
    );
  }

  // ===================================
  // התחברות
  // ===================================
  // שולח שם משתמש וסיסמה לשרת. בהצלחה - השרת מציב עוגיית JWT (HttpOnly)
  // וגם מחזיר את אובייקט המשתמש בתגובה. אנחנו מעדכנים את ה-state ב-tap.
  login(credentials: { username: string; password: string }): Observable<{ user: User; message: string }> {
    return this.http.post<{ user: User; message: string }>(
      `${this.apiUrl}/login`,
      credentials
    ).pipe(
      tap(response => this.currentUserSubject.next(response.user))
    );
  }

  // ===================================
  // רישום משתמש חדש
  // ===================================
  // לא מבצע התחברות אוטומטית - אחרי הרשמה המשתמש יעבור למסך הלוגין.
  register(userData: { username: string; email: string; password: string }): Observable<{ user: User; message: string }> {
    return this.http.post<{ user: User; message: string }>(
      `${this.apiUrl}/users`,
      userData
    );
  }

  // ===================================
  // יציאה
  // ===================================
  // קוראים לנקודת הקצה /logout שמנקה את העוגייה בצד השרת,
  // ובמקביל מאפסים את ה-state הפנימי כדי שכל הרכיבים יראו "אין משתמש מחובר".
  logout(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => this.currentUserSubject.next(null))
    );
  }

  // ===================================
  // גישה סינכרונית לערך הנוכחי
  // ===================================
  // שימושי כשאי אפשר/לא נוח להירשם ל-Observable
  // (למשל בתוך CanActivate guard).
  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  // ===================================
  // עזרי הרשאה
  // ===================================
  // שורט-קאטים נוחים לבדיקות מהירות ברכיבים ובגארדים.
  get isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  get isAdmin(): boolean {
    return this.currentUserSubject.value?.role === 'Admin';
  }

  get isApprovedUploader(): boolean {
    return this.currentUserSubject.value?.is_approved_uploader === true;
  }
}
