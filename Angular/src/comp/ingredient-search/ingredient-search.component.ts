import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { RecipeService } from '../../service/recipe.service';
import { TypeBadgeComponent } from '../../shared/type-badge/type-badge.component';
import { RecipeDataService } from '../../service/recipe-data.service';
import { Recipe } from '../../interfaces/recipe';


@Component({
  selector: 'app-ingredient-search',
  imports: [CommonModule, FormsModule, RouterModule,TypeBadgeComponent],
  templateUrl: './ingredient-search.component.html',
  styleUrl: './ingredient-search.component.css'
})
export class IngredientSearchComponent {

  // משתנים
   
  // רכיב נוכחי שהמשתמש מקליד
  currentIngredient: string = '';
  
  // רשימת הרכיבים שנוספו
  ingredients: string[] = [];
  allSearchResults:  any[] = []; // כל המתכונים שהגיעו מהשרת לפי הרכיבים
  // תוצאות החיפוש
  searchResults: any[] = [];
    //  משתנה למעקב אחרי הסינון הנוכחי
  selectedType: string | null = null;
  
  // האם בתהליך חיפוש?
  isSearching: boolean = false;
  
  // האם בוצע חיפוש?
  hasSearched: boolean = false;
  
  // הודעות
  errorMessage: string = '';

  // ============================================================
  // נתוני "מילוי" לדף - תמיכה ויזואלית למצב הריק (לא משפיע על הלוגיקה)
  // ============================================================

  // רכיבים פופולריים להוספה מהירה בקליק אחד
  readonly popularIngredients: string[] = [
    'ביצים', 'קמח', 'סוכר', 'חלב', 'גבינה',
    'שמן זית', 'עגבניות', 'בצל', 'שום', 'אורז',
    'פסטה', 'עוף', 'בשר טחון', 'גזר', 'תרד',
    'שוקולד', 'חמאה', 'לימון'
  ];

  // ערכות מוכנות - מילוי רכיבים אופייני ללחיצה אחת
  readonly presets = [
    { id: 'baking',    icon: 'fa-cake-candles', title: 'אפייה בסיסית', subtitle: 'עוגות · עוגיות · מאפים',
      items: ['קמח','סוכר','ביצים','חמאה','שמרים','אבקת אפייה'] },
    { id: 'breakfast', icon: 'fa-egg',          title: 'ארוחת בוקר',    subtitle: 'התחלה טעימה ליום',
      items: ['ביצים','גבינה','עגבניות','חלב','לחם','חמאה'] },
    { id: 'pasta',     icon: 'fa-bowl-food',    title: 'מנת פסטה',      subtitle: 'איטלקית אותנטית',
      items: ['פסטה','עגבניות','שום','שמן זית','פרמזן','בזיליקום'] },
    { id: 'salad',     icon: 'fa-leaf',         title: 'סלט בריא',       subtitle: 'קליל ומלא טעמים',
      items: ['עגבניות','מלפפונים','חסה','שמן זית','לימון','גבינת פטה'] }
  ];

  // טוען רשימת רכיבים מ-preset - חוזר ל-addIngredient הקיים כדי לעבור דרך הוולידציה
  loadPreset(items: string[]): void {
    items.forEach(item => {
      this.currentIngredient = item;
      this.addIngredient();
    });
  }

  // קיצור דרך - הוספת רכיב יחיד בלחיצה (משמש בצ'יפים של הרכיבים הפופולריים)
  quickAdd(item: string): void {
    this.currentIngredient = item;
    this.addIngredient();
  }

  constructor(
    private recipeService: RecipeService,
    private router: Router,
    private recipeData: RecipeDataService
  ) {}
  

  // הוספת רכיב לרשימה  
  addIngredient(): void {
    const ingredient = this.currentIngredient.trim();
    
    // בדיקות תקינות
    if (!ingredient) {
      return;
    }
    
    if (ingredient.length < 2) {
      this.errorMessage = 'שם הרכיב חייב להכיל לפחות 2 תווים';
      return;
    }
    
    // בדיקה אם כבר קיים
    const lowerIngredient = ingredient.toLowerCase();
    if (this.ingredients.some(ing => ing.toLowerCase() === lowerIngredient)) {
      this.errorMessage = 'הרכיב כבר קיים ברשימה';
      return;
    }
    
    // הוספה
    this.ingredients.push(ingredient);
    this.currentIngredient = '';
    this.errorMessage = '';
    
    console.log('✅ רכיב נוסף:', ingredient);
  }
  
  // =============================
  // הסרת רכיב מהרשימה
  // =============================
  removeIngredient(index: number): void {
    this.ingredients.splice(index, 1);
  }
  
  // =============================
  // ביצוע חיפוש
  // =============================
  search(): void {
    // בדיקה שיש רכיבים
    if (this.ingredients.length === 0) {
      this.errorMessage = 'הוסף לפחות רכיב אחד לחיפוש';
      return;
    }
    
    this.isSearching = true;
    this.errorMessage = '';
    this.hasSearched = false;
    this.selectedType = null;
    console.log('🔍 מחפש מתכונים לפי:', this.ingredients);
    
    this.recipeService.searchByIngredients(this.ingredients).subscribe({
      next: (response:any) => {
        this.allSearchResults = response.recipes || [];
        this.searchResults = [...this.allSearchResults];
        this.isSearching = false;
        this.hasSearched = true;
        
        console.log(`✅ נמצאו ${this.searchResults.length} מתכונים`);
      },
      error: (error: HttpErrorResponse) => {
        console.error('❌ שגיאה בחיפוש:', error);
        this.errorMessage = error.error?.error || 'שגיאה בחיפוש מתכונים';
        this.isSearching = false;
        this.hasSearched = true;
      }
    });
  }
  
  // =============================
  // איפוס החיפוש
  // =============================
  reset(): void {
    this.ingredients = [];
    this.allSearchResults = [];
    this.searchResults = [];
    this.currentIngredient = '';
    this.errorMessage = '';
    this.hasSearched = false;
     this.selectedType = null; 
  }
  
  // =============================
  // ניווט למתכון
  // =============================
  viewRecipe(recipeId: number): void {
    this.router.navigate(['/recipe', recipeId]);
  }
  
  //סינון לפי סוג
  onTypeClick(type: string): void {
    // אם לוחצים על אותו סוג שכבר מסונן - מחזירים להצגת הכל
    if (this.selectedType === type) {
      this.showAllResults();
    } else {
      this.selectedType = type;
      // מסננים מתוך המאגר המלא ושומרים במוצגים
      this.searchResults = this.allSearchResults.filter(res => res.recipe.type === type);
    }
  }
  // ⭐ שינוי: פונקציה ייעודית לחזרה לכל התוצאות (המסוננות לפי רכיבים)
  showAllResults(): void {
    this.selectedType = null;
    this.searchResults = [...this.allSearchResults];
  }
 
  getMatchColor(score: number): string {
    if (score >= 0.8) return '#4caf50';  // ירוק
    if (score >= 0.5) return '#ff9800';  // כתום
    return '#f44336';  // אדום
  }
    getRecipeImage(recipe: any): string {
  if (recipe.image_path) {
      // שימוש בפונקציה מהסרוויס שלך: getImageUrl
      return this.recipeService.getImageUrl(recipe.user_id,recipe.image_path);
    }
    return this.recipeData.getPlaceholderImage(recipe.type);
  }
}

