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

export class ViewAssessmentComponent implements OnInit {
  assessmentID: number = 0;
  assessmentName: string = '';
  assessmentModule: string = '';
  modEmail: string = '';
  searchTerm: string = '';
  submissions: Submission[] = [];
  filteredSubmissions: Submission[] = [];
  averageMark: number = 0;
  medianMark: number = 0;
  highestMark: number = 0;
  lowestMark: number = 0;

  constructor(private api: ApiService,private router: Router) { }

  ngOnInit(): void {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const storedAssessmentID = sessionStorage.getItem('assessmentID');
      const storedAssessmentName = sessionStorage.getItem('assessmentName');
      const storedAssessmentModule = sessionStorage.getItem('assessmentModule');
      const storedAssessmentModEmail = sessionStorage.getItem('modEmail');
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
    }
    this.getSubmissions(this.assessmentID);
  }

  getSubmissions(assessmentID:number){
    this.api.getSubmissions(assessmentID).subscribe((res: any) => {
      if (res && Array.isArray(res)) {
        this.submissions = res.map((submission: any) => new Submission(submission.submissionID,submission.studentNumber, submission.submissionMark, submission.studentName, submission.studentSurname, submission.submissionStatus));
        this.filteredSubmissions = res.map((submission: any) => new Submission(submission.submissionID,submission.studentNumber, submission.submissionMark, submission.studentName, submission.studentSurname, submission.submissionStatus));
      } else {
        Swal.fire({
          icon: "error",
          title: "No connection",
          text: "Cannot connect to server",
        });
      }
    });
  }

  calculateStats(): void {
    if (this.submissions.length === 0) return;

    const marks = this.submissions.map(sub => sub.submissionMark);
    this.averageMark = this.calculateAverage(marks);
    this.medianMark = this.calculateMedian(marks);
    this.highestMark = Math.max(...marks);
    this.lowestMark = Math.min(...marks);
  }

  calculateAverage(marks: number[]): number {
    const total = marks.reduce((acc, mark) => acc + mark, 0);
    return total / marks.length;
  }

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

  //the below code is edited from stack overflow: https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
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

  getCSVData(): Blob{
    const header = 'StudentNumber,StudentName,StudentSurname,SubmissionMark\n';
    const rows = this.submissions.map(submission =>
      `${submission.studentNumber},${submission.studentName || ''},${submission.studentSurname || ''},${submission.submissionMark}`
    ).join('\n');
    const csvContent = header + rows;
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }

  onExportMarkedSubmission(submissionID: number, submissionStatus:string): void {
    if (submissionStatus === 'Marked'){
      this.api.getMarkedSubmission(submissionID).subscribe((res: any) => {
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
      });
    }else{
      Swal.fire({
        icon: "warning",
        title: "Not yet!",
        text: "Submission has not been marked yet",
      });
    }
  }

  onEditAssessment(){
    this.router.navigateByUrl('/edit-assessment');
  }

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
  
  sendModeratorEmail(): void {
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