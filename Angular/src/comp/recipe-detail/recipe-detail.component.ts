import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RecipeService } from '../../service/recipe.service';
import { AuthService } from '../../service/auth.service';
import { CommonModule } from '@angular/common';
import { TypeBadgeComponent } from '../../shared/type-badge/type-badge.component';
import { RatingStarsComponent } from '../../shared/rating-stars/rating-stars.component';
import { RecipeDataService } from '../../service/recipe-data.service';
import { Recipe } from '../../interfaces/recipe';
import { AiChefPanelComponent } from '../../shared/ai-chef-panel/ai-chef-panel.component';


@Component({
  selector: 'app-recipe-detail',
  imports: [RouterModule,CommonModule,TypeBadgeComponent,RatingStarsComponent,AiChefPanelComponent],
  templateUrl: './recipe-detail.component.html',
  styleUrl: './recipe-detail.component.css',

})
export class RecipeDetailComponent implements OnInit {

  // משתנים
  userRating: number = 0;           //דירוג המשתמש הנוכחי
  recipe: Recipe | null = null;    // המתכון שנטען
  isLoading: boolean = true;       // האם בטעינה?
  errorMessage: string = '';       // הודעת שגיאה
  successMessage: string = '';
  
  // שליטה ב־Modal מחיקה וב־Spinner בזמן מחיקה
  showDeleteModal: boolean = false;
  isDeleting: boolean = false;

    // אפקט התצוגה המוצג כרגע
  selectedEffect: 'original' | 'grayscale' | 'vibrant' | 'vintage' = 'original';

  constructor(
    private route: ActivatedRoute,      // כדי לקבל את ה-ID מה-URL
    private router: Router,             // כדי לנווט
    public recipeService: RecipeService,
    private authService: AuthService,   // ⭐ זהות המשתמש מ-AuthService במקום localStorage
    private recipeData: RecipeDataService
  ) {}
  
 
  // טעינת המתכון בעת אתחול
  ngOnInit(): void {
    // לוקח את ה-ID מה-URL
    //הופך ממחרוזת למספר
    const id = this.route.snapshot.params['id'];
    
    if (id) {
      this.loadRecipe(+id);  // ה-+ ממיר מstring למספר
    } else {
      this.errorMessage = 'לא נמצא מזהה מתכון';
      this.isLoading = false;
    }
  }
  
 
  //   שולף את המתכון מהשרת
  
  loadRecipe(id: number): void {
    //איפוס מצב
    this.isLoading = true;
    this.errorMessage = '';
    //קיאה לservice
    this.recipeService.getRecipeById(id).subscribe({//הבקשה יוצאת בפועל
      next: (response: any) => {//השרת החזיר תשובה תקינה
        this.recipe = response.recipe;
        this.isLoading = false;//הנתונים נכנסים למודל
        this.loadUserRating();//קריאה לדירוג המשתמש רק אחרי שהמתכון נטען
        console.log('✅ נטען מתכון:', this.recipe);      
      },
      error: (err: any) => {//כשל
        this.errorMessage = err.error?.error || 'שגיאה בטעינת המתכון';
        this.isLoading = false;
        console.error('❌ שגיאה:', err);
      }
    });
  }
  // ===================================
  // דירוג המשתמש למתכון הזה
  // ===================================
  // הזהות מגיעה מהעוגייה - אם אין משתמש מחובר, פשוט לא קוראים לשרת.
  loadUserRating(): void {
    if (!this.authService.isLoggedIn || !this.recipe) return;

    this.recipeService.getUserRating(this.recipe.id).subscribe({
      next: (response) => {
        this.userRating = response.rating || 0;
      }
    });
  }

  // ===================================
  // שמירת דירוג חדש
  // ===================================
  onRatingChange(rating: number): void {
    if (!this.authService.isLoggedIn || !this.recipe) return;

    this.recipeService.rateRecipe(this.recipe.id, rating).subscribe({
      next: (response) => {
        this.recipe!.average_rating = response.average_rating;
      },
      error: (error) => {
        console.error('❌ שגיאה:', error);
      }
    });
  }

  // ===================================
  // האם המשתמש המחובר הוא Admin?
  // ===================================
  // משמש בתבנית להצגת/הסתרת כפתור מחיקה.
  isAdmin(): boolean {
    return this.authService.isAdmin;
  }
 
  //  פתיחת Modal מחיקה
openDeleteModal(): void {
    this.showDeleteModal = true;
  }
  
 
  // סגירת Modal מחיקה
  closeDeleteModal(): void {
    this.showDeleteModal = false;
  }
  
  
  // אישור מחיקה
  confirmDelete(): void {
    if (!this.recipe) {
      return;
    }
    
    this.isDeleting = true;
  
    
    
    
    this.recipeService.deleteRecipe(this.recipe.id).subscribe({
      next: (response) => {
        console.log('✅ מתכון נמחק:', response);
        
        this.successMessage = `המתכון "${this.recipe?.title}" נמחק בהצלחה!`;
        this.closeDeleteModal();
        
        // ניווט חזרה לרשימת המתכונים אחרי 2 שניות
        setTimeout(() => {
          this.router.navigate(['/recipes']);
        }, 2000);
      },
      error: (error) => {
        console.error('❌ שגיאה במחיקה:', error);
        this.errorMessage = error.error?.error || 'שגיאה במחיקת המתכון';
        this.isDeleting = false;
        this.closeDeleteModal();
           
      }
     });
  }

//גלרית תמונות+אפקטים
  getRecipeImage(
    effect: 'original' | 'grayscale' | 'vibrant' | 'vintage' = 'original'
  ): string {
    if (!this.recipe) return '';

    if (effect === 'original' || !this.recipe.variation_paths) {
      return this.recipeService.getImageUrl(this.recipe.user_id,this.recipe.image_path);
    }

    try {
      const variations = JSON.parse(this.recipe.variation_paths);
      const filename = variations[effect];

      return filename
        ? this.recipeService.getImageUrl(this.recipe.user_id,filename)
        : this.recipeService.getImageUrl(this.recipe.user_id,this.recipe.image_path);
    } catch (e) {
      console.error('Error parsing variation_paths:', e);
      return this.recipeService.getImageUrl(this.recipe.user_id,this.recipe.image_path);
    }
  }
   // ⭐ פתיחה של התמונה בגדול (בטאב חדש)
  openFullImage(): void {
    const url = this.getRecipeImage(this.selectedEffect);
    if (url) {
      window.open(url, '_blank');
    }
  }
   onImageError(event: any): void {
    event.target.style.display = 'none';
  }
  
  /**
   * חזרה לדף המתכונים
   */
  goBack(): void {
    this.router.navigate(['/recipes']);
  }
  
 
/**
 * בודק אם יש וריאציות אמנותיות
 */
hasVariations(): boolean {
  return !!this.recipe?.variation_paths;
}

/**
   * מחזיר אימוג'י קטגוריה
   * דוגמה: 'Dessert' -> '🍰'
   */
  getCategoryEmoji(category: string): string {
    return this.recipeData.getCategoryEmoji(category);
  }

  /**
   * מחזיר תווית קטגוריה בעברית
   * דוגמה: 'Dessert' -> 'קינוחים'
   */
  getCategoryLabel(category: string): string {
    return this.recipeData.getCategoryLabel(category);
  }
}