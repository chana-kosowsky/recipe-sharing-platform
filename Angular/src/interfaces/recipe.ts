import { Ingredient } from "./ingredient";



export interface Recipe {
  
  id: number;
  title: string;                    // שם המתכון
  instructions: string;             // הוראות הכנה
  preparation_time: number;         // זמן הכנה בדקות
  type: 'Dairy' | 'Meat' | 'Parve'; // סוג מתכון
  category: string;                // קטגוריה (עיקריות, קינוחים...)
  average_rating: number;           // דירוג ממוצע
  image_path: string | null;        // נתיב לתמונה
  variation_paths?: string;         // וריאציות תמונה (JSON)
  author: string;                   // שם המחבר
  // user_id?: number;               // ID של המחבר (אופציונלי)
  ingredients: Ingredient[];         // רשימת רכיבים
  created_at: string;               // תאריך יצירה
  user_id:number;
}


