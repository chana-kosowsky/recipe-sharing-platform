/**
 * ai.service.ts
 * ==============
 * סרוויס שמתקשר עם נתיבי ה-AI בבק-אנד.
 * אין כאן שום קריאה ישירה ל-Gemini - הכל עובר דרך השרת שלנו
 * כדי שמפתח ה-API לא ייחשף בדפדפן.
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// סוגי ההתאמות שאפשר לבקש מהשרת
export type AdaptationType = 'vegan' | 'gluten_free' | 'lactose_free' | 'half' | 'double';

// מבנה הודעה בהיסטוריית הצ'אט
export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

// תשובת השרת על /ai/chat
export interface ChatResponse {
  reply: string;
}

// מבנה מתכון מותאם שמגיע מ-/ai/adapt
export interface AdaptedRecipe {
  title: string;
  preparation_time: number;
  ingredients: Array<{ product: string; amount: string; unit: string }>;
  instructions: string;
  summary_of_changes: string;
}

// תשובת השרת על /ai/adapt
export interface AdaptResponse {
  adapted_recipe: AdaptedRecipe;
  adaptation: AdaptationType;
  label: string;
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly apiUrl = 'http://localhost:5000/api/ai';

  constructor(private http: HttpClient) {}

  // שליחת שאלה לצ'אט עם השף (כולל היסטוריה לשמירת הקונטקסט)
  chat(recipeId: number, message: string, history: ChatTurn[] = []): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.apiUrl}/chat`, {
      recipe_id: recipeId,
      message,
      history
    });
  }

  // בקשת התאמה של מתכון (טבעוני / חצי וכו') - מחזיר מתכון מותאם מובנה
  adapt(recipeId: number, adaptation: AdaptationType): Observable<AdaptResponse> {
    return this.http.post<AdaptResponse>(`${this.apiUrl}/adapt`, {
      recipe_id: recipeId,
      adaptation
    });
  }
}
