import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../API/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  imports: [CommonModule, FormsModule],
})
export class DashboardComponent implements OnInit {
  assessments: Assessment[] = [];
  filteredAssessments: Assessment[] = [];
  searchTerm: string = '';
  constructor(private api: ApiService, private router:Router) { }

  ngOnInit(): void {
    // the window if statement below is from stack overflow because of an error I was getting, below is the link to the stack overflow page
    //https://stackoverflow.com/questions/56552343/how-can-i-fix-sessionstorage-is-not-defined-in-svelte
    if (window && window.sessionStorage) {
      const email = sessionStorage.getItem('email');
      if (email != null){
        this.onGetAssessments(email);
      }
  }
}
    onGetAssessments(email: string): void {
      this.api.getAssessments(email).subscribe((res: any) => {
        if (res && Array.isArray(res)) {
          this.assessments = res;
          this.filteredAssessments = res;
        } else {
          alert('No assessments found or invalid response format.');
        }
      }, (error) => {
        alert('An error occurred while fetching assessments.');
      });
    }

    onAddAssessment(): void{
      this.router.navigateByUrl('/add-assessment');
    }
    onViewAsssessment(assessmentID:number,assessmentName:string){
      this.router.navigateByUrl('/view-assessment)')
      sessionStorage.setItem('assessmentID',assessmentID.toString());
    }
    calculateDashArray(numMarked: number, totalSubmissions: number): string {
    const percentage = (numMarked / totalSubmissions) * 100;
    const val = 100-percentage;
    const dashArray = `${percentage}, ${val.toString()}`;
    return dashArray;
  }
  
  getProgressPercentage(numMarked: number, totalSubmissions: number): number {
    return totalSubmissions > 0 ? Math.round((numMarked / totalSubmissions) * 100) : 0;
  }

  getColor(numMarked: number, totalSubmissions: number): string {
    const percentage = (numMarked / totalSubmissions) * 100;
    return percentage === 100 ? 'green' : percentage >= 50 ? 'red' : 'orange';
  }
  onSearch(): void {
    this.filteredAssessments = this.assessments.filter(assessment =>
      assessment.assessmentName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      assessment.moduleCode.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }
  onLogout(): void {
    sessionStorage.removeItem('email');
    this.router.navigateByUrl('/login');
  }
  onDashboard():void{
    this.router.navigateByUrl('/dashboard');
  }
}
export class Assessment {
  assessmentID: number;
  moduleCode: string;
  assessmentName: string;
  numMarked: number;
  totalSubmissions: number;

  public constructor(
    assessmentID: number,
    moduleCode: string,
    assessmentName: string,
    numMarked: number,
    totalSubmissions: number
  ) {
    this.assessmentID = assessmentID;
    this.moduleCode = moduleCode;
    this.assessmentName = assessmentName;
    this.numMarked = numMarked;
    this.totalSubmissions = totalSubmissions;
  }
}