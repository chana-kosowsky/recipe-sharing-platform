import { Component } from '@angular/core';
import { RecipeService } from '../../service/recipe.service';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TypeBadgeComponent } from '../../shared/type-badge/type-badge.component';
import { RecipeDataService } from '../../service/recipe-data.service';
import { Recipe } from '../../interfaces/recipe';

@Component({
  selector: 'app-recipe-list',
  imports: [FormsModule, RouterModule,CommonModule,TypeBadgeComponent],
  templateUrl: './recipe-list.component.html',
  styleUrl: './recipe-list.component.css',
  
})
export class RecipeListComponent {

allRecipes: Recipe[] = [];         //רשימת המתכונים מהשרת
displayedRecipes: Recipe[] = []; //המתכונים המוצגים אחרי סינון ומיון  
 
 //סינונים
 selectedType: string | null = null; // 'Dairy', 'Meat', 'Parve' או null סינון
 selectedCategory: string = '';
 searchText: string = '';

   // מיון
sortBy: 'newest' | 'oldest' | 'name' | 'time' | 'rating' | null = null;
sortOrder: 'asc' | 'desc' = 'asc';
  //סטטוס
isLoading: boolean = true;    // האם בטעינה שימושי להצגת spinner?
errorMessage: string = '';    // הודעת שגיאה
     

  constructor(
    private recipeService: RecipeService,
    private router:Router,
    public recipeData: RecipeDataService,
    private route: ActivatedRoute
    ) {}
  
 
  // טעינת המתכונים בעת אתחול
    ngOnInit(): void {   
  // מאזינים לפרמטרים ב-URL   
    this.route.queryParams.subscribe(params => {
      const category = params['category'] || null;
      this.selectedCategory = category
      this.loadRecipes(category);
    });
  }
  
  
   //שולפת את כל המתכונים מהשרת
  loadRecipes(category: string | null = null): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.recipeService.getAllRecipes().subscribe({
      next: (response: any) => {
        this.allRecipes = response.recipes;     

         this.applyFiltersAndSort(); 
        this.isLoading = false;
        console.log('✅ נטענו מתכונים:', this.allRecipes);
        
      },
      error: (err: any) => {
        this.errorMessage = 'שגיאה בטעינת המתכונים. נסה שוב מאוחר יותר.';
        this.isLoading = false;
        console.error('❌ שגיאה:', err);
      }
    });
  }
  get recipeTypes() {
    return [
      { value: '', label: 'הכל' },
      ...this.recipeData.recipeTypes
    ];
  }

  // רשימת קטגוריות - עם אפשרות "כל הקטגוריות"
  get recipeCategories() {
    return [
      { value: '', label: 'כל הקטגוריות', emoji: '📂' },
      ...this.recipeData.recipeCategories
    ];
  }
  
   // הפונקציה הראשית - רק מתאמת בין הסינון והמיון
   // לא עושה את העבודה בעצמה!
  
  applyFiltersAndSort(): void {
    // שלב 1: סינון
    let filtered = this.filterRecipes(this.allRecipes);
    
    // שלב 2: מיון
    let sorted = this.sortRecipes(filtered);
    
    // שלב 3: עדכון
    this.displayedRecipes = sorted;
    
    console.log(`🎯 מוצגים: ${this.displayedRecipes.length}/${this.allRecipes.length}`);
  }
  
    
  // סינון
 
  // מפעיל את כל הסינונים  
  private filterRecipes(recipes: Recipe[]): Recipe[] {
    let result = [...recipes];
    
    result = this.filterByType(result);
    result = this.filterByCategory(result);
    result = this.filterBySearch(result);
    
    return result;
  }
  
   // סינון לפי סוג מתכון (חלבי/בשרי/פרווה)
   // מופעל כשלוחצים על TypeBadge
   
  filterByType(recipes: Recipe[]): Recipe[] {    
      if (!this.selectedType) {
      return recipes;
    }    
    return recipes.filter(r => r.type === this.selectedType);
  }
 
   // סינון לפי קטגוריה (עיקריות/קינוחים/...)
  
  private filterByCategory(recipes: Recipe[]): Recipe[] {
    if (!this.selectedCategory) {
      return recipes;
    }
    
    return recipes.filter(r => r.category === this.selectedCategory);
  }
   
   // סינון לפי טקסט חיפוש
   
  private filterBySearch(recipes: Recipe[]): Recipe[] {
    if (!this.searchText.trim()) {
      return recipes;
    }
    
    const searchLower = this.searchText.toLowerCase().trim();
    
    return recipes.filter(r =>
      r.title.toLowerCase().includes(searchLower) ||
      r.author.toLowerCase().includes(searchLower)
    );}

  //פונקצית מיון
  
  
   // מיון המתכונים לפי הבחירה הנוכחית
  
  private sortRecipes(recipes: Recipe[]): Recipe[] {
    // ללא מיון - החזר כמו שזה
    if (!this.sortBy) {
      return recipes;
    }
    
    const sorted = [...recipes];
    
    switch (this.sortBy) {
      case 'newest':
        return this.sortByNewest(sorted);
      case 'oldest':
        return this.sortByOldest(sorted);
      case 'name':
        return this.sortByName(sorted);
      case 'time':
        return this.sortByTime(sorted);
      case 'rating':
        return this.sortByRating(sorted);
      default:
        return sorted;
    }
  }
  
 
   // מיון לפי חדשים ביותר
   
  private sortByNewest(recipes: Recipe[]): Recipe[] {
    return recipes.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }
  
  
   // מיון לפי ישנים ביותר
   
  private sortByOldest(recipes: Recipe[]): Recipe[] {
    return recipes.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }
  
 
   // מיון לפי שם (א-ת)
  
  private sortByName(recipes: Recipe[]): Recipe[] {
    return recipes.sort((a, b) => 
      a.title.localeCompare(b.title, 'he')
    );
  }
  
 
   // מיון לפי זמן הכנה (מהר ביותר)
   
  private sortByTime(recipes: Recipe[]): Recipe[] {
    return recipes.sort((a, b) => 
      a.preparation_time - b.preparation_time
    );
  }
  //שינוי מיון
  changeSortBy(criteria: 'time' | 'rating'): void {
   // אם המשתמש לוחץ על קריטריון שכבר פעיל
  if (this.sortBy === criteria) {
    if (this.sortOrder === 'asc') {
      // שלב א: אם זה היה בסדר עולה (asc), נעבור לסדר יורד (desc)
      this.sortOrder = 'desc';
    } else {
      // שלב ב: אם זה כבר היה בסדר יורד (desc), נבטל את המיון לגמרי (נחזור ל-null)
      this.sortBy = null;
      this.sortOrder = 'asc'; // איפוס ברירת מחדל לפעם הבאה
    }
  } else {
    // אם לוחצים על קריטריון חדש
    this.sortBy = criteria;
    this.sortOrder = 'asc';
  }
    this.applyFiltersAndSort();
  }
  
  
  // מיון לפי דירוג (גבוה ביותר)
   
  private sortByRating(recipes: Recipe[]): Recipe[] {
    return recipes.sort((a, b) => 
      (b.average_rating || 0) - (a.average_rating || 0)
    );
  }
  
   // מופעל כשלוחצים על Badge סוג
  
  onTypeFilter(type: string): void {
    this.selectedType = type;
    this.applyFiltersAndSort();
  }
 
    // איפוס
 
   // מנקה את כל הסינונים והמיונים
   
  //   איפוס כל הסינונים
   
  resetFilters(): void {
    this.selectedType = '';
    this.selectedCategory = '';
    this.searchText = '';
    this.sortBy = 'newest';
    this.applyFiltersAndSort();
  }


  // בדיקות

 
  // בודק אם יש סינון או מיון פעיל
   
  hasActiveFilters(): boolean {
    return !!(this.selectedType || this.selectedCategory || this.searchText.trim()||this.sortBy !== null);
  }
  
   // ניווט לפרטי מתכון
   
  viewRecipe(id: number): void {
    this.router.navigate(['/recipe', id]);
  }
 
  // פונקציות עזר
 
 getRecipeImage(recipe: any): string {
    if (recipe.image_path && recipe.image_path !== 'placeholder.jpg' && recipe.image_path !== '') {
      return this.recipeService.getImageUrl(recipe.user_id,recipe.image_path);
    }
    return this.recipeData.getPlaceholderImage(recipe.type);
  }
  
  getCategoryLabel(category: string): string {
    return this.recipeData.getCategoryLabel(category); 
  }
  
  getCategoryEmoji(category: string): string {
    return this.recipeData.getCategoryEmoji(category); 
  }}