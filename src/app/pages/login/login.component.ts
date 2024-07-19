import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../API/api.service';  
import { Router } from '@angular/router';
import { Login } from '../../classes/Login';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class LoginComponent {
  loginObj: Login;

  constructor(private api: ApiService, private router:Router) {
    this.loginObj = new Login();
  }

  onLogin() {
    this.api.login(this.loginObj).subscribe((res: any) => {
      if (res) {
        if(res.message == 'Login successful'){
        const email = this.loginObj.MarkerEmail;
        sessionStorage.setItem('email', email);
        this.router.navigateByUrl('/dashboard');
        }else{
          alert('Invalid Credentials');
        }
      } else {
        alert('Cannot connect to server');
      }
    });
  }
}