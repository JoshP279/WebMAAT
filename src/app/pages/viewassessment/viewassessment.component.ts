import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../API/api.service';
import { Submission } from '../../classes/Submission';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-viewassessment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './viewassessment.component.html',
  styleUrls: ['./viewassessment.component.css']
})
/**
 * ViewAssessmentComponent class
 * This class is used to display the view assessment page
 * OnInit is implemented, to allow for retrieval of data when the component is initialized.
 */
export class ViewAssessmentComponent implements OnInit {
  assessmentID: number = 0;
  assessmentName: string = '';
  assessmentModule: string = '';
  modEmail: string = '';
  email: string = '';
  searchTerm: string = '';
  submissions: Submission[] = [];
  filteredSubmissions: Submission[] = [];
  averageMark: number = 0;
  medianMark: number = 0;
  highestMark: number = 0;
  lowestMark: number = 0;

  /**
 * DashboardComponent class
 * This class is used to display the dashboard page
 * OnInit is implemented, to allow for retrieval of data when the component is initialized.
 * 
 */
  constructor(private api: ApiService,private router: Router) { }
  /**
   * ngOnInit method
   * This method is called when the component is initialized
   * Retrieves the assessment details from session storage and calls the getSubmissions method
   */
  ngOnInit(): void {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const storedAssessmentID = sessionStorage.getItem('assessmentID');
      const storedAssessmentName = sessionStorage.getItem('assessmentName');
      const storedAssessmentModule = sessionStorage.getItem('assessmentModule');
      const storedAssessmentModEmail = sessionStorage.getItem('modEmail');
      const storedEmail = sessionStorage.getItem('email');
      if (storedAssessmentID !== null) {
        this.assessmentID = parseInt(storedAssessmentID);
      }
      if (storedAssessmentName !== null) {
        this.assessmentName = storedAssessmentName;
      }
      if (storedAssessmentModule !== null) {
        this.assessmentModule = storedAssessmentModule;
      }
      if (storedAssessmentModEmail !== null) {
        this.modEmail = storedAssessmentModEmail;
      }
      if (storedEmail !== null) {
        this.email = storedEmail;
      }
    }
    this.getSubmissions(this.assessmentID);
  }

  /**
   * Function to retrieve all submissions for an assessment
   * @param assessmentID - The ID of the assessment
   */
  getSubmissions(assessmentID:number){
    this.api.getSubmissions(assessmentID).subscribe((res: any) => {
      if (res && Array.isArray(res)) {
        this.submissions = res.map((submission: any) => new Submission(submission.submissionID,submission.studentNumber, submission.submissionMark, submission.studentName, submission.studentSurname, submission.submissionStatus));
        this.filteredSubmissions = res.map((submission: any) => new Submission(submission.submissionID,submission.studentNumber, submission.submissionMark, submission.studentName, submission.studentSurname, submission.submissionStatus));
        this.calculateStats();
      } else {
        Swal.fire({
          icon: "error",
          title: "No connection",
          text: "Cannot connect to server",
        });
      }
    });
  }
  /**
   * Function to calculate the statistics for the submissions
   * All other functions are called to calculate the average, median, highest and lowest marks
   */
  calculateStats() {
    if (this.submissions.length === 0) return; //if there are no submissions, return

    const marks = this.submissions.map(sub => sub.submissionMark); //list of numbers containing each submission mark
    this.averageMark = this.calculateAverage(marks);
    this.medianMark = this.calculateMedian(marks);
    this.highestMark = Math.max(...marks);
    this.lowestMark = Math.min(...marks);
  }
  /**
   * Function to calculate the average of all submissions
   * @param marks - The marks of the submissions
   * @returns the average mark
   */
  calculateAverage(marks: number[]): number {
    const total = marks.reduce((acc, mark) => acc + mark, 0);
    return total / marks.length;
  }

  /**
   * Fucntion to calculate the median of all submissions
   * @param marks - The marks of the submissions
   * @returns 
   */
  calculateMedian(marks: number[]): number {
    const sortedMarks = [...marks].sort((a, b) => a - b);
    const middle = Math.floor(sortedMarks.length / 2);

    if (sortedMarks.length % 2 === 0) {
      return (sortedMarks[middle - 1] + sortedMarks[middle]) / 2;
    } else {
      return sortedMarks[middle];
    }
  }

  onLogout(): void{
    sessionStorage.clear();
    this.router.navigateByUrl('/login');
  }
  
  onDashboard(): void {
    this.router.navigateByUrl('/dashboard');
  }

  onSearch(): void {
    this.filteredSubmissions = this.submissions.filter(submission =>
      submission.studentNumber.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      submission.studentSurname.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      submission.studentName.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  /**
   * Function to export the results of the assessment to a CSV file
   * The results are exported as a CSV file with the columns: StudentNumber, StudentName, StudentSurname, SubmissionMark
   * The function creates a blob with the CSV data and creates a link to download the file
   */
  onExportResults(): void {
    const blob = this.getCSVData();
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'results.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
  /**
   * Function to get the CSV data of the submissions
   * @returns a blob with the CSV data of the submissions
   */
  getCSVData(): Blob{
    const header = 'StudentNumber,StudentName,StudentSurname,SubmissionMark\n';
    const rows = this.submissions.map(submission =>
      `${submission.studentNumber},${submission.studentName || ''},${submission.studentSurname || ''},${submission.submissionMark}`
    ).join('\n');
    const csvContent = header + rows;
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }
  
  onEditStudentSubmission(submission: Submission): void {
    Swal.fire({
      title: 'Edit Submission',
      html: `
        <div>
          <label for="studentName">Student Name: </label>
          <input id="studentName" class="swal2-input" value="${submission?.studentName}">
        </div>
        <div>
          <label for="studentSurname">Student Surname: </label>
          <input id="studentSurname" class="swal2-input" value="${submission?.studentSurname}">
        </div>
        <div>
          <label for="submissionMark">Submission Mark (%): </label \n>
          <input id="submissionMark" class="swal2-input" type="number" value="${submission?.submissionMark}" min="0" max="100">
        </div>
      `,
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: `Edit Submission`,
      denyButtonText: `Download Marked Submission`,
      preConfirm: () => {
        const studentName = (document.getElementById('studentName') as HTMLInputElement).value;
        const studentSurname = (document.getElementById('studentSurname') as HTMLInputElement).value;
        const submissionMarkInput = (document.getElementById('submissionMark') as HTMLInputElement);
        const submissionMark = submissionMarkInput.value;
  
        if (!submissionMark) {
          Swal.showValidationMessage('Submission mark cannot be empty');
          return false;
        }
  
        const submissionMarkNumber = Number(submissionMark);
  
        // Check if the submission mark is within the valid range
        if (submissionMarkNumber < 0 || submissionMarkNumber > 100 || isNaN(submissionMarkNumber)) {
          Swal.showValidationMessage('Submission mark must be a number between 0 and 100');
          return false;
        }
  
        return {
          studentName: studentName,
          studentSurname: studentSurname,
          submissionMark: submissionMarkNumber
        };
      },
      willOpen: () => {
        const submissionMarkInput = document.getElementById('submissionMark') as HTMLInputElement;
        
        // Add an input event listener to handle manual typing and restrict the input to numbers only
        submissionMarkInput.addEventListener('input', () => {
          submissionMarkInput.value = submissionMarkInput.value.replace(/[^0-9]/g, ''); // Remove any non-numeric characters
          let value = parseInt(submissionMarkInput.value, 10);
          if (isNaN(value)) {
            value = 0;
          }
          if (value < 0) {
            submissionMarkInput.value = '0';
          } else if (value > 100) {
            submissionMarkInput.value = '100';
          }
        });
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedName = result.value?.studentName;
        const updatedSurname = result.value?.studentSurname;
        const updatedMark = result.value?.submissionMark;
  
        const submissionForm = {
          SubmissionID: submission.submissionID,
          StudentName: updatedName,
          StudentSurname: updatedSurname,
          SubmissionMark: updatedMark
        };
  
        this.api.updateSubmissionInfo(submissionForm).subscribe(() => {
          Swal.fire({
            icon: 'success',
            title: 'Updated',
            text: 'Submission mark has been updated.',
            position: 'bottom-end',
            timer: 2000,
            showConfirmButton: false,
            timerProgressBar: true
          });
  
          submission.studentName = updatedName;
          submission.studentSurname = updatedSurname;
          submission.submissionMark = updatedMark;
        }, (error) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to update submission mark. Please try again.',
          });
        });
  
      } else if (result.isDenied) {
        this.onExportMarkedSubmission(submission.submissionID, submission.submissionStatus);
      }
    });
  }
  
  
  
  /**
   * Function to export the marked submission as a PDF file
   * @param submissionID - The ID of the submission
   * @param submissionStatus - The status of the submission (Marked, Unmarked, In Progress)
   * The function calls the getMarkedSubmission method to retrieve the marked submission as a PDF file, only if the submission is marked
   */
  onExportMarkedSubmission(submissionID: number, submissionStatus: string): void {
    if (submissionStatus === 'Marked') {
      this.api.getMarkedSubmission(submissionID).subscribe(
        (res: any) => {
          if (res && res.pdfData && res.pdfData.type === 'Buffer') {
            const byteArray = new Uint8Array(res.pdfData.data);
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `MarkedSubmission_${submissionID}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } else {
            Swal.fire({
              icon: "error",
              title: "Error!",
              text: "Unable to retrieve marked submission",
            });
          }
        },
        (error) => {
          Swal.fire({
            icon: "error",
            title: "Error!",
            text: "Unable to retrieve marked submission. The submission may not exist or the server is unavailable.",
          });
        }
      );
    } else {
      Swal.fire({
        icon: "warning",
        title: "Not yet!",
        text: "Submission has not been marked yet",
      });
    }
  }
  
  

  onEditAssessment(){
    sessionStorage.setItem('email', this.email);
    this.router.navigateByUrl('/edit-assessment');
  }

  /**
   * Function to publish the results of the assessment to the students
   * A confirmation dialog is displayed to confirm the action (otherwise can accidentally publish results)
   * Only marked submissions are published
   */
  onStudentsPublishResults(): void {
    Swal.fire({
      title: "Are you sure?",
      text: "This will email all marked students their assessed script.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#000080",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, publish results"
    }).then((result) => {
      if (result.isConfirmed) {
        this.sendStudentEmails();
        Swal.fire({
          title: "Results published!",
          text: "All marked students have been emailed their assessed script.",
          icon: "success"
        });
      }
    });
  }

  sendStudentEmails(): void {
    for (const sub of this.submissions){
      if (sub.submissionStatus === 'Marked'){
        this.sendEmail(sub.submissionID, sub.studentNumber);
      }
    }
  }

  onModeratorPublishResults(): void {
    Swal.fire({
      title: "Are you sure?",
      text: "This will email the moderator the results of the assessment.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#000080",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, publish results"
    }).then((result) => {
      if (result.isConfirmed) {
        this.sendModeratorEmail();
      }
    });
  }

  /**
   * Function to send the moderator an email with the results of the assessment
   * The email is sent with the results as a CSV attachment
   * The email is sent to the moderator email address
   * A confirmation dialog is displayed to confirm the action (otherwise can accidentally send email)
   * The function creates a form data object with the email details and calls the sendModeratorEmail method
   * If the email is sent successfully, a success dialog is displayed
   */
  sendModeratorEmail() {
    const csvBlob = this.getCSVData();
    const formData = new FormData();
    formData.append('to', this.modEmail);
    formData.append('subject', `${this.assessmentModule} ${this.assessmentName} Results`);
    formData.append('text', 'Please find the attached results for an assessment you are moderating.\n' +
                            'This is an automated email. Please contact the module lecturer if you have any queries.');
    formData.append('csv', csvBlob, 'assessment_results.csv');
    this.api.sendModeratorEmail(formData).subscribe((res: any) => {
    if (res && res.message === 'Failed to send email') {
          Swal.fire({
            icon: 'error',
            title: 'Failed to send email',
            text: res.error,
          });
        } else {
          Swal.fire({
            title: "Results published!",
            text: "The moderator has been emailed the results of the assessment.",
            icon: "success"
          });
        }
      }, (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'An error occurred while sending the email. Please try again later.',
        });
      });
    }

  /**
   * Function to send an email to a student with the marked submission
   * @param submissionID - The ID of the submission
   * @param studentNumber - The student number of the student
   * The function calls the getMarkedSubmission method to retrieve the marked submission as a PDF file
   * If the marked submission exists and is marked, the email is sent to the student email address
   */
  sendEmail(submissionID:number, studentNumber:string): void {
    this.api.getMarkedSubmission(submissionID).subscribe((res: any) => {
      if (res && res.pdfData && res.pdfData.type === 'Buffer') {
        const emailData = {
          to: 's'+studentNumber+'@mandela.ac.za',
          subject: this.assessmentName + ' Results',
          text: 'Please find the attached marked submission for your assessment.\n' +
                    'Note that the marks have been automatically calculated. We recommend reviewing the details to ensure accuracy.\n' + 
                    'Please contact your lecturer if you have any queries.',
          pdfData: res.pdfData
        };
        this.api.sendStudentEmail(emailData).subscribe((res: any) => {
          if (res && res.message === 'Failed to send email') {
            Swal.fire({
              icon: "error",
              title: "Faild to send email",
              text: res.error,
            });
          }
        });
      }
    }
    );
  }
}