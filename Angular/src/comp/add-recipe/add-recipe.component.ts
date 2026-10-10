import { Component } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RecipeService } from '../../service/recipe.service';
import { RecipeDataService } from '../../service/recipe-data.service';
import { AuthService } from '../../service/auth.service';
import { filter, take } from 'rxjs/operators';


@Component({
  selector: 'app-add-recipe',
  imports: [ReactiveFormsModule],
  templateUrl: './add-recipe.component.html',
  styleUrl: './add-recipe.component.css',
 
})
export class AddRecipeComponent {

  // טופס Reactive

  recipeForm!: FormGroup;//נוח ליצור את הטופס בTS כי יש חלקים דינמיים
  
  // הודעות
  successMessage: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;
  
  // נתוני משתמש מחובר
  currentUser: any = null;
 //נתוני אפשרויות
   get recipeTypes() {
    return this.recipeData.recipeTypes;
  }
  get recipeCategories() {
    return this.recipeData.recipeCategories;
  }
   get commonUnits() {
    return this.recipeData.commonUnits;
  }
  
 //נתיבי תמונה
  selectedImage: File | null = null;
  imagePreview: string | null = null;
   isDragOver=false
  constructor(
    private recipeService: RecipeService,
    private router: Router,
    private recipeData: RecipeDataService,
    private authService: AuthService
  ) {}


  ngOnInit(): void {
    // טעינת משתמש מחובר (ממתין שבדיקת /me תסתיים)
    this.loadCurrentUser();
    // יצירת הטופס
    this.initForm();
  }
  

  // אתחול הטופס
    private initForm(): void {
    this.recipeForm = new FormGroup({
      title: new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(200)
      ]),
      type: new FormControl('Parve', [Validators.required]),
       category: new FormControl('Other', [Validators.required]), //קטגוריה
      preparation_time: new FormControl('', [
        Validators.required,
        Validators.min(1),
        Validators.max(1440)
      ]),
      instructions: new FormControl('', [
        Validators.required,
        Validators.minLength(20)
      ]),
      ingredients: new FormArray([])  // מערך דינמי של רכיבים
    });
    
    // הוספת רכיב ריק ראשון
    this.addIngredient();
  }
  
  
  // ===================================
  // טעינת המשתמש המחובר מ-AuthService
  // ===================================
  // ממתינים שבדיקת ה-/me הראשונית תסתיים, ואז:
  // - אין משתמש → ניתוב למסך לוגין
  // - יש משתמש שאינו Uploader → הודעת שגיאה (משאירים על המסך כדי שיראה את הסטטוס שלו)
  // - יש Uploader → הכל בסדר, אפשר להמשיך למלא את הטופס
  private loadCurrentUser(): void {
    this.authService.isReady$.pipe(
      filter(ready => ready),
      take(1)
    ).subscribe(() => {
      const user = this.authService.currentUserValue;
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }
      this.currentUser = user;
      if (!user.is_approved_uploader) {
        this.errorMessage = 'אין לך הרשאה להעלות מתכונים. פנה למנהל המערכת.';
      }
    });
  }
  //גרירת תמונה
  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }
//בחירת תמונה
  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.handleFile(file);
    }
  }
//פונקציה לטיפול בתמונה
  handleFile(file: File) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.errorMessage = 'פורמט הקובץ חייב להיות JPG, PNG או WEBP';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'הקובץ גדול מדי (מקסימום 5MB)';
      return;
    }

    this.selectedImage = file;
//יצירת תצוגה מקדימה
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagePreview = e.target.result;
    };
    reader.readAsDataURL(file);

    this.errorMessage = '';
  }

  removeImage() {
    this.selectedImage = null;
    this.imagePreview = null;
  }
  
 
  // ניהול רכיבים (FormArray)
  
  get ingredients(): FormArray {
    return this.recipeForm.get('ingredients') as FormArray;
  }
  
  
 // יוצר FormGroup לרכיב בודד
  
  private createIngredientGroup(): FormGroup {
    return new FormGroup({
      product: new FormControl('', [
        Validators.required,
        Validators.minLength(2)
      ]),
      amount: new FormControl('', [
        Validators.required,
        Validators.min(0.01)
      ]),
        unit: new FormControl('', [Validators.required]), // ✅ שיניתי מ-'כוסות' ל-'' כדי שיהיה placeholder
        customUnit: new FormControl('')
    });
  }
  
  
   // מוסיף רכיב חדש לרשימה
   
  addIngredient(): void {
    this.ingredients.push(this.createIngredientGroup());
  }
  
  
  // מוחק רכיב מהרשימה
  
  removeIngredient(index: number): void {
    if (this.ingredients.length > 1) {  // לפחות רכיב אחד
      this.ingredients.removeAt(index);
    }
  }
  
 
  // Getters נוחים
 
  
  get title() {
    return this.recipeForm.get('title')!;
  }
  
  get type() {
    return this.recipeForm.get('type')!;
  }
  get category() {
    return this.recipeForm.get('category')!;
  }
  
  get preparation_time() {
    return this.recipeForm.get('preparation_time')!;
  }
  
  get instructions() {
    return this.recipeForm.get('instructions')!;
  }
   
  
  
  // שליחת הטופס
  
  submitRecipe(): void {
    // סימון כל השדות כ-touched 
    this.recipeForm.markAllAsTouched();
    
    // בדיקת תקינות
    if (this.recipeForm.invalid) {
      this.errorMessage = 'אנא מלא את כל השדות החובה בצורה תקינה';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // בדיקה שיש לפחות רכיב אחד תקין
    const validIngredients = this.ingredients.controls.filter(ing => ing.valid);
    if (validIngredients.length === 0) {
      this.errorMessage = 'יש להוסיף לפחות רכיב אחד תקין';
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    // הכנת הנתונים
     const formData = new FormData();
    
formData.append('title', this.title.value);
formData.append('instructions', this.instructions.value);
formData.append('preparation_time', this.preparation_time.value);
formData.append('type', this.type.value);
formData.append('category', this.category.value);
// ⭐ user_id לא נשלח יותר - הבק-אנד מזהה את המשתמש מהעוגייה.

 //טיפול ברכיבים
  const ingredientsPayload = this.ingredients.value
    .filter((ing: any) => ing.product && ing.amount && (ing.unit || ing.customUnit))
    .map((ing: any) => ({
      product: ing.product,
      amount: ing.amount,
      unit: ing.unit === 'אחר' ? ing.customUnit : ing.unit
    }));
  formData.append('ingredients', JSON.stringify(ingredientsPayload)); // 🔹 שינוי
    if (this.selectedImage) {
      formData.append('image', this.selectedImage);
    } 
    // שליחה לשרת
    this.recipeService.createRecipe(formData).subscribe({
      next: (response: any) => {
        console.log('📦 תגובה מהשרת:', response);
        this.successMessage = 'המתכון נוסף בהצלחה! 🎉';
        this.isLoading = false;
        
        // ניתוב למתכון החדש אחרי 1.5 שניות
        setTimeout(() => {
          this.router.navigate(['/recipe', response.recipe.id]);
        }, 1500);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error || 'שגיאה בהוספת המתכון';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
  
  /**
   * ביטול וחזרה
   */
  cancel(): void {
    if (confirm('האם אתה בטוח שברצונך לבטל? השינויים לא יישמרו.')) {
      this.router.navigate(['/recipes']);
    }
  }
}

