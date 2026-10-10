/**
 * nav.component.ts
 * =================
 * תפריט הניווט. מציג קישורים שונים לפי מצב המשתמש (מחובר/לא, Admin/Reader וכו').
 *
 * קודם: קרא ל-localStorage בכל ניווט כדי לברר מי המשתמש המחובר.
 * עכשיו: נרשם ל-AuthService.currentUser$ ומקבל עדכונים אוטומטית
 * בכל פעם שהמשתמש מתחבר/מתנתק - אין צורך לרענן ידנית.
 */

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-nav',
  imports: [RouterModule, CommonModule],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.css'
})
export class NavComponent implements OnInit {
  // ===================================
  // משתנים שמוצגים בתבנית
  // ===================================
  // נשארים כפי שהיו - התבנית כבר משתמשת בהם.
  // האכלוס שלהם הוא מה שהשתנה (Observable במקום localStorage).
  isLoggedIn: boolean = false;
  currentUsername: string = '';
  isApprovedUploader: boolean = false;
  isAdmin: boolean = false;
  isMobileMenuOpen: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  // ===================================
  // הרשמה לסטרים של המשתמש המחובר
  // ===================================
  // BehaviorSubject משדר את הערך הנוכחי מיד וגם כל עדכון עתידי.
  // לכן ברגע שמישהו מתחבר/מתנתק - התפריט מתעדכן אוטומטית.
  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.currentUsername = user?.username || '';
      this.isApprovedUploader = user?.is_approved_uploader || false;
      this.isAdmin = user?.role === 'Admin';
    });
  }

  // ===================================
  // יציאה
  // ===================================
  // קוראים ל-AuthService שמטפל גם בקריאה לשרת (לניקוי העוגייה)
  // וגם בעדכון ה-state המקומי. השינוי ב-state יגיע אלינו אוטומטית
  // דרך ה-subscription למעלה ויעדכן את התפריט.
  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => {
        // גם אם הקריאה לשרת נכשלת - להפנות למסך הלוגין
        // כדי שהמשתמש לא יישאר תקוע במצב מבלבל.
        this.router.navigate(['/login']);
      }
    });
  }

  // ===================================
  // תפריט מובייל (UI בלבד)
  // ===================================
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }
}
