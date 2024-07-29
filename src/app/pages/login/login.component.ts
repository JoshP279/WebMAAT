import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../API/api.service';  
import { Router } from '@angular/router';
import { Login } from '../../classes/Login';
import { catchError, timeout } from 'rxjs/operators';
import { of } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
/**
 * Login component for handling user login functionality.
 */
export class LoginComponent {
  loginObj: Login;

  /**
   * 
   * @param api - The API service for making HTTP requests to the server
   * @param router - The router service for navigating between pages
   */
  constructor(private api: ApiService, private router:Router) {
    this.loginObj = new Login();
  }
  /**
   * Function to handle the login functionality.
   * This function sends a GET request to the server with the login credentials.
   */
  onLogin() {
    this.api.login(this.loginObj).pipe(
      timeout(10000), // Set timeout for 10 seconds
      catchError((error) => {
        Swal.fire({
          icon: "error",
          title: "No connection",
          text: "Cannot connect to server",
        });
        return of(null); // Return an observable with null or a default value to continue the observable chain
      })
    ).subscribe((res: any) => {
      if (res) {
        if(res.MarkerRole == 'Lecturer'){
          const email = this.loginObj.MarkerEmail;
          sessionStorage.setItem('email', email);
          this.router.navigateByUrl('/dashboard');
        } else if (res.MarkerRole == 'Admin'){
          Swal.fire(res.MarkerRole);
        } else {
          Swal.fire({
            icon: "error",
            title: "Invalid Credentials",
            text: "You do not have the correct role to access this page",
          });
        }
      }
    });
  }
}