import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../API/api.service';
import { Lecturer} from '../../classes/Lecturer';
import { ModuleCode } from '../../classes/Module.Code';
import { Marker } from '../../classes/Marker';
import { Moderator } from '../../classes/Moderator';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import JSZip from 'jszip';


@Component({
  selector: 'app-addassessment',
  standalone: true,
  templateUrl: './addassessment.component.html',
  styleUrls: ['./addassessment.component.css'],
  imports: [ReactiveFormsModule, CommonModule],
})
export class AddAssessmentComponent implements OnInit {
  loading: boolean = false;
  assessmentForm: FormGroup;
  lecturers: Lecturer[] = [];
  modules: ModuleCode[] = [];
  AssessmentName: string = '';
  moderators: Moderator[] = [];
  markers: Marker[] = [];
  TotalMark: number = 0;
  selectedMemoFile: File | null = null;
  selectedSubmissionsFile: File | null = null;

  constructor(private fb: FormBuilder, private api: ApiService, private router: Router) {
    this.assessmentForm = this.fb.group({
      lecturer: ['', Validators.required],
      assessmentName: ['', Validators.required],
      module: ['', Validators.required],
      moderator: ['', Validators.required],
      markers: [[], Validators.required],
      totalMarks: [null, [Validators.required, Validators.pattern(/^[1-9]\d*$/)]],
      selectedFile: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.fetchData();
  }
  
  fetchData(): void {
    this.getModules();
    this.getLecturers();
    this.getModerators();
    this.getMarkers();
  }
  getModules(){
    this.api.getModules().subscribe((res: any) => {
      if (res && Array.isArray(res)) {
        this.modules = res.map((module: any) => new ModuleCode(module.ModuleCode));
      } else {
        alert('No modules found or invalid response format.');
      }
    });
  }
  getLecturers(){
    this.api.getLecturers().subscribe((res: any) => {
      if (res && Array.isArray(res)) {
        this.lecturers = res.map((lecturer: any) => new Lecturer(lecturer.MarkerEmail));
      } else {
        alert('No lecturers found or invalid response format.');
      }
    });
  }
  getModerators(){
    this.api.getModerators().subscribe((res: any) => {
      if (res && Array.isArray(res)) {
        this.moderators = res.map((moderator: any) => new Moderator(moderator.ModEmail));
      } else {
        alert('No moderators found or invalid response format.');
      }
    });
  }
  getMarkers(){
    this.api.getMarkers().subscribe((res: any) => {
      if (res && Array.isArray(res)) {
        this.markers = res.map((marker: any) => new Marker(marker.MarkerEmail, marker.Name, marker.Surname));
      }else{
        alert('No markers found or invalid response format.');
      }
  });
}
  onSubmit(): void {
    if (this.assessmentForm.valid) {
      this.loading = true;
      const reader = new FileReader();
      const file: File = this.assessmentForm.value.selectedFile;
      if (file) {
        reader.onloadend = async () => {
          const fileData = reader.result as ArrayBuffer;
          const byteArray = new Uint8Array(fileData);
          const assessmentInfo = {
            MarkerEmail: this.assessmentForm.value.lecturer,
            AssessmentName: this.assessmentForm.value.assessmentName,
            ModuleCode: this.assessmentForm.value.module,
            Memorandum: byteArray,
            ModEmail: this.assessmentForm.value.moderator,
            TotalMark: this.assessmentForm.value.totalMarks,
            NumSubmissionsMarked: 0,
            TotalNumSubmissions: 0
          };
          try {
            this.api.addAssessment(assessmentInfo).subscribe((res: any) => {
              if (res && res.message === 'Assessment added successfully') {
                this.addSubmissions(res.assessmentID);
              }
          });
          } catch (error) {
            alert('Failed to add assessment. Please try again.');
          }
        };

        reader.readAsArrayBuffer(file);
      }
    }
  }

  addSubmissions(assessmentID: number): void {
    if (this.selectedSubmissionsFile) {
      const zip = new JSZip();
      this.selectedSubmissionsFile.arrayBuffer().then((zipFileData) => {
        zip.loadAsync(zipFileData).then((zipContents) => {
          const promises: Promise<void>[] = [];
          zip.forEach((relativePath, zipEntry) => {
            // Extract folder names and contents
            const pathParts = relativePath.split('/');
            if (pathParts.length > 1) {
              const folderName = pathParts[0];
              const fileName = pathParts[pathParts.length - 1];
              const [firstName, lastName, studentNumber] = this.extractInfoFromFolderName(folderName);
              console.log(`Folder: ${folderName}, FirstName: ${firstName}, LastName: ${lastName}, StudentNumber: ${studentNumber}`);
  
              if (fileName.endsWith('.pdf')) {
                promises.push(
                  zipEntry.async('arraybuffer').then((pdfData) => {
                    this.processSubmissionPDF(new Uint8Array(pdfData), assessmentID, firstName, lastName, studentNumber);
                    this.router.navigateByUrl('/dashboard');
                  })
                );
              }
            }
          });
  
          return Promise.all(promises);
        }).then(() => {
          this.loading = false;
        }).catch((error) => {
          alert('Error extracting ZIP file: ' + error);
          this.loading = false;
        });
      }).catch((error) => {
        alert('Error reading ZIP file: ' + error);
        this.loading = false;
      });
    }
  }
  
  extractInfoFromFolderName(folderName: string): [string, string, string] {
    const parts = folderName.split('_');
    if (parts.length >= 3) {
      const firstName = parts[0];
      const lastName = parts[1];
      const studentNumber = parts[2];
      return [firstName, lastName, studentNumber];
    } else {
      return ['', '', ''];
    }
  }
  
  processSubmissionPDF(pdfData: Uint8Array, assessmentID: number, firstName: string, lastName: string, studentNumber: string): void {
    const submissionInfo = {
      AssessmentID: assessmentID,
      SubmissionPDF: pdfData,
      StudentNum: studentNumber,
      StudentName: firstName,
      StudentSurname: lastName,
      SubmissionStatus: 'Unmarked'
    };
  
    try {
      this.api.addSubmission(submissionInfo).subscribe((res: any) => {
        if (res && res.message === 'Submission added successfully') {
          console.log(`Submission added for ${firstName} ${lastName} (${studentNumber})`);
        }
      });
    } catch (error) {
      alert('Failed to add submission. Please try again.');
    }
  }
  
  onMemoFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedMemoFile = file;
      this.assessmentForm.patchValue({
        selectedFile: file
      });
    } else {
      alert('Invalid file type. Please select a ZIP or PDF file.');
    }
  }

  onSubmissionsFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedSubmissionsFile = file;
    } else {
      alert('Invalid file type. Please select a ZIP file.');
    }
  }

  onMemoDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.selectedMemoFile = file;
      this.assessmentForm.patchValue({
        selectedFile: file
      });
    } else {
      alert('Invalid file type. Please select a PDF file.');
    }
    this.removeDragOverClass();
  }

  onSubmissionsDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.selectedSubmissionsFile = file;
    } else {
      alert('Invalid file type. Please select a ZIP file.');
    }
    this.removeDragOverClass();
  }
  
  onInputChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const inputValue = inputElement.value.trim();
    if (isNaN(parseInt(inputValue, 10))) {
      this.assessmentForm.patchValue({
        totalMarks: null
      });
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.addDragOverClass();
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.removeDragOverClass();
  }

  addDragOverClass(): void {
    const dropzone = document.querySelector('.dropzone');
    dropzone?.classList.add('dragover');
  }

  removeDragOverClass(): void {
    const dropzone = document.querySelector('.dropzone');
    dropzone?.classList.remove('dragover');
  }

  onLogout(): void {
    sessionStorage.removeItem('email');
    this.router.navigateByUrl('/login');
  }

  onDashboard(): void {
    this.router.navigateByUrl('/dashboard');
  }
}
