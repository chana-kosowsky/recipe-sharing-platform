import { HttpClient,HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
public readonly baseUrl = 'http://localhost:5000';
  private readonly apiUrl = `${this.baseUrl}/api/recipes`;
 
  constructor(private http:HttpClient) {}
    //מביא את כל המתכונים
  getAllRecipes(): Observable<any> {
  return this.http.get(this.apiUrl);
}


 // מביא מתכון בודד לפי ID
getRecipeById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

//הוספת מתכון
createRecipe(formData: FormData): Observable<any> {
    return this.http.post(this.apiUrl, formData);
  }

// ניתוב לתמונות
getImageUrl(userId: number | undefined, filename: string | undefined | null): string {
  if (!userId || !filename) return '';
  let x=`${this.baseUrl}/api/uploads/${userId}/${filename}`
  console.log('my pic',x)
  return `${this.baseUrl}/api/uploads/user_${userId}/${filename}`;

}

 // חיפוש מתכונים לפי רכיבים

searchByIngredients(ingredients: string[]): Observable<any> {
  return this.http.post(`${this.apiUrl}/search-by-ingredients`, {
    ingredients: ingredients
  });
}
// ===================================
// מחיקת מתכון (Admin בלבד)
// ===================================
// אין יותר קריאה ל-localStorage. הבק-אנד מאמת שזה Admin דרך @admin_required
// (זהות נקבעת מהעוגייה החתומה - אי אפשר לזייף).
deleteRecipe(recipeId: number): Observable<any> {
  return this.http.delete(`${this.apiUrl}/${recipeId}`);
}

// ===================================
// דירוג מתכון
// ===================================
// פרמטר userId הוסר - הזהות מגיעה מהעוגייה.
rateRecipe(recipeId: number, rating: number): Observable<any> {
  return this.http.post(`${this.apiUrl}/${recipeId}/rate`, {
    rating: rating
  });
}

// ===================================
// קבלת הדירוג של המשתמש המחובר למתכון
// ===================================
// אין יותר user_id ב-URL - הבק-אנד מזהה את המשתמש מהעוגייה ומחזיר את הדירוג שלו בלבד.
getUserRating(recipeId: number): Observable<any> {
  return this.http.get(`${this.apiUrl}/${recipeId}/user-rating`);
}

}