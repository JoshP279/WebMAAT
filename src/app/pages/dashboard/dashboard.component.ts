import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../API/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Assessment} from '../../classes/Assessment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  imports: [CommonModule, FormsModule],
})
/**
 * DashboardComponent class
 * This class is used to display the dashboard page
 * OnInit is implemented, to allow for retrieval of data when the component is initialized.
 * 
 */
export class DashboardComponent implements OnInit {
  email: string = '';
  assessments: Assessment[] = [];
  filteredAssessments: Assessment[] = [];
  searchTerm: string = '';

  /**
   * @param api  - The API service for making HTTP requests to the server
   * @param router - The router service for navigating between pages
   */
  constructor(private api: ApiService, private router:Router) { }

  /**
   * ngOnInit method
   * This method is called when the component is initialized
   * It retrieves the email from session storage and calls the getAssessments method
   */
  ngOnInit(): void {
    if (window && window.sessionStorage) {
      const storedEmail = sessionStorage.getItem('email');
      if (storedEmail != null){
        this.email = storedEmail;
        this.onGetAssessments(this.email);
      }
  }
}
    /**
     * This method is used to retrieve the assessments for a marker
     * @param email - The email of the marker
     * It calls the getAssessments method from the API service
     * If the response is successful, the assessments are stored in the assessments array
     * If the response is unsuccessful, an error message is displayed
     */
    onGetAssessments(email: string): void {
      this.api.getAssessments(email).subscribe((res: any) => {
        if (res && Array.isArray(res)) {
          this.assessments = res;
          this.filteredAssessments = res;
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No Assessments found",
          });
        }
      }, (error) => {
        Swal.fire({
          icon: "error",
          title: "No connection",
          text: "Cannot connect to server",
        });
      });
    }
    /**
     * This method is used to navigate to the add-assessment page
     * It stores the email in session storage
     */
    onAddAssessment(): void{
      this.router.navigateByUrl('/add-assessment');
      sessionStorage.setItem('email',this.email);
    }
    /**
     * Function to navigate to the view-assessment page
     * @param assessmentID - The ID of the assessment
     * @param assessmentName - The name of the assessment
     * @param moduleCode - The module code of the assessment
     * @param modEmail - The email of the moderator
     * This method is used to navigate to the view-assessment page, where the relevant submissions are displayed for that assessment
     */
    onViewAsssessment(assessmentID:number,assessmentName:string, moduleCode:string, modEmail:string): void{
      this.router.navigateByUrl('/view-assessment)')
      sessionStorage.setItem('assessmentID',assessmentID.toString());
      sessionStorage.setItem('assessmentName',assessmentName);
      sessionStorage.setItem('assessmentModule',moduleCode);
      sessionStorage.setItem('modEmail', modEmail);
    }

    /**
     * Function to visually indicate the progress of marking for an assessment
     * @param numMarked - The number of submissions marked
     * @param totalSubmissions - The total number of submissions
     * @returns a string that represents the dash array for the progress bar
     */
    calculateDashArray(numMarked: number, totalSubmissions: number): string {
    const percentage = (numMarked / totalSubmissions) * 100;
    const val = 100-percentage;
    const dashArray = `${percentage}, ${val.toString()}`;
    return dashArray;
  }
  
  /**
   * Function to calculate the progress of marking for an assessment
   * @param numMarked - The number of submissions marked
   * @param totalSubmissions - The total number of submissions
   * @returns a number that represents number of submissions marked as a percentage of total submissions
   */
  getProgressPercentage(numMarked: number, totalSubmissions: number): number {
    return totalSubmissions > 0 ? Math.round((numMarked / totalSubmissions) * 100) : 0;
  }

  /**
   * Function to calculate the color of the progress bar
   * @param numMarked - The number of submissions marked
   * @param totalSubmissions = The total number of submissions
   * @returns a string that represents the color of the progress bar
   */
  getColor(numMarked: number, totalSubmissions: number): string {
    const percentage = (numMarked / totalSubmissions) * 100;
    return percentage === 100 ? 'green' : percentage >= 50 ? 'red' : 'orange';
  }

  /**
   * Function to filter the assessments based on the search term
   * It filters the assessments based on the assessment name and module code
   * The filtered assessments are stored in the filteredAssessments array
   */
  onSearch(): void {
    this.filteredAssessments = this.assessments.filter(assessment =>
      assessment.assessmentName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      assessment.moduleCode.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }
  /**
   * Function to log out the user
   * It clears the session storage and navigates to the login page
   */
  onLogout(): void {
    sessionStorage.clear();
    this.router.navigateByUrl('/login');
  }

  /**
   * Function to navigate to the dashboard page
   * It navigates to the dashboard page
   */
  onDashboard():void{
    this.router.navigateByUrl('/dashboard');
  }
}