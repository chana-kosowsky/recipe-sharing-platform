import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RecipeDataService {

  constructor() { }
  
  // =============================
  // רשימות משותפות
  // =============================
  
  /**
   * רשימת סוגי מתכונים (חלבי/בשרי/פרווה)
   */
  readonly recipeTypes = [
    { value: 'Dairy', label: 'חלבי', emoji: '🥛', color: '#4fc3f7' },
    { value: 'Meat', label: 'בשרי', emoji: '🥩', color: '#ef5350' },
    { value: 'Parve', label: 'פרווה', emoji: '🌿', color: '#66bb6a' }
  ];
  
  /**
   * רשימת יחידות מידה לרכיבים
   */
  readonly commonUnits = [
    'יחידות', 'כוסות', 'כפות', 'כפיות', 'גרם', 'קילו', 'ליטר', 'מ"ל'
  ];
  
  /**
   * רשימת קטגוריות מתכונים
   */
  readonly recipeCategories = [
    { value: 'Main', label: 'עיקריות', emoji: '🍽️', color: '#FF6B6B' },
    { value: 'Dessert', label: 'קינוחים', emoji: '🍰', color: '#FFB6C1' },
    { value: 'Salad', label: 'סלטים', emoji: '🥗', color: '#90EE90' },
    { value: 'Soup', label: 'מרקים', emoji: '🍜', color: '#FFA07A' },
    { value: 'Bread', label: 'לחמים ומאפים', emoji: '🥖', color: '#DEB887' },
    { value: 'Beverage', label: 'משקאות', emoji: '🍹', color: '#87CEEB' },
    { value: 'Appetizer', label: 'מנות פתיחה', emoji: '🍕', color: '#FFD700' },
    { value: 'Other', label: 'אחר', emoji: '🌮', color: '#B0B0B0' }
  ];

  // =============================
  // פונקציות עזר - סוג מתכון (Type)
  // =============================
  
  /**
   * מחזיר אימוג'י לפי סוג מתכון
   * @param type - 'Dairy', 'Meat', 'Parve'
   * @returns אימוג'י מתאים
   */
  getTypeEmoji(type: string): string {
    const typeObj = this.recipeTypes.find(t => t.value === type);
    return typeObj ? typeObj.emoji : '🍽️';
  }

  /**
   * מחזיר תרגום עברי לסוג מתכון
   * @param type - 'Dairy', 'Meat', 'Parve'
   * @returns תרגום עברי
   */
  getTypeLabel(type: string): string {
    const typeObj = this.recipeTypes.find(t => t.value === type);
    return typeObj ? typeObj.label : type;
  }

  /**
   * מחזיר צבע לסוג מתכון
   * @param type - 'Dairy', 'Meat', 'Parve'
   * @returns קוד צבע HEX
   */
  getTypeColor(type: string): string {
    const typeObj = this.recipeTypes.find(t => t.value === type);
    return typeObj ? typeObj.color : '#9e9e9e';
  }

  // =============================
  // פונקציות עזר - קטגוריה (Category)
  // =============================
  
  /**
   * מחזיר אימוג'י לפי קטגוריה
   * @param category - 'Main', 'Dessert', 'Salad', etc.
   * @returns אימוג'י מתאים
   */
  getCategoryEmoji(category: string): string {
    const cat = this.recipeCategories.find(c => c.value === category);
    return cat ? cat.emoji : '🌮';
  }

  /**
   * מחזיר תרגום עברי לקטגוריה
   * @param category - 'Main', 'Dessert', 'Salad', etc.
   * @returns תרגום עברי
   */
  getCategoryLabel(category: string): string {
    const cat = this.recipeCategories.find(c => c.value === category);
    return cat ? cat.label : 'אחר';
  }

  /**
   * מחזיר צבע לקטגוריה
   * @param category - 'Main', 'Dessert', 'Salad', etc.
   * @returns קוד צבע HEX
   */
  getCategoryColor(category: string): string {
    const cat = this.recipeCategories.find(c => c.value === category);
    return cat ? cat.color : '#B0B0B0';
  }

  // =============================
  // פונקציות Utility
  // =============================
  
  /**
   * מחזירה תמונת placeholder כ-SVG דינמי
   * כשאין תמונה למתכון - מציגים SVG צבעוני עם אימוג'י
   * 
   * @param type - סוג המתכון
   * @returns Data URL של SVG
   */
  getPlaceholderImage(type: string): string {
    const color = this.getTypeColor(type).replace('#', '%23');
    const emoji = this.getTypeEmoji(type);
    
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='${color}'/%3E%3Ctext x='50%25' y='50%25' font-size='80' text-anchor='middle' dy='.3em'%3E${emoji}%3C/text%3E%3C/svg%3E`;
  }

  /**
   * בדיקה האם סוג מתכון תקין
   * @param type - סוג לבדיקה
   * @returns האם קיים ברשימה
   */
  isValidType(type: string): boolean {
    return this.recipeTypes.some(t => t.value === type);
  }

  /**
   * בדיקה האם קטגוריה תקינה
   * @param category - קטגוריה לבדיקה
   * @returns האם קיימת ברשימה
   */
  isValidCategory(category: string): boolean {
    return this.recipeCategories.some(c => c.value === category);
  }
}
