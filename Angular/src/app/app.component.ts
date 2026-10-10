import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavComponent } from '../comp/nav/nav.component';

// import { RegisterComponent } from '../comp/register/register.component';
// import { LoginComponent } from '../comp/login/login.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,NavComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'newAngularProject';
}
