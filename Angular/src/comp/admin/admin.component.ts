import { Component } from '@angular/core';
import { UserService } from '../../service/user.service';
import { CommonModule } from '@angular/common';
import { User } from '../../interfaces/user';

@Component({
  selector: 'app-admin',
  imports: [CommonModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent {
  // משתנים לניהול משתמשים

  pendingUsers: User[] = []; //משתנים הממתינים לאישור
  loading = false; // מציין אם הנתונים נטענים
  errorMessage = '';// הודעות שגיאה
  successMessage = '';// הודעות הצלחה
  
  // משתנים ל-Modal
  showModal = false;  // האם ה-Modal פתוח
  modalAction: 'approve' | 'reject' = 'approve';
  selectedUser: User | null = null;

  constructor(
    private userService: UserService
  ) {}

  // ===================================
  // טעינה ראשונית
  // ===================================
  // בדיקת ההרשאה (Admin) נעשית כבר ב-guard ברמת הראוטר (guardsAdminGuard).
  // לכן הקומפוננט יכול להניח שאם הוא נטען - המשתמש הוא Admin תקף.
  ngOnInit(): void {
    this.loadPendingUsers();
  }

  
   // טוען את רשימת המשתמשים שמבקשים אישור
   
  loadPendingUsers(): void {
    this.loading = true;
    this.errorMessage = '';
    
    this.userService.getPendingUsers().subscribe({
      next: (response) => {
        this.pendingUsers = response.users || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('שגיאה בטעינת משתמשים:', error);
        this.errorMessage = error.error?.error || 'שגיאה בטעינת המשתמשים';
        this.loading = false;
      }
    });
  }

  
   // פותח את ה-Modal
  
  openModal(action: 'approve' | 'reject', user: User): void {
    this.modalAction = action;
    this.selectedUser = user;
    this.showModal = true;
  }

  
   // סוגר את ה-Modal
   
  closeModal(): void {
    this.showModal = false;
    this.selectedUser = null;
  }

  
  //  מאשר משתמש (אחרי אישור ב-Modal)
   
  confirmApprove(): void {
    if (!this.selectedUser) return;
    
    const userId = this.selectedUser.id;
    const username = this.selectedUser.username;
    
    this.userService.approveUser(userId).subscribe({
      next: (response) => {
        this.successMessage = `✅ המשתמש ${username} אושר בהצלחה!`;
        this.errorMessage = '';
        
        // מסיר את המשתמש מהרשימה
        this.pendingUsers = this.pendingUsers.filter(u => u.id !== userId);
        
        // מסתיר את ההודעה אחרי 3 שניות
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
        
        this.closeModal();
      },
      error: (error) => {
        console.error('שגיאה באישור משתמש:', error);
        this.errorMessage = error.error?.error || 'שגיאה באישור המשתמש';
        this.successMessage = '';
        this.closeModal();
      }
    });
  }

  /**
   * דוחה בקשת משתמש (אחרי אישור ב-Modal)
   */
  confirmReject(): void {
    if (!this.selectedUser) return;
    
    const userId = this.selectedUser.id;
    const username = this.selectedUser.username;
    
    this.userService.rejectUser(userId).subscribe({
      next: (response) => {
        this.successMessage = `✅ הבקשה של ${username} נדחתה`;
        this.errorMessage = '';
        
        // מסיר את המשתמש מהרשימה
        this.pendingUsers = this.pendingUsers.filter(u => u.id !== userId);
        
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
        
        this.closeModal();
      },
      error: (error) => {
        console.error('שגיאה בדחיית בקשה:', error);
        this.errorMessage = error.error?.error || 'שגיאה בדחיית הבקשה';
        this.successMessage = '';
        this.closeModal();
      }
    });
  }
}