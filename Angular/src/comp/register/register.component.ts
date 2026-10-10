import { Component } from '@angular/core';
import { AuthService } from '../../service/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {  Router, RouterModule } from '@angular/router';
import { User } from '../../classes/User';


@Component({
  selector: 'app-register',
  imports: [FormsModule,CommonModule,RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {

constructor(public auth: AuthService,// ⭐ שונה: עברנו לעבוד מול AuthService
  private router: Router//מאפשר ניווט
 )
   {}

  // משתנים  
  showPassword: boolean = false;    //הצגת סיסמה
  newUser: User = new User();       // האובייקט שנשלח
  errorMessage: string = '';        // הודעת שגיאה
  successMessage: string = '';      // הודעת הצלחה
  
  // פונקצית הרשמה
  register(): void {
    //איפוס הודעות מהרשמות קודמות
    this.errorMessage='';
    this.successMessage='';
    //בדיקה שהשדות צ=מלאים
    if (!this.newUser.username || !this.newUser.email || !this.newUser.password) {
      this.errorMessage = 'יש למלא את כל השדות!';
      this.successMessage = '';
      return;
    }
// ===================================
    // קריאה ל-AuthService לרישום
    // ===================================
    // לא מבצעים auto-login - המשתמש יעבור למסך הלוגין כדי לקבל עוגיית JWT.
    this.auth.register({
      username: this.newUser.username,
      email: this.newUser.email,
      password: this.newUser.password
    }).subscribe({
      next: (_response) => {
        this.successMessage = 'ההרשמה הצליחה! עכשיו אפשר להתחבר';
        this.errorMessage = '';
        this.newUser = new User();  // ניקוי הטופס
        this.router.navigate(['/login']);  // ניתוב למסך הלוגין
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'שגיאה בהרשמה';
        this.successMessage = '';
      }
    });
  }
    // פונקציה להצגת/הסתרת הסיסמה                                    
togglePassword(): void {
  this.showPassword = !this.showPassword;
}
}
