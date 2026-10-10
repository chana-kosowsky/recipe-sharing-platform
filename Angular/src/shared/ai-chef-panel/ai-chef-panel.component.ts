/**
 * ai-chef-panel.component.ts
 * ===========================
 * פאנל "שף AI" - כפתור צף שפותח מגירה צידית.
 * המגירה כוללת כפתורי התאמה מהירה (טבעוני, חצי וכו') וצ'אט חופשי.
 * הקומפוננטה דורשת [recipe] כקלט - כל הקריאות ל-AI מתבצעות בהקשר של המתכון הזה.
 */

import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService, AdaptationType, AdaptedRecipe, ChatTurn } from '../../service/ai.service';
import { Recipe } from '../../interfaces/recipe';

// הגדרת כפתורי ההתאמה המהירה - תווית עברית + מפתח שמתאים לשרת
interface AdaptButton {
  key: AdaptationType;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-ai-chef-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-chef-panel.component.html',
  styleUrl: './ai-chef-panel.component.css'
})
export class AiChefPanelComponent {
  // המתכון שעליו נשאל ה-AI (נמסר מההורה)
  @Input({ required: true }) recipe!: Recipe;

  // האם המגירה פתוחה? (signal כדי לעדכן UI מיידית)
  isOpen = signal(false);

  // היסטוריית הצ'אט הנוכחית
  messages = signal<ChatTurn[]>([]);

  // טקסט שהמשתמש מקליד עכשיו
  draft = '';

  // מצב טעינה לצ'אט (תשובה מהשרת בדרך)
  isThinking = signal(false);

  // מצב טעינה להתאמה (טבעוני וכו')
  adaptingType = signal<AdaptationType | null>(null);

  // התוצאה של ההתאמה האחרונה - מוצגת בקופסה
  adaptedResult = signal<{ recipe: AdaptedRecipe; label: string } | null>(null);

  // הודעת שגיאה כללית
  errorMessage = signal<string>('');

  // הגדרות כפתורי ההתאמה המהירה
  readonly adaptButtons: AdaptButton[] = [
    { key: 'vegan',        label: 'טבעוני',        icon: 'fa-leaf' },
    { key: 'gluten_free',  label: 'ללא גלוטן',     icon: 'fa-wheat-awn' },
    { key: 'lactose_free', label: 'ללא לקטוז',    icon: 'fa-cheese' },
    { key: 'half',         label: 'חצי כמות',      icon: 'fa-divide' },
    { key: 'double',       label: 'כפול כמות',     icon: 'fa-xmark' }
  ];

  constructor(private aiService: AiService) {}

  // פתיחה / סגירה של המגירה
  toggle(): void {
    this.isOpen.update(v => !v);
  }

  close(): void {
    this.isOpen.set(false);
  }

  // שליחת הודעה לצ'אט
  sendMessage(): void {
    const text = this.draft.trim();
    if (!text || this.isThinking()) return;

    // מוסיפים את ההודעה של המשתמש להיסטוריה ומאפסים את הקלט
    const userTurn: ChatTurn = { role: 'user', text };
    this.messages.update(m => [...m, userTurn]);
    this.draft = '';
    this.isThinking.set(true);
    this.errorMessage.set('');

    // ההיסטוריה שאנחנו שולחים לשרת לא כוללת את ההודעה הנוכחית (היא ב-message)
    const historyForServer = this.messages().slice(0, -1);

    this.aiService.chat(this.recipe.id, text, historyForServer).subscribe({
      next: (response) => {
        this.messages.update(m => [...m, { role: 'model', text: response.reply }]);
        this.isThinking.set(false);
        this.scrollChatToBottom();
      },
      error: (err) => {
        this.isThinking.set(false);
        this.errorMessage.set(err.error?.error || 'שגיאה בקריאה ל-AI');
      }
    });
  }

  // בקשת התאמה (כפתור מהיר)
  requestAdaptation(type: AdaptationType): void {
    if (this.adaptingType()) return;  // כבר פעיל

    this.adaptingType.set(type);
    this.errorMessage.set('');
    this.adaptedResult.set(null);

    this.aiService.adapt(this.recipe.id, type).subscribe({
      next: (response) => {
        this.adaptedResult.set({ recipe: response.adapted_recipe, label: response.label });
        this.adaptingType.set(null);
      },
      error: (err) => {
        this.adaptingType.set(null);
        this.errorMessage.set(err.error?.error || 'שגיאה בקריאה ל-AI');
      }
    });
  }

  // סגירת תצוגת המתכון המותאם
  closeAdapted(): void {
    this.adaptedResult.set(null);
  }

  // ניקוי שיחת הצ'אט
  clearChat(): void {
    this.messages.set([]);
    this.errorMessage.set('');
  }

  // גלילה לסוף שיחת הצ'אט (מבוצע בקיק-באק קצר כדי לתת ל-DOM להתעדכן)
  private scrollChatToBottom(): void {
    setTimeout(() => {
      const el = document.querySelector('.chef-panel__messages');
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }

  // עוזרת לתצוגה - שובר הוראות לפי שורות חדשות (כמו ב-recipe-detail)
  splitInstructions(text: string): string[] {
    return (text || '').split('\n').map(s => s.trim()).filter(s => s.length > 0);
  }
}
