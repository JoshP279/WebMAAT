import { CommonModule,isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../API/api.service';
import { Submission } from '../../classes/Submission';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

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
  viewMode: string = 'grid';
  assessmentID: number = 0;
  assessmentName: string = '';
  assessmentModule: string = '';
  assessmentLecturerEmail: string = '';
  modEmail: string = '';
  email: string = '';
  searchTerm: string = '';
  selectedStatus: string = '';
  sortOrder = 'asc';
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
  constructor(private api: ApiService,private router: Router, @Inject(PLATFORM_ID) private platformId: Object) { }
  /**
   * ngOnInit method
   * This method is called when the component is initialized
   * Retrieves the assessment details from session storage and calls the getSubmissions method
   */
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const storedAssessmentID = sessionStorage.getItem('assessmentID');
      const storedAssessmentName = sessionStorage.getItem('assessmentName');
      const storedAssessmentModule = sessionStorage.getItem('assessmentModule');
      const storedAssessmentModEmail = sessionStorage.getItem('modEmail');
      const storedEmail = sessionStorage.getItem('email');
      if (storedAssessmentID) {
        this.assessmentID = parseInt(storedAssessmentID);
        this.getSubmissions(this.assessmentID);
      }
      if (storedAssessmentName) {
        this.assessmentName = storedAssessmentName;
      }
      if (storedAssessmentModule) {
        this.assessmentModule = storedAssessmentModule;
      }
      if (storedAssessmentModEmail) {
        this.modEmail = storedAssessmentModEmail;
      }
      if (storedEmail) {
        this.email = storedEmail;
      }
      else {
        sessionStorage.clear();
        Swal.fire({
          icon: "error",
          title: "Error",
          text: 'Please log in to access this page',
          showConfirmButton: true,
        }).then((result) => {
          if (result.isConfirmed) {
            this.router.navigate(['/login']);
          }
        });
      }
    }
  }

  filterSubmissions() {
    this.filteredSubmissions = this.submissions.filter(submission => {
      const matchesStatus = this.selectedStatus === '' || submission.submissionStatus === this.selectedStatus;
      const matchesSearch = submission.studentNumber.includes(this.searchTerm) ||
                            submission.studentName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                            submission.studentSurname.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });

    this.sortSubmissions();
  }

  sortSubmissions() {
    this.filteredSubmissions.sort((a, b) => {
      const comparison = a.submissionMark - b.submissionMark;
      return this.sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Function to retrieve all submissions for an assessment
   * @param assessmentID - The ID of the assessment
   */
  getSubmissions(assessmentID:number){
    this.api.getSubmissions(assessmentID).subscribe((res: any) => {
      if (res && Array.isArray(res)) {
        this.submissions = res.map((submission: any) => new Submission(submission.submissionID,submission.studentNumber, submission.submissionMark, submission.studentName, submission.studentSurname, submission.submissionStatus, submission.submissionFolderName));
        this.filteredSubmissions = res.map((submission: any) => new Submission(submission.submissionID,submission.studentNumber, submission.submissionMark, submission.studentName, submission.studentSurname, submission.submissionStatus, submission.submissionFolderName));
        this.calculateStats();
        this.filterSubmissions();
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
    if (this.submissions.length === 0) {
      return;
    }
    const marks = this.submissions.map(sub => sub.submissionMark); //list of numbers containing each submission mark
    this.averageMark = Math.round(this.calculateAverage(marks) * 100) / 100;
    this.medianMark = Math.round(this.calculateMedian(marks) * 100) / 100;
    this.highestMark = Math.round(Math.max(...marks) * 100) / 100;
    this.lowestMark = Math.round(Math.min(...marks) * 100) / 100;
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
      link.setAttribute('download', this.assessmentModule+ '_' + this.assessmentName + '_' + 'results.csv');
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
          <label for="submissionMark">Submission Mark (%): </label>
          <input id="submissionMark" class="swal2-input" type="text" value="${submission?.submissionMark}">
        </div>
      `,
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: `Save Changes`,
      denyButtonText: `Download Marked Submission`,
      preConfirm: () => {
        const studentName = (document.getElementById('studentName') as HTMLInputElement).value;
        const studentSurname = (document.getElementById('studentSurname') as HTMLInputElement).value;
        const submissionMarkInput = (document.getElementById('submissionMark') as HTMLInputElement);
        const submissionMark = submissionMarkInput.value;
  
        if (!submissionMark) {
          Swal.showValidationMessage('Submission mark cannot be empty!');
          return false;
        }

        if (!studentName){
          Swal.showValidationMessage('Student name cannot be empty!');
          return false;
        }

        if (!studentSurname){
          Swal.showValidationMessage('Student surname cannot be empty!');
          return false;
        }
        const submissionMarkNumber = Number(submissionMark);
  
        if (isNaN(submissionMarkNumber) || submissionMarkNumber < 0 || submissionMarkNumber > 100) {
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
  
        // Add an input event listener to handle manual typing and restrict the input to valid numeric characters only
        submissionMarkInput.addEventListener('input', () => {
          // Allow only numbers and one decimal point
          submissionMarkInput.value = submissionMarkInput.value.replace(/[^0-9.]/g, '');
  
          // Prevent multiple decimal points
          if ((submissionMarkInput.value.match(/\./g) || []).length > 1) {
            submissionMarkInput.value = submissionMarkInput.value.slice(0, -1);
          }
  
          // Ensure value is not greater than 100
          let value = parseFloat(submissionMarkInput.value);
  
          if (!isNaN(value) && value > 100) {
            submissionMarkInput.value = '100';
          }
        });
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedName = result.value ? result.value.studentName : '';
        const updatedSurname = result.value ? result.value.studentSurname : '';
        const updatedMark = result.value && 'submissionMark' in result.value ? result.value.submissionMark : 0;
  
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
          const originalSubmission = this.submissions.find(sub => sub.submissionID === submission.submissionID);
          if (originalSubmission) {
            originalSubmission.studentName = updatedName;
            originalSubmission.studentSurname = updatedSurname;
            originalSubmission.submissionMark = updatedMark;
          }
          this.sortSubmissions();
          this.calculateStats();
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
    sessionStorage.setItem('lecturerEmail', this.assessmentLecturerEmail);
    sessionStorage.setItem('assessmentModuleCode', this.assessmentModule);
    this.router.navigateByUrl('/edit-assessment');
  }

  /**
   * Function to publish the results of the assessment to the students
   * A confirmation dialog is displayed to confirm the action (otherwise can accidentally publish results)
   * Only marked submissions are published
   */
  onStudentsPublishResults(): void {
    // Filter submissions to include only those that are marked
    const markedSubmissions = this.submissions.filter(submission => submission.submissionStatus === 'Marked');
  
    // Check if there are any marked submissions
    if (markedSubmissions.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No Marked Submissions",
        text: "There are no marked submissions to publish.",
      });
      return; // Exit the function early
    }
  
    let allSelected = true; // Variable to track if all are selected or deselected
    let filteredSubmissions = [...markedSubmissions]; // Make a copy to apply search filter
  
    // Object to track the checkbox state of each submission by submissionID
    const checkboxStates: { [key: string]: boolean } = {};
    markedSubmissions.forEach(submission => {
      checkboxStates[submission.submissionID] = true; // Initially, all are selected
    });
  
    // Function to generate the HTML for the submission list
    const generateSubmissionListHTML = (submissions: any[]) => {
      return submissions.map(submission => `
        <div style="display: flex; align-items: center; justify-content: flex-start; padding: 5px;" class="submission-item">
          <input type="checkbox" id="submission-${submission.submissionID}" class="swal2-checkbox submission-checkbox"
                 style="margin: 0; vertical-align: middle;" ${checkboxStates[submission.submissionID] ? 'checked' : ''}>
          <label for="submission-${submission.submissionID}" style="margin-left: 8px; vertical-align: middle;">
            ${submission.studentName} ${submission.studentSurname} - ${submission.studentNumber}
          </label>
        </div>
      `).join('');
    };
  
    Swal.fire({
      title: "Select Marked Submissions to Publish",
      html: `
        <div>
          <p>Select the submissions you want to publish results for:</p>
          <input type="text" id="searchSubmissions" placeholder="Search"
                 style="margin-bottom: 10px; width: 100%; padding: 8px; box-sizing: border-box;">
          <button id="selectDeselectAll" style="margin-bottom: 10px; padding: 8px;">Deselect All</button>
          <div id="submissionList">${generateSubmissionListHTML(filteredSubmissions)}</div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: "#000080",
      cancelButtonColor: "#d33",
      confirmButtonText: "Publish Selected",
      cancelButtonText: "Cancel",
      didOpen: () => {
        const searchInput = document.getElementById('searchSubmissions') as HTMLInputElement;
        const submissionList = document.getElementById('submissionList');
        const selectDeselectButton = document.getElementById('selectDeselectAll');
  
        // Add event listener for filtering submissions based on search input
        searchInput.addEventListener('input', (event) => {
          const searchValue = (event.target as HTMLInputElement).value.toLowerCase();
          filteredSubmissions = markedSubmissions.filter(submission =>
            submission.studentName.toLowerCase().includes(searchValue) ||
            submission.studentSurname.toLowerCase().includes(searchValue) ||
            submission.studentNumber.includes(searchValue)
          );
          if (submissionList) {
            submissionList.innerHTML = generateSubmissionListHTML(filteredSubmissions);
          }
          // Reattach event listeners for the checkboxes after re-rendering
          attachCheckboxListeners();
        });
  
        if (selectDeselectButton !== null) {
          selectDeselectButton.addEventListener('click', () => {
            allSelected = !allSelected; // Toggle the selection state
            filteredSubmissions.forEach(submission => {
              checkboxStates[submission.submissionID] = allSelected;
            });
  
            const checkboxes = document.querySelectorAll('.submission-checkbox') as NodeListOf<HTMLInputElement>;
            checkboxes.forEach(checkbox => {
              checkbox.checked = allSelected; // Set all checkboxes to match the allSelected value
            });
  
            selectDeselectButton.innerText = allSelected ? 'Deselect All' : 'Select All'; // Update button text
          });
        }
  
        // Function to attach event listeners to checkboxes to update checkboxStates
        const attachCheckboxListeners = () => {
          const checkboxes = document.querySelectorAll('.submission-checkbox') as NodeListOf<HTMLInputElement>;
          checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
              const submissionID = checkbox.id.split('-')[1]; // Extract the submissionID from checkbox ID
              checkboxStates[submissionID] = checkbox.checked; // Update the checkbox state
            });
          });
        };
  
        attachCheckboxListeners(); // Attach checkbox event listeners when the modal opens
      },
      preConfirm: () => {
        const content = Swal.getHtmlContainer();
        if (!content) {
          Swal.showValidationMessage('Unable to find submission checkboxes.');
          return;
        }
  
        // Collect IDs of selected submissions
        const selectedSubmissions = markedSubmissions.filter(submission => checkboxStates[submission.submissionID]);
  
        if (selectedSubmissions.length === 0) {
          Swal.showValidationMessage('Please select at least one submission to publish.');
          return false;
        }
  
        return selectedSubmissions;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.sendStudentEmails(result.value);
        Swal.fire({
          title: "Results published!",
          text: "Selected marked students have been emailed their assessed script.",
          icon: "success"
        });
      }
    });
  }
  
  sendStudentEmails(selectedSubmissions: Submission[]): void {
    for (const sub of selectedSubmissions) {
      if (sub.submissionStatus === 'Marked') {
        this.sendEmail(sub.submissionID, sub.studentNumber, sub.submissionMark);
      }
    }
  }

  onModeratorPublishResults(): void {
    Swal.fire({
      title: "Are you sure?",
      html: `
        <div>
          <p>This will email the moderator (${this.modEmail}) the results of the assessment.</p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#000080",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, publish results",
      cancelButtonText: "Cancel",
      preConfirm: () => {
        if (!this.modEmail) {
          Swal.showValidationMessage('Moderator email is missing.');
          return undefined;
        }
        return true;
      }
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
    
    this.api.sendModeratorEmail(formData).subscribe(
      (res: any) => {
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
      },
      (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'An error occurred while sending the email. Please try again later.',
        });
      }
    );
  }
  

  /**
   * Function to send an email to a student with the marked submission
   * @param submissionID - The ID of the submission
   * @param studentNumber - The student number of the student
   * The function calls the getMarkedSubmission method to retrieve the marked submission as a PDF file
   * If the marked submission exists and is marked, the email is sent to the student email address
   */
  sendEmail(submissionID:number, studentNumber:string, submissionMark: number): void {
    this.api.getMarkedSubmission(submissionID).subscribe((res: any) => {
      if (res && res.pdfData && res.pdfData.type === 'Buffer') {
        const emailData = {
          to: 's'+studentNumber+'@mandela.ac.za',
          subject: this.assessmentName + ' Results: ' + submissionMark + '%',
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

  onExportZippedSubmissions(): void {
    Swal.fire({
      title: "Are you sure?",
      html: `
        <div>
          <p>This will download the assessed scripts in the same folder structure when the assessment was added.</p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#000080",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, download ZIP file",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        const zip = new JSZip();
        const promises: Promise<any>[] = [];

        this.submissions.filter(submission => submission.submissionStatus ==='Marked').forEach(submission => {
          const promise = this.api.getMarkedSubmission(submission.submissionID).toPromise().then(
            (res: any) => {
              if (res && res.pdfData && res.pdfData.type === 'Buffer') {
                const byteArray = new Uint8Array(res.pdfData.data);
                zip.file(`${submission.submissionFolderName}/${submission.studentNumber}.pdf`, byteArray);
              } else {
                console.error(`Failed to retrieve submission with student number: ${submission.studentNumber}`);
              }
            },
            (error) => {
              console.error(`Error fetching submission with student number: ${submission.studentNumber}`, error);
            }
          );
          promises.push(promise);
        });
  
       
      Promise.all(promises).then(() => {
        zip.generateAsync({ type: "blob" })
          .then((content) => {
            saveAs(content, `${this.assessmentModule + '_' + this.assessmentName}.zip`);

          })
          .catch((err) => {
            Swal.fire({
              icon: "error",
              title: "Error!",
              text: "Unable to generate ZIP file.",
            });
            console.error("Error generating ZIP file:", err);
          });
      });
    }
  });
}
}