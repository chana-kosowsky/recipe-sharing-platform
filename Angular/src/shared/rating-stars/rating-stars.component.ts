import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-rating-stars',
  imports: [],
  templateUrl: './rating-stars.component.html',
  styleUrl: './rating-stars.component.css'
})
export class RatingStarsComponent {
  @Input() rating: number = 0;  // הדירוג הנוכחי (0-5)

  @Input() readonly: boolean = false;  // האם לקרוא בלבד?

  @Input() size: 'small' | 'medium' | 'large' = 'medium';

 
//משדר את הדירוג החדש כאשר המשתמש בוחר דירוג חדש
  @Output() ratingChange = new EventEmitter<number>();

 
//מערך שמייצג את מספר הכוכבים להצגה
  stars: number[] = [1, 2, 3, 4, 5];
//דירוג שמוצג בזמן שהעכבר מעל הככוכב
  hoveredRating: number = 0;
 
// קולט לחיצה על כוכב,מעדכן את הדירוג ומשדר את האירוע
  onStarClick(star: number): void {
     console.log('🌟 דירוג נבחר:', this.rating);   
    if (this.readonly) return; 
    this.rating = star;
    this.ratingChange.emit(star);

  }

  //מעבר עם העכבר על כוכב
  onStarHover(star: number): void {
    if (this.readonly) return;
    this.hoveredRating = star;

  }

  //יציאה עם העכשבר מהכוכב
  onStarLeave(): void {
    this.hoveredRating = 0;

  }

  //בודק אם כוכב צריך להיות מלא בהתאם לדירוג הנוכחי או לhover 
  isStarFilled(star: number): boolean {
    const currentRating = this.hoveredRating || this.rating;
    return star <= currentRating;

  }

}

