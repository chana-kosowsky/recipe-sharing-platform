import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Recipe } from '../../interfaces/recipe';
import { RecipeService } from '../../service/recipe.service';
import { RecipeDataService } from '../../service/recipe-data.service';
import { RatingStarsComponent } from '../../shared/rating-stars/rating-stars.component';

@Component({
  selector: 'app-home',
  imports: [RatingStarsComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  //משתנים

  //כל המתכונים שהגיעו מהשרת
  allRecipes: Recipe[] = [];
 //רשימת מתכונים מומלצים ממוינים לפי דירוג למעט מתכון השבוע
  recommendedRecipes: Recipe[] = [];
  //מתכון השבוע הנבחר
  recipeOfTheWeek: Recipe|null = null;
  isLoading: boolean = true;

  constructor(
    private recipeService: RecipeService,
    public recipeData: RecipeDataService, // לשימוש ב-HTML עבור קטגוריות
    private router: Router,
    
  ) {}

  ngOnInit(): void {
    this.loadRecipes();
  }
//טעינת המתכונים מהשרת
  loadRecipes(): void {
    this.isLoading = true;
    this.recipeService.getAllRecipes().subscribe({
      next: (response: any) => {
        const recipes = response.recipes || [];
        if (recipes.length === 0) {
          this.isLoading = false;
          return;
        }

        // 1. מיון כל המתכונים לפי דירוג מהגבוה לנמוך
        const sortedByRating = [...recipes].sort((a, b) => b.average_rating - a.average_rating);

        // 2. הגדרת טווח של שבוע אחרון
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        // 3. מציאת מתכונים מהשבוע האחרון
        const recentRecipes = sortedByRating.filter(r => new Date(r.created_at) >= oneWeekAgo);

        // 4. קביעת מתכון השבוע
        if (recentRecipes.length > 0) {
          // יש מתכונים חדשים - ניקח את המדורג ביותר מביניהם
          this.recipeOfTheWeek = recentRecipes[0];
        } else {
          // אין מתכונים חדשים נבחר את המתכון המומלץ ביותר שקיים
          this.recipeOfTheWeek = sortedByRating[0];
        }

        // 5. רשימת המומלצים - כל המתכונים ממוינים לפי דירוג, למעט זה שנבחר כ"מתכון השבוע"
        this.recommendedRecipes = sortedByRating.filter(r => r.id !== this.recipeOfTheWeek!.id).slice(0, 8);;

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading recipes:', err);
        this.isLoading = false;
      }
    });
  }

  // פונקציית עזר לבדיקה אם מתכון הוא מהשבוע האחרון (עבור התגית ב-HTML)
  isRecent(date: string): boolean {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return new Date(date) >= oneWeekAgo;
  }

  
   getRecipeImage(recipe: any): string {
  if (recipe.image_path) {
      // שימוש בפונקציה מהסרוויס שלך: getImageUrl
      return this.recipeService.getImageUrl(recipe.user_id,recipe.image_path);
    }
    return this.recipeData.getPlaceholderImage(recipe.type);
  }

  goToRecipe(id: number): void {
    this.router.navigate(['/recipe', id]);
  }
//סינון מתכונים לפי קטגוריה
  filterByCategory(category: string): void {
    this.router.navigate(['/recipes'], { queryParams: { category: category } });
  }
}