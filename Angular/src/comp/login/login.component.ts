import { Component } from '@angular/core';
import { AuthService } from '../../service/auth.service';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [FormsModule,CommonModule,RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
 constructor(
    public authService: AuthService,  // ⭐ שונה: עברנו לעבוד מול AuthService
    private router: Router  // לניתוב אחרי התחברות מצליחה
  ) {}


  
  // פרטי ההתחברות
  loginData = {
    username: '',  // המשתמש יכול להזין username או email
    password: ''
  };
  //הצגת סיסמה
  showPassword: boolean = false;
  // הודעות למשתמש
  errorMessage: string = '';
  successMessage: string = '';
  
  // האם אנחנו במצב טעינה? (כדי להציג spinner)
  isLoading: boolean = false;

 
  // פונקציית ההתחברות 
  login(): void {
    // איפוס הודעות קודמות
    this.errorMessage = '';
    this.successMessage = '';
    
    // בדיקה בסיסית - שהשדות לא ריקים
    if (!this.loginData.username || !this.loginData.password) {
      this.errorMessage = 'יש למלא את כל השדות!';
      return;
    }

    // התחלת טעינה
    this.isLoading = true;

    // ===================================
    // שליחת הבקשה לשרת דרך AuthService
    // ===================================
    // השרת מחזיר עוגיית JWT (HttpOnly) שתישלח אוטומטית בכל בקשה הבאה.
    // AuthService מעדכן את ה-state הפנימי של המשתמש המחובר - אין צורך ב-localStorage.
    this.authService.login(this.loginData).subscribe({
      next: (_response) => {
        this.successMessage = 'התחברת בהצלחה! 🎉';
        this.errorMessage = '';
        this.isLoading = false;

        // ניתוב לדף הבית אחרי שנייה
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 1000);
      },

      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error || 'שגיאה בהתחברות, נסי שוב';
        this.successMessage = '';
      }
    });
  }
  // פונקציה לשינוי מצב ההצגה                                     
togglePassword(): void {
  this.showPassword = !this.showPassword;
}
    // מנקה את הטופס   
  clearForm(): void {
    this.loginData = { username: '', password: '' };
    this.errorMessage = '';
    this.successMessage = '';
  }
}
