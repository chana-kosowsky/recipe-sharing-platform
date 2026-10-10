import { Component, OnInit } from '@angular/core';
import { UserService } from '../../service/user.service';
import { AuthService } from '../../service/auth.service';
import { Router, RouterModule } from '@angular/router';
import { RecipeDataService } from '../../service/recipe-data.service';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RecipeService } from '../../service/recipe.service';
import { TypeBadgeComponent } from '../../shared/type-badge/type-badge.component';
import { User } from '../../interfaces/user';
import { Recipe } from '../../interfaces/recipe';
import { filter, take } from 'rxjs/operators';


@Component({
  selector: 'app-profile',
  imports: [CommonModule, RouterModule,TypeBadgeComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',

  
})

export class ProfileComponent implements OnInit {  
  currentUser: User | null = null;//המשתמש המחובר
  userRecipes: Recipe[] = [];//המתכונים של המשתמש המחובר
  recipeCount: number = 0;//מספר המתכונים שהעלה
  
  loading = false;
  loadingRecipes = false;
  errorMessage = '';
  successMessage = '';
  
 
  showRequestModal = false;


  constructor(
    private userService: UserService,
    private authService: AuthService,
    private recipeService: RecipeService,
    private router: Router,
    private recipeData: RecipeDataService
  ) {}

  // ===================================
  // טעינה ראשונית
  // ===================================
  // ממתינים שבדיקת ה-/me הראשונית תסתיים, ואז:
  // - אין משתמש → ניתוב למסך לוגין
  // - יש משתמש → טוענים פרופיל ומתכונים
  // (אין יותר קריאות ל-localStorage - הזהות באה מ-AuthService.)
  ngOnInit(): void {
    this.authService.isReady$.pipe(
      filter(ready => ready),
      take(1)
    ).subscribe(() => {
      const user = this.authService.currentUserValue;
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }
      this.currentUser = user;
      this.loadUserProfile();
      this.loadUserRecipes();
    });
  }

 
   // טוען את פרטי הפרופיל מהשרת
  
  loadUserProfile(): void {
    if (!this.currentUser) return;
    
    this.loading = true;
    
    this.userService.getUserProfile(this.currentUser.id).subscribe({
      next: (response) => {
        this.recipeCount = response.recipe_count || 0;
        this.currentUser = response.user;
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('שגיאה בטעינת פרופיל:', error);
        this.errorMessage = error.error?.error || 'שגיאה בטעינת הפרופיל';
        this.loading = false;
      }
    });
  }

  
  // טוען את המתכונים של המשתמש
  
  loadUserRecipes(): void {
    if (!this.currentUser) return;
    
    this.loadingRecipes = true;
    
    this.userService.getUserRecipes(this.currentUser.id).subscribe({
      next: (response) => {
        this.userRecipes = response.recipes || [];
        this.loadingRecipes = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('שגיאה בטעינת מתכונים:', error);
        this.errorMessage = error.error?.error || 'שגיאה בטעינת המתכונים';
        this.loadingRecipes = false;
      }
    });
  }

  
  // שולח בקשה להיות Uploader
  
  confirmRequestPermission(): void {
    if (!this.currentUser) return;
    
    this.loading = true;
    this.showRequestModal=false;
    
    // ⭐ הפונקציה החדשה לא מקבלת userId - הזהות נקבעת מהעוגייה.
    this.userService.requestUploadPermission().subscribe({
      next: (response) => {
        this.successMessage = response.message || 'הבקשה נשלחה בהצלחה!';
        this.errorMessage = '';
        this.loading = false;

        // עדכון מקומי לקומפוננט (כך שכפתור הבקשה ייעלם מיד)
        if (this.currentUser) {
          this.currentUser.upload_request_status = 'pending';
        }
        // סנכרון ה-state הגלובלי - כדי שגם נאב/קומפוננטים אחרים יידעו על השינוי
        this.authService.fetchMe().subscribe();

        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
      },
      error: (error: HttpErrorResponse) => {
        console.error('שגיאה בשליחת בקשה:', error);
        this.errorMessage = error.error?.error || 'שגיאה בשליחת הבקשה';
        this.successMessage = '';
        this.loading = false;
      }
    });
  }

  /**
   * מחזיר טקסט לפי תפקיד
   */
  getRoleText(role: string): string {
    const roles: { [key: string]: string } = {
      'Admin': 'מנהל',
      'Uploader': 'מעלה מתכונים',
      'Reader': 'קורא'
    };
    return roles[role] || role;
  }

 
  /**
   * פורמט תאריך
   */
  formatDate(dateStr: string | null): string {
    if (!dateStr) return 'לא ידוע';
    
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('he-IL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'לא ידוע';
    }
  }

  
   // ניווט למתכון
   
  viewRecipe(recipeId: number): void {
    this.router.navigate(['/recipe', recipeId]);
  }

shouldShowRequestButton(): boolean {
    return !!(this.currentUser && this.currentUser.role === 'Reader' && 
             (this.currentUser.upload_request_status === 'none' || this.currentUser.upload_request_status === 'rejected'));
  }


//תמונות מתכון
  getRecipeImage(recipe: any): string {
  if (recipe.image_path) {
      // שימוש בפונקציה מהסרוויס שלך: getImageUrl
      return this.recipeService.getImageUrl(recipe.user_id,recipe.image_path);
    }
    return this.recipeData.getPlaceholderImage(recipe.type);
  }
}