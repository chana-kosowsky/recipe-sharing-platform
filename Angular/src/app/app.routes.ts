import { Routes } from '@angular/router';
import { RegisterComponent } from '../comp/register/register.component';
import { LoginComponent } from '../comp/login/login.component';
import { RecipeListComponent } from '../comp/recipe-list/recipe-list.component';
import { RecipeDetailComponent } from '../comp/recipe-detail/recipe-detail.component';
import { AddRecipeComponent } from '../comp/add-recipe/add-recipe.component';
import { HomeComponent } from '../comp/home/home.component';
import { AdminComponent } from '../comp/admin/admin.component';
import { guardsAdminGuard } from '../guard/guards-admin.guard';
import { ProfileComponent } from '../comp/profile/profile.component';
import { IngredientSearchComponent } from '../comp/ingredient-search/ingredient-search.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'recipes', component: RecipeListComponent},
  { path: 'recipe/add', component: AddRecipeComponent },
  { path: 'recipe/:id', component: RecipeDetailComponent },
  { 
    path: 'admin', 
    component: AdminComponent,canActivate: [guardsAdminGuard]  // ← הגנה!
  },
  { path: 'profile', component: ProfileComponent },
   { path: 'search', component: IngredientSearchComponent },
  
];

