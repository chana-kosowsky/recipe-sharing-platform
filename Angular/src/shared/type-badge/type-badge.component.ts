import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RecipeDataService } from '../../service/recipe-data.service';

@Component({
  selector: 'app-type-badge',
  imports: [],
  templateUrl: './type-badge.component.html',
  styleUrl: './type-badge.component.css'
})
export class TypeBadgeComponent {
@Input() type: string = '';//סוג המתכון
//שידור סוג המתכון שנלחץ
@Output() typeClicked = new EventEmitter<string>();

  constructor(
    public recipeData: RecipeDataService  //הזרקה מהסרוויס לקבלת אימוג'י צבע וכו
  ) {}
//קולט לחיצה על הבאג' מונע העלטת האירוע ומפיץ את הסוג לאבא
  onBadgeClick(event: MouseEvent) {
    event.stopPropagation();
    this.typeClicked.emit(this.type);
  }

  // =============================
  // ⭐ פונקציות פשוטות - מפנות ל-Service!
  // =============================

  get emoji(): string {
    return this.recipeData.getTypeEmoji(this.type);
  }

  get label(): string {
    return this.recipeData.getTypeLabel(this.type);
  }

  get color(): string {
    return this.recipeData.getTypeColor(this.type);
  }
}
