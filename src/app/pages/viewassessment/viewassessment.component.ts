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
      if (storedAssessmentID !== null) {
        this.assessmentID = parseInt(storedAssessmentID, 0);
      }
      if (storedAssessmentName !== null) {
        this.assessmentName = storedAssessmentName;
      }
      if (storedAssessmentModule !== null) {
        this.assessmentModule = storedAssessmentModule;
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
        alert('Cannot retrieve submissions for this assessment');
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
    const header = 'StudentNumber,StudentName,StudentSurname,SubmissionMark\n';
    const rows = this.submissions.map(submission =>
      `${submission.studentNumber},${submission.studentName || ''},${submission.studentSurname || ''},${submission.submissionMark}`
    ).join('\n');
    const csvContent = header + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'results.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
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
          alert('Cannot retrieve marked submission');
        }
      });
    }else{
      alert('Submission is not marked yet');
    }
  }
  onEditAssessment(){
    this.router.navigateByUrl('/edit-assessment');
  }
  onPublishResults(): void {
    for (const sub of this.submissions){
      if (sub.submissionStatus === 'Marked'){
        this.sendEmail(sub.submissionID, sub.studentNumber);
      }
    }
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: 'Emails sent successfully!',
      toast: true,
      position: 'bottom-end',
      showConfirmButton: false,
      timer: 3000
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
      }
    });
  }
}